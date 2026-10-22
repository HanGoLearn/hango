import "server-only";
import { JOURNEY_UNIFIED_POLICY } from "@/lib/journey-unified-policy";
import { buildJourneySpeakingLevel } from "@/lib/journey-speaking-level";
import { createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { canAccessLesson } from "@/lib/lesson-progress-data";
import { isJourneyChapterAccessible } from "@/lib/beta-learning-scope";
import { resolveJourneyChapter } from "@/lib/content/learning-journey";
import { getJourneySpeakingBanks } from "@/lib/content/journey-speaking-bank-data";
import { getJourneyAssessmentSnapshot } from "@/lib/journey-assessment-snapshot";
import {
  JOURNEY_RUBRIC_VERSION,
  JourneyAttemptStartSchema,
  JourneyAttemptSealSchema,
  JourneyRecognitionSchema,
  JourneyCaptureQualitySchema,
  type JourneyAttemptSnapshot,
} from "@/lib/journey-speaking-attempt-contract";

export class JourneyAttemptAccessError extends Error {}
export class JourneyAttemptConflictError extends Error {}

function digest(value: unknown): string {
  // JSONB does not preserve object key order. Arrays/turn order do matter.
  function canonical(input: unknown): unknown {
    if (Array.isArray(input)) return input.map(canonical);
    if (input && typeof input === "object")
      return Object.fromEntries(
        Object.entries(input)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([key, item]) => [key, canonical(item)]),
      );
    return input;
  }
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}

/** Prepared server service: no UI activation or provider call in this part. */
export async function startJourneySpeakingAttempt(
  userId: string,
  input: unknown,
) {
  const parsed = JourneyAttemptStartSchema.parse(input);
  if (!userId) throw new JourneyAttemptAccessError("Not authenticated");
  const existing = await db.journeySpeakingAttempt.findUnique({
    where: { userId_requestKey: { userId, requestKey: parsed.requestKey } },
  });
  if (existing) {
    if (
      existing.lessonId !== parsed.lessonId ||
      existing.locale !== parsed.locale
    )
      throw new JourneyAttemptConflictError("Request key already used");
    return existing;
  }
  const [user, lesson] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        learnerProfile: { select: { generalLevelPoints: true } },
      },
    }),
    db.lesson.findFirst({
      where: {
        id: parsed.lessonId,
        status: "PUBLISHED",
        steps: { some: { type: "SPEAKING" } },
        scenarioLevel: { scenario: { status: "PUBLISHED" } },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        hskReference: true,
        scenarioLevelId: true,
        scenarioLevel: {
          select: {
            difficulty: true,
            scenario: { select: { levels: { select: { difficulty: true } } } },
          },
        },
        missions: {
          where: { status: "PUBLISHED" },
          orderBy: { id: "asc" },
          take: 1,
          select: {
            aiRole: true,
            learnerRole: true,
            objective: true,
            context: true,
            successConditions: {
              orderBy: { order: "asc" },
              take: 16,
              select: { id: true, description: true },
            },
          },
        },
      },
    }),
  ]);
  if (!user || !lesson || !lesson.missions[0])
    throw new JourneyAttemptAccessError("Speaking lesson unavailable");
  const chapter = resolveJourneyChapter(
    lesson.scenarioLevel.scenario.levels.map((level) => level.difficulty),
  );
  if (
    !isJourneyChapterAccessible(chapter, user.role) ||
    !(await canAccessLesson(userId, lesson))
  )
    throw new JourneyAttemptAccessError("Speaking lesson unavailable");
  const banks = await getJourneySpeakingBanks(userId, lesson.id);
  if (!banks || banks.reviewIssues.length)
    throw new JourneyAttemptAccessError("Reviewed lesson bank unavailable");
  const mission = lesson.missions[0];
  const assessment = await getJourneyAssessmentSnapshot(userId, lesson.id);
  const snapshot: JourneyAttemptSnapshot = {
    lessonId: lesson.id,
    lessonSlug: lesson.slug,
    lessonTitle: lesson.title,
    difficulty: lesson.scenarioLevel.difficulty,
    hskReference: lesson.hskReference,
    speakingLevel: buildJourneySpeakingLevel(
      lesson.hskReference,
      lesson.scenarioLevel.difficulty,
      user.learnerProfile?.generalLevelPoints ?? 0,
    ),
    aiRole: mission.aiRole ?? "conversation partner",
    learnerRole: mission.learnerRole ?? "learner",
    objective: mission.objective,
    scenarioContext: mission.context ?? mission.objective,
    successConditions: mission.successConditions.map((condition) => ({
      id: condition.id,
      text: condition.description,
    })),
    banks,
    ...(assessment ? { assessment } : {}),
    // Owner can test the real unified lesson report without silently switching
    // other students or relabeling an existing frozen attempt as the new rubric.
    ...(user.role === "ADMINISTRATOR"
      ? { evaluationPolicy: JOURNEY_UNIFIED_POLICY }
      : {}),
  };
  try {
    return await db.$transaction(
      async (tx) => {
        if (assessment) {
          const currentRun = await tx.learnerLessonProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId: lesson.id } },
            select: { id: true, startedAt: true },
          });
          if (
            currentRun?.id !== assessment.progressId ||
            currentRun.startedAt.toISOString() !== assessment.progressStartedAt
          )
            throw new JourneyAttemptConflictError(
              "Lesson run changed during capture preparation",
            );
        }
        const recent = await tx.journeySpeakingAttempt.count({
          where: {
            userId,
            startedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
          },
        });
        if (recent >= 30)
          throw new JourneyAttemptConflictError(
            "Too many recent Journey attempts",
          );
        // A crashed/offline browser cannot guarantee delivery of its abandonment
        // callback. Expire only never-sealed attempts; do not rewrite reports.
        await tx.journeySpeakingAttempt.updateMany({
          where: {
            userId,
            status: "ACTIVE",
            startedAt: { lt: new Date(Date.now() - 20 * 60 * 1000) },
          },
          data: {
            status: "CANCELLED",
            closeReason: "ABANDONED",
            finishedAt: new Date(),
            captureHash: digest({ closeReason: "ABANDONED", turns: [] }),
          },
        });
        const active = await tx.journeySpeakingAttempt.count({
          where: { userId, status: "ACTIVE" },
        });
        if (active >= 3)
          throw new JourneyAttemptConflictError(
            "Finish or cancel an active attempt first",
          );
        return tx.journeySpeakingAttempt.create({
          data: {
            userId,
            lessonId: lesson.id,
            requestKey: parsed.requestKey,
            locale: parsed.locale,
            rubricVersion: JOURNEY_RUBRIC_VERSION,
            bankVersion: banks.version,
            snapshotHash: digest(snapshot),
            snapshot: snapshot as unknown as Prisma.InputJsonValue,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const winner = await db.journeySpeakingAttempt.findUnique({
        where: { userId_requestKey: { userId, requestKey: parsed.requestKey } },
      });
      if (
        winner?.lessonId === parsed.lessonId &&
        winner.locale === parsed.locale
      )
        return winner;
    }
    throw error;
  }
}

