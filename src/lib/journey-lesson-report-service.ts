import "server-only";
import { db } from "@/lib/db";
import { canRecoverJourneyEvaluation } from "@/lib/journey-evaluation-recovery";
import { Prisma } from "@/generated/prisma/client";
import { recomputeGeneralLevelPoints } from "@/lib/general-level";
import { checkReflectionAchievements } from "@/lib/achievements";
import { getLessonCompetencyIds } from "@/lib/progress-evidence";
import { normalizeDifficulty } from "@/lib/competency-progress";
import {
  getJourneySpeakingAttempt,
  JourneyAttemptAccessError,
} from "@/lib/journey-speaking-attempts";
import {
  evaluateJourneySpeakingAttempt,
  JOURNEY_PROCESSING_DEADLINE_MS,
} from "@/lib/journey-speaking-evaluation-service";
import {
  JOURNEY_RUBRIC_VERSION,
  JourneyRecognitionSchema,
  JourneyCaptureQualitySchema,
  type JourneyAttemptSnapshot,
} from "@/lib/journey-speaking-attempt-contract";
import {
  validateStoredJourneyReport,
  hasSubstantiveJourneyTurn,
  type JourneyEvaluationContext,
} from "@/lib/journey-speaking-evaluation";
import {
  buildJourneyLessonReport,
  JourneyAssessmentSnapshotSchema,
  JourneySpeakingStepResponseSchema,
  JourneyReportProvenanceSchema,
  JOURNEY_LESSON_REPORT_VERSION,
  type JourneyLessonReportView,
  passedJourneyQuickTestEvidence,
} from "@/lib/journey-lesson-report";

/** Selected by the completed Speaking step of the CURRENT server-owned run,
 * never by a client report ID, translated title, or latest global chat. */
async function getSelectedAttempt(
  userId: string,
  lessonId: string,
  client: Prisma.TransactionClient = db,
) {
  if (!userId || !lessonId || lessonId.length > 100)
    throw new JourneyAttemptAccessError("Lesson report unavailable");
  const progress = await client.learnerLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: {
      id: true,
      startedAt: true,
      responses: true,
      completedStepIds: true,
      lesson: {
        select: {
          steps: {
            where: { type: "SPEAKING" },
            select: { id: true },
            take: 2,
          },
        },
      },
    },
  });
  const step = progress?.lesson.steps[0];
  if (
    !progress ||
    progress.lesson.steps.length !== 1 ||
    !step ||
    !progress.completedStepIds.includes(step.id)
  )
    throw new JourneyAttemptAccessError("Completed Speaking step required");
  const responses = progress.responses as Record<string, unknown>;
  const selected = JourneySpeakingStepResponseSchema.safeParse(
    responses[step.id],
  );
  if (!selected.success)
    throw new JourneyAttemptAccessError("Selected Journey attempt required");
  const attempt = await getJourneySpeakingAttempt(
    userId,
    selected.data.journeySpeakingAttemptId,
    lessonId,
    client,
  );
  const snapshot = attempt.snapshot as unknown as JourneyAttemptSnapshot;
  const assessment = JourneyAssessmentSnapshotSchema.safeParse(
    snapshot.assessment,
  );
  if (
    !assessment.success ||
    assessment.data.progressId !== progress.id ||
    assessment.data.progressStartedAt !== progress.startedAt.toISOString() ||
    attempt.startedAt < progress.startedAt ||
    !attempt.finishedAt ||
    !["SEALED", "TECHNICAL_FAILURE"].includes(attempt.status) ||
    attempt.rubricVersion !== JOURNEY_RUBRIC_VERSION ||
    snapshot.banks.version !== attempt.bankVersion ||
    !["es", "en"].includes(attempt.locale)
  )
    throw new JourneyAttemptAccessError("Selected Journey attempt unavailable");
  // Read-only compatibility repair for frozen snapshots made before the
  // quick-test bug fix. Use only first server answers from the original time
  // window; never regrade against edited content or later practice/another run.
  if (assessment.data.vocabulary.some((entry) => entry.attemptId === null)) {
    const wordIds = [
      ...new Set(
        assessment.data.vocabulary.map((entry) => entry.key.split(":")[0]!),
      ),
    ];
    const answers = await client.vocabularyQuizAttempt.findMany({
      where: {
        userId,
        lessonId,
        questionKey: { in: wordIds.map((id) => `${id}:quicktest`) },
        createdAt: {
          gte: new Date(assessment.data.progressStartedAt),
          lte: new Date(assessment.data.capturedAt),
        },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 10_000,
      select: { id: true, questionKey: true, isCorrect: true },
    });
    if (answers.length === 10_000)
      throw new JourneyAttemptAccessError("Assessment read limit reached");
    const quick = passedJourneyQuickTestEvidence(
      wordIds,
      answers.map((row) => ({ ...row, key: row.questionKey })),
    );
    if (quick) assessment.data.vocabulary = quick;
  }
  return { attempt, snapshot, assessment: assessment.data };
}

/** Prepared report reader. Reading/polling never dispatches an AI request,
 * writes legacy grades, settles rewards, or repairs a bad cache using AI. */
