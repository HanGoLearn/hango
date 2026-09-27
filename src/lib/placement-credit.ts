import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import {
  computeCategoryProgress,
  type PlacementSkillName,
  type PlacementQuestionMeta,
} from "@/lib/placement-exam";
import { computeReflectionTotal } from "@/lib/points-system";
import {
  finalizeScenarioCompletionBatch,
  getOrGenerateScenarioCompletion,
  type DeferredScenarioCompletion,
} from "@/lib/scenario-completion";

/**
 * Levels 7-9 are diagnostic only, never real placement/points
 * (points_system.md's Lab-evidence-only rule) - same boundary
 * placement-exam-home.tsx's DIAGNOSTIC_ONLY_LEVEL enforces for display.
 * Auto-credit is capped one level below it.
 */
const MAX_CREDITABLE_LEVEL = 6;

export interface PlacementCreditResult {
  /** The lowest of every placed skill (written + Speaking, when attempted) - what actually gated eligibility. */
  creditedLevel: number;
  creditedLessonCount: number;
}

/**
 * "How placement results become real Learning Journey credit"
 * (project/TASKS.md, 2026-08-16, scoped to General Level points only per
 * the 2026-08-24 "avanzalo" request - no lesson-skip UX, just the points +
 * a badge inviting the learner to do it for real).
 *
 * Creates a real LearnerLessonCompletion + LessonReflectionReport per
 * lesson at or below the learner's placed level (the lowest of every
 * skill - "never place above what's weakest", same principle Speaking
 * already uses against the other 4 skills), tagged source: "PLACEMENT" so
 * the Learning Journey UI can show a distinct badge instead of treating it
 * as a real completion. Feeds the completely unchanged
 * computeReflectionTotal -> getOrGenerateScenarioCompletion ->
 * recomputeGeneralLevelPoints pipeline - no new scoring formula.
 *
 * Safe to call more than once for the same session (e.g. a retry after a
 * network error): already-completed lessons (real or placement-derived)
 * are skipped, never overwritten.
 */