/** Atomic one-time seal; repeated identical submissions never duplicate turns. */
export async function sealJourneySpeakingAttempt(
  userId: string,
  input: unknown,
) {
  const capture = JourneyAttemptSealSchema.parse(input);
  if (!userId) throw new JourneyAttemptAccessError("Not authenticated");
  const captureHash = digest({
    closeReason: capture.closeReason,
    turns: capture.turns,
    ...(capture.quality ? { quality: capture.quality } : {}),
  });
  return db.$transaction(async (tx) => {
    const current = await tx.journeySpeakingAttempt.findFirst({
      where: { id: capture.attemptId, userId, lessonId: capture.lessonId },
    });
    if (!current) throw new JourneyAttemptAccessError("Attempt unavailable");
    if (
      capture.quality?.sessionAudio &&
      capture.quality.sessionAudio.locale !== current.locale
    )
      throw new JourneyAttemptConflictError(
        "Session audio review locale mismatch",
      );
    if (current.status !== "ACTIVE") {
      if (current.captureHash === captureHash) return current;
      throw new JourneyAttemptConflictError("Attempt already sealed");
    }
    const status =
      capture.closeReason === "TECHNICAL_FAILURE"
        ? "TECHNICAL_FAILURE"
        : capture.closeReason === "ABANDONED"
          ? "CANCELLED"
          : "SEALED";
    const claim = await tx.journeySpeakingAttempt.updateMany({
      where: { id: current.id, userId, status: "ACTIVE" },
      data: {
        status,
        closeReason: capture.closeReason,
        captureHash,
        captureQuality: capture.quality as Prisma.InputJsonValue | undefined,
        finishedAt: new Date(),
      },
    });
    if (claim.count !== 1) {
      const winner = await tx.journeySpeakingAttempt.findUnique({
        where: { id: current.id },
      });
      if (winner?.captureHash === captureHash) return winner;
      throw new JourneyAttemptConflictError("Attempt changed concurrently");
    }
    if (capture.turns.length)
      await tx.journeySpeakingTurn.createMany({
        data: capture.turns.map((turn, sequence) => ({
          attemptId: current.id,
          sequence,
          role: turn.role === "user" ? "USER" : "ASSISTANT",
          content: turn.content,
          recognition: turn.recognition as Prisma.InputJsonValue | undefined,
        })),
      });
    return tx.journeySpeakingAttempt.findUniqueOrThrow({
      where: { id: current.id },
    });
  });
}

export async function getJourneySpeakingAttempt(
  userId: string,
  attemptId: string,
  lessonId: string,
  client: Prisma.TransactionClient = db,
) {
  if (
    !userId ||
    !attemptId ||
    attemptId.length > 100 ||
    !lessonId ||
    lessonId.length > 100
  )
    throw new JourneyAttemptAccessError("Attempt unavailable");
  const attempt = await client.journeySpeakingAttempt.findFirst({
    where: { id: attemptId, userId, lessonId },
    include: {
      turns: { orderBy: { sequence: "asc" }, take: 80 },
      evaluation: true,
    },
  });
  if (!attempt) throw new JourneyAttemptAccessError("Attempt unavailable");
  if (attempt.snapshotHash !== digest(attempt.snapshot))
    throw new JourneyAttemptConflictError("Attempt snapshot integrity failure");
  if (attempt.status !== "ACTIVE") {
    const turns = attempt.turns.map((turn, sequence) => {
      if (turn.sequence !== sequence)
        throw new JourneyAttemptConflictError(
          "Attempt turn order integrity failure",
        );
      return {
        role: turn.role === "USER" ? "user" : "assistant",
        content: turn.content,
        ...(turn.recognition
          ? { recognition: JourneyRecognitionSchema.parse(turn.recognition) }
          : {}),
      };
    });
    if (
      attempt.captureHash !==
      digest({
        closeReason: attempt.closeReason,
        turns,
        ...(attempt.captureQuality
          ? {
              quality: JourneyCaptureQualitySchema.parse(
                attempt.captureQuality,
              ),
            }
          : {}),
      })
    )
      throw new JourneyAttemptConflictError(
        "Attempt capture integrity failure",
      );
  }
  return attempt;
}