function buildSelectedReport({
  attempt,
  snapshot,
  assessment,
}: Awaited<ReturnType<typeof getSelectedAttempt>>) {
  const evaluation = attempt.evaluation;
  let state = evaluation?.status ?? "PENDING";
  // An empty/no-microphone capture has nothing to send to a judge. This is
  // a read-only derived state, not a fabricated zero or a provider request.
  if (
    !evaluation &&
    !hasSubstantiveJourneyTurn(
      attempt.turns.map((turn) => ({
        id: turn.id,
        sequence: turn.sequence,
        role: turn.role === "USER" ? "user" : "assistant",
        content: turn.content,
      })),
    )
  )
    state = "INSUFFICIENT";
  // A crashed worker must not keep the UI waiting forever. The reader never
  // retries or mutates the evaluation; the expired result cannot earn points.
  if (
    state === "PROCESSING" &&
    (!evaluation?.processingStartedAt ||
      Date.now() - evaluation.processingStartedAt.getTime() >
        JOURNEY_PROCESSING_DEADLINE_MS)
  )
    state = "FAILED";
  let report = null;
  if (
    evaluation?.report &&
    ["COMPLETE", "PARTIAL", "INSUFFICIENT"].includes(evaluation.status)
  ) {
    const context: JourneyEvaluationContext = {
      snapshot,
      locale: attempt.locale as "es" | "en",
      closeReason: attempt.closeReason!,
      turns: attempt.turns.map((turn) => ({
        id: turn.id,
        sequence: turn.sequence,
        role: turn.role === "USER" ? "user" : "assistant",
        content: turn.content,
        ...(turn.recognition
          ? { recognition: JourneyRecognitionSchema.parse(turn.recognition) }
          : {}),
      })),
      ...(attempt.captureQuality
        ? { quality: JourneyCaptureQualitySchema.parse(attempt.captureQuality) }
        : {}),
    };
    report =
      evaluation.rubricVersion === attempt.rubricVersion &&
      evaluation.locale === attempt.locale
        ? validateStoredJourneyReport(
            evaluation.report,
            context,
            evaluation.status,
            evaluation.score,
          )
        : null;
    if (!report) state = "FAILED";
  } else if (["COMPLETE", "PARTIAL"].includes(state)) state = "FAILED";
  const view = buildJourneyLessonReport(
    attempt.id,
    attempt.locale as "es" | "en",
    assessment,
    state,
    report,
  );
  if (
    attempt.status === "TECHNICAL_FAILURE" ||
    attempt.closeReason === "ABANDONED"
  )
    view.speaking.reason = "TECHNICAL_CAPTURE";
  else if (state === "FAILED") view.speaking.reason = "EVALUATION_FAILED";
  else if (
    state === "INSUFFICIENT" &&
    !attempt.turns.some((turn) => turn.role === "USER")
  )
    view.speaking.reason = "NO_SPEECH";
  view.speaking.canRetry = Boolean(
    evaluation &&
    attempt.status === "SEALED" &&
    canRecoverJourneyEvaluation({
      ...evaluation,
      status: state,
      failureCode:
        evaluation.status === "PROCESSING" && state === "FAILED"
          ? "processing_expired"
          : evaluation.failureCode,
    }),
  );
  return view;
}

type Projection = NonNullable<
  Awaited<ReturnType<typeof db.lessonReflectionReport.findUnique>>
>;

function projectionMatches(
  row: Projection,
  report: JourneyLessonReportView,
  assessment: { progressId: string; progressStartedAt: string },
) {
  const provenance = JourneyReportProvenanceSchema.safeParse(
    row.speakingDimensions,
  );
  return (
    provenance.success &&
    provenance.data.attemptId === report.attemptId &&
    provenance.data.progressId === assessment.progressId &&
    provenance.data.progressStartedAt === assessment.progressStartedAt &&
    row.totalScore === report.overall.score &&
    row.vocabularyScore === report.categories.vocabulary.score &&
    row.grammarScore === report.categories.grammar.score &&
    row.comprehensionScore === report.categories.comprehension.score &&
    row.speakingScore === report.speaking.score
  );
}

/** Read-only: feedback comes from the revalidated attempt, not this projection.
 * The marker only confirms a committed settlement for this exact run/grade. */
export async function getJourneyLessonReport(
  userId: string,
  lessonId: string,
  client: Prisma.TransactionClient = db,
) {
  const selected = await getSelectedAttempt(userId, lessonId, client);
  const report = buildSelectedReport(selected);
  const row = await client.lessonReflectionReport.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  if (
    row?.rewardsGrantedAt &&
    report.rewards.eligible &&
    projectionMatches(row, report, selected.assessment)
  )
    report.rewards.settlement = "SETTLED";
  return report;
}

/** Explicit save/settlement; NO provider call. Projection, coins, evidence,
 * General Level and grade/level achievements commit together or all roll back.
 * Replays and lesson redos use existing once-per-lesson coin keys, not per-attempt
 * rewards. Only serialization conflicts retry, never paid evaluation. */