export async function applyPlacementCredit(
  userId: string,
  sessionId: string,
): Promise<PlacementCreditResult | null> {
  const session = await db.placementSession.findFirst({
    where: { id: sessionId, userId, status: "COMPLETED" },
  });
  if (!session) return null;
  const {
    vocabularyHskLevel,
    grammarHskLevel,
    readingHskLevel,
    listeningHskLevel,
  } = session;
  if (
    vocabularyHskLevel == null ||
    grammarHskLevel == null ||
    readingHskLevel == null ||
    listeningHskLevel == null
  ) {
    return null;
  }

  const writtenLevels = [
    vocabularyHskLevel,
    grammarHskLevel,
    readingHskLevel,
    listeningHskLevel,
  ];
  const speakingAttempts = await db.placementSpeakingAttempt.findMany({
    where: { sessionId, status: "COMPLETED", score: { not: null } },
    orderBy: { hskLevel: "asc" },
    select: { hskLevel: true, score: true },
  });
  const creditedLevel =
    session.speakingHskLevel != null
      ? Math.min(...writtenLevels, session.speakingHskLevel)
      : Math.min(...writtenLevels);
  const eligibleLevel = Math.min(creditedLevel, MAX_CREDITABLE_LEVEL);
  if (eligibleLevel < 1) {
    return { creditedLevel, creditedLessonCount: 0 };
  }

  const lessons = await db.lesson.findMany({
    where: { status: "PUBLISHED", hskReference: { lte: eligibleLevel } },
    select: {
      id: true,
      hskReference: true,
      scenarioLevel: { select: { scenarioId: true } },
      vocabulary: { select: { vocabularyItemId: true } },
    },
  });
  if (lessons.length === 0) {
    return { creditedLevel, creditedLessonCount: 0 };
  }

  const existingCompletions = await db.learnerLessonCompletion.findMany({
    where: { userId, lessonId: { in: lessons.map((l) => l.id) } },
    select: { lessonId: true },
  });
  const alreadyDone = new Set(existingCompletions.map((c) => c.lessonId));
  const toCredit = lessons.filter((lesson) => !alreadyDone.has(lesson.id));
  if (toCredit.length === 0) {
    return { creditedLevel, creditedLessonCount: 0 };
  }

  const attemptRows = await db.placementAttempt.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      questionId: true,
      isCorrect: true,
      question: { select: { skill: true, hskLevel: true, category: true } },
    },
  });
  const questionMetas = new Map<string, PlacementQuestionMeta>(
    attemptRows.map((row) => [
      row.questionId,
      {
        id: row.questionId,
        skill: row.question.skill,
        hskLevel: row.question.hskLevel,
        category: row.question.category,
        type: "MULTIPLE_CHOICE",
      },
    ]),
  );
  const progress = computeCategoryProgress(
    attemptRows.map((row, index) => ({
      questionId: row.questionId,
      isCorrect: row.isCorrect,
      sequence: index + 1,
    })),
    questionMetas,
  );

  function ratioAt(skill: PlacementSkillName, level: number): number | null {
    const byCategory = progress.get(skill)?.get(level);
    if (!byCategory) return null;
    let attempted = 0;
    let correct = 0;
    for (const stats of byCategory.values()) {
      attempted += stats.attempted;
      correct += stats.correct;
    }
    return attempted > 0 ? correct / attempted : null;
  }

  function speakingScoreAt(level: number): number | null {
    if (speakingAttempts.length === 0) return null;
    const exact = speakingAttempts.find((a) => a.hskLevel === level);
    if (exact?.score != null) return Math.round(exact.score);
    // Nothing tested at exactly this level - fall back to the best evidence
    // at or below it (speaking ability demonstrated at a higher tested
    // level implies at least that much at an easier one). Leaves the score
    // null (not evaluated) when this level is below every attempted one.
    const below = speakingAttempts.filter(
      (a) => a.hskLevel <= level && a.score != null,
    );
    return below.length > 0
      ? Math.round(Math.max(...below.map((a) => a.score!)))
      : null;
  }

  // A high placement can credit 100+ lessons. Sending two upserts per lesson
  // used to mean hundreds of remote database operations and could exceed five
  // minutes. The same unique (userId, lessonId) constraints make two bulk
  // inserts with skipDuplicates equally idempotent while keeping the learner's
  // completion rows and reflection reports atomic.
  const completionRows: Prisma.LearnerLessonCompletionCreateManyInput[] = [];
  const reportRows: Prisma.LessonReflectionReportCreateManyInput[] = [];
  const scenarioIds = new Set<string>();
  const placementRewardsGrantedAt = new Date();

  for (const lesson of toCredit) {
    const level = lesson.hskReference!;
    const vocabRatio = ratioAt("VOCABULARY", level);
    const grammarRatio = ratioAt("GRAMMAR", level);
    const comprehensionRatios = [
      ratioAt("READING", level),
      ratioAt("LISTENING", level),
    ].filter((ratio): ratio is number => ratio != null);

    const vocabularyScore =
      vocabRatio != null ? Math.round(vocabRatio * 100) : null;
    const grammarScore =
      grammarRatio != null ? Math.round(grammarRatio * 100) : null;
    const comprehensionScore =
      comprehensionRatios.length > 0
        ? Math.round(
            (comprehensionRatios.reduce((sum, r) => sum + r, 0) /
              comprehensionRatios.length) *
              100,
          )
        : null;
    const speakingScore = speakingScoreAt(level);
    const totalScore = computeReflectionTotal({
      vocabularyScore,
      grammarScore,
      comprehensionScore,
      speakingScore,
    });

    completionRows.push({
      userId,
      lessonId: lesson.id,
      source: "PLACEMENT",
    });
    reportRows.push({
      userId,
      lessonId: lesson.id,
      vocabularyCovered: 0,
      vocabularyTotal: lesson.vocabulary.length,
      vocabularyScore,
      grammarScore,
      comprehensionScore,
      speakingScore,
      totalScore,
      hanNarrative:
        "This lesson was placed from your placement exam result, not a real attempt.",
      strengths: [],
      improvements: [
        "Complete this lesson yourself to confirm or improve this score.",
      ],
      // Placement credit never owes the lesson_completed coin grant or
      // reflection achievements (this path bypasses
      // getOrGenerateLessonReflectionReport's reward chain entirely) -
      // marked settled at creation so a later read there doesn't treat
      // this as a pending, never-yet-retried reward and grant it late.
      rewardsGrantedAt: placementRewardsGrantedAt,
    });
    scenarioIds.add(lesson.scenarioLevel.scenarioId);
  }
  await db.$transaction(
    [
      db.learnerLessonCompletion.createMany({
        data: completionRows,
        skipDuplicates: true,
      }),
      db.lessonReflectionReport.createMany({
        data: reportRows,
        skipDuplicates: true,
      }),
    ],
    { timeout: 30_000 },
  );

  const deferredCompletions: DeferredScenarioCompletion[] = [];
  const scenarioIdList = [...scenarioIds];
  const SCENARIO_BATCH_SIZE = 6;
  for (
    let offset = 0;
    offset < scenarioIdList.length;
    offset += SCENARIO_BATCH_SIZE
  ) {
    const batch = scenarioIdList.slice(offset, offset + SCENARIO_BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (scenarioId) => ({
        scenarioId,
        result: await getOrGenerateScenarioCompletion(userId, scenarioId, {
          deferRewards: true,
        }),
      })),
    );
    for (const { scenarioId, result } of results) {
      if (result) {
        deferredCompletions.push({ scenarioId, chapter: result.chapter });
      }
    }
  }
  await finalizeScenarioCompletionBatch(userId, deferredCompletions);

  return { creditedLevel, creditedLessonCount: toCredit.length };
}