export async function persistJourneyLessonReport(
  userId: string,
  lessonId: string,
) {
  const competencyIds = await getLessonCompetencyIds(lessonId, "SPEAKING");
  for (let retry = 0; ; retry++) {
    try {
      return await db.$transaction(
        async (tx) => {
          // Serialize v2 settlements for the same learner before deriving GP.
          // A missing profile may hold a pending report, but cannot claim GP settled.
          const profile = await tx.learnerProfile.updateMany({
            where: { userId },
            data: { generalLevelPoints: { increment: 0 } },
          });
          const selected = await getSelectedAttempt(userId, lessonId, tx);
          const report = buildSelectedReport(selected);
          const existing = await tx.lessonReflectionReport.findUnique({
            where: { userId_lessonId: { userId, lessonId } },
          });
          if (existing) {
            const provenance = JourneyReportProvenanceSchema.safeParse(
              existing.speakingDimensions,
            );
            if (
              !provenance.success ||
              provenance.data.attemptId !== report.attemptId ||
              provenance.data.progressId !== selected.assessment.progressId ||
              provenance.data.progressStartedAt !==
                selected.assessment.progressStartedAt
            )
              throw new JourneyAttemptAccessError(
                "Existing report belongs to another evaluation; explicit redo required",
              );
            if (existing.rewardsGrantedAt) {
              if (
                !report.rewards.eligible ||
                !projectionMatches(existing, report, selected.assessment)
              )
                throw new JourneyAttemptAccessError(
                  "Settled report integrity failure",
                );
              report.rewards.settlement = "SETTLED";
              return report;
            }
          }
          if (report.rewards.eligible && profile.count !== 1)
            throw new JourneyAttemptAccessError(
              "Learner profile required for settlement",
            );
          const feedback = report.speaking.report?.feedback;
          const data = {
            vocabularyCovered: 0, // Coverage is not inferred from quiz answers.
            vocabularyTotal: new Set(
              selected.assessment.vocabulary.map(
                (entry) => entry.key.split(":")[0],
              ),
            ).size,
            vocabularyScore: report.categories.vocabulary.score,
            grammarScore: report.categories.grammar.score,
            comprehensionScore: report.categories.comprehension.score,
            speakingScore: report.speaking.score,
            totalScore: report.overall.score,
            hanNarrative: feedback?.summary ?? "",
            strengths: feedback?.achievement ? [feedback.achievement.text] : [],
            improvements: feedback?.priority ? [feedback.priority.text] : [],
            // Explicit provenance, NOT the old acoustic dimension structure.
            speakingDimensions: {
              version: JOURNEY_LESSON_REPORT_VERSION,
              attemptId: report.attemptId,
              progressId: selected.assessment.progressId,
              progressStartedAt: selected.assessment.progressStartedAt,
            },
            rewardsGrantedAt: report.rewards.eligible ? new Date() : null,
          };
          await tx.lessonReflectionReport.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            create: { userId, lessonId, ...data },
            update: data,
          });
          if (report.rewards.eligible) {
            await tx.coinLedgerEntry.createMany({
              data: [
                {
                  userId,
                  amount: report.overall.stars!,
                  reason: "lesson_completed",
                  sourceKey: `lesson:${lessonId}`,
                },
              ],
              skipDuplicates: true,
            });
            // Stable activity ID replaces this lesson's evidence on a deliberate
            // redo; partial results never manufacture competency evidence.
            const relatedActivityId = `lesson-reflection-speaking:${lessonId}`;
            await tx.progressEvidence.deleteMany({
              where: { userId, source: "SPEAKING", relatedActivityId },
            });
            if (competencyIds.length)
              await tx.progressEvidence.createMany({
                data: competencyIds.map((competencyId) => ({
                  userId,
                  competencyId,
                  source: "SPEAKING" as const,
                  result: report.speaking.score! / 100,
                  difficulty: normalizeDifficulty("SPEAKING", null),
                  relatedActivityId,
                })),
              });
            await checkReflectionAchievements(
              userId,
              report.overall.score!,
              tx,
            );
            await recomputeGeneralLevelPoints(userId, tx);
            report.rewards.settlement = "SETTLED";
          }
          return report;
        },
        { isolationLevel: "Serializable", timeout: 15_000 },
      );
    } catch (error) {
      if (
        retry < 3 &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034"
      )
        continue;
      throw error;
    }
  }
}

/** Explicit generation separated from read/poll. Existing one-dispatch lease
 * and usage limits remain authoritative. No second narrative or paid retry. */
export async function evaluateJourneyLessonReport(
  userId: string,
  lessonId: string,
  options: { recoverFailed?: boolean } = {},
) {
  const { attempt } = await getSelectedAttempt(userId, lessonId);
  await evaluateJourneySpeakingAttempt(userId, attempt.id, lessonId, options);
  // A concurrent redo cannot attach the old result to a new progress row.
  const report = await getJourneyLessonReport(userId, lessonId);
  if (report.attemptId !== attempt.id)
    throw new JourneyAttemptAccessError("Lesson run changed during evaluation");
  return report;
}
