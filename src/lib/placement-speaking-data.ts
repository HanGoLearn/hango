import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import {
  nextPlacementSpeakingLevel,
  placementSpeakingStartLevel,
  PLACEMENT_SPEAKING_PASS_SCORE,
  type PlacementSpeakingEvaluation,
  type PlacementSpeakingLevel,
} from "@/lib/placement-speaking";
import type { SpeakingTranscriptMessage } from "@/lib/reflection-prompt";

export class PlacementSpeakingInvalidStateError extends Error {}
export class PlacementSpeakingNotFoundError extends Error {}

export interface PlacementSpeakingAttemptHandle {
  attemptId: string;
  level: PlacementSpeakingLevel;
  lastPassedScore: number | null;
}

export interface PlacementSpeakingOutcomeRecord {
  creditedLevel: number;
  diagnosticLevel: PlacementSpeakingLevel | null;
}

export interface PlacementSpeakingCompletionRecord {
  evaluation: PlacementSpeakingEvaluation;
  nextAttempt: PlacementSpeakingAttemptHandle | null;
  outcome: PlacementSpeakingOutcomeRecord | null;
}

const STALE_GRADING_MS = 2 * 60 * 1000;

type SpeakingSession = Awaited<
  ReturnType<typeof loadOwnedSpeakingSession>
>;

function loadOwnedSpeakingSession(
  tx: Prisma.TransactionClient,
  userId: string,
  sessionId: string,
) {
  return tx.placementSession.findFirst({
    where: { id: sessionId, userId, status: "SPEAKING" },
    include: {
      speakingAttempts: { orderBy: { hskLevel: "asc" } },
    },
  });
}

function startingLevelForSession(
  session: NonNullable<SpeakingSession>,
): PlacementSpeakingLevel {
  const level = placementSpeakingStartLevel([
    session.vocabularyHskLevel,
    session.grammarHskLevel,
    session.readingHskLevel,
    session.listeningHskLevel,
  ]);
  if (level == null) {
    throw new PlacementSpeakingInvalidStateError(
      "This placement session is not eligible for the speaking stage.",
    );
  }
  return level;
}

function expectedLevelForSession(
  session: NonNullable<SpeakingSession>,
): PlacementSpeakingLevel | null {
  let expected: PlacementSpeakingLevel | null =
    startingLevelForSession(session);
  const completed = session.speakingAttempts.filter(
    (attempt) => attempt.status === "COMPLETED",
  );

  for (const attempt of completed) {
    if (expected == null || attempt.hskLevel !== expected) {
      throw new PlacementSpeakingInvalidStateError(
        "The saved speaking attempt sequence is inconsistent.",
      );
    }
    if (!attempt.passed) return null;
    expected = nextPlacementSpeakingLevel(expected);
  }
  return expected;
}

function lastPassedScore(session: NonNullable<SpeakingSession>): number | null {
  const completedPasses = session.speakingAttempts.filter(
    (attempt) => attempt.status === "COMPLETED" && attempt.passed,
  );
  return completedPasses.at(-1)?.score ?? null;
}

export async function getOrCreatePlacementSpeakingAttempt(
  userId: string,
  sessionId: string,
): Promise<PlacementSpeakingAttemptHandle> {
  return db.$transaction(
    async (tx) => {
      const session = await loadOwnedSpeakingSession(tx, userId, sessionId);
      if (!session) {
        throw new PlacementSpeakingNotFoundError(
          "Active speaking placement session not found.",
        );
      }

      const level = expectedLevelForSession(session);
      if (level == null) {
        throw new PlacementSpeakingInvalidStateError(
          "This speaking placement session is already finished.",
        );
      }

      let attempt = session.speakingAttempts.find(
        (candidate) => candidate.hskLevel === level,
      );
      if (!attempt) {
        attempt = await tx.placementSpeakingAttempt.create({
          data: {
            sessionId,
            hskLevel: level,
            diagnosticOnly: level >= 7,
          },
        });
      } else if (
        attempt.status === "GRADING" &&
        attempt.gradingStartedAt &&
        Date.now() - attempt.gradingStartedAt.getTime() >= STALE_GRADING_MS
      ) {
        attempt = await tx.placementSpeakingAttempt.update({
          where: { id: attempt.id },
          data: { status: "PENDING", gradingStartedAt: null },
        });
      }

      if (attempt.status !== "PENDING") {
        throw new PlacementSpeakingInvalidStateError(
          "This speaking attempt is currently being evaluated.",
        );
      }

      return {
        attemptId: attempt.id,
        level,
        lastPassedScore: lastPassedScore(session),
      };
    },
    { timeout: 15_000 },
  );
}

export async function claimPlacementSpeakingAttempt(
  userId: string,
  sessionId: string,
  attemptId: string,
): Promise<{ level: PlacementSpeakingLevel }> {
  return db.$transaction(
    async (tx) => {
      const session = await loadOwnedSpeakingSession(tx, userId, sessionId);
      if (!session) {
        throw new PlacementSpeakingNotFoundError(
          "Active speaking placement session not found.",
        );
      }
      const expectedLevel = expectedLevelForSession(session);
      const attempt = session.speakingAttempts.find(
        (candidate) => candidate.id === attemptId,
      );
      if (
        expectedLevel == null ||
        !attempt ||
        attempt.hskLevel !== expectedLevel ||
        attempt.status !== "PENDING"
      ) {
        throw new PlacementSpeakingInvalidStateError(
          "This speaking attempt is no longer current.",
        );
      }

      const claimed = await tx.placementSpeakingAttempt.updateMany({
        where: { id: attemptId, sessionId, status: "PENDING" },
        data: { status: "GRADING", gradingStartedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new PlacementSpeakingInvalidStateError(
          "This speaking attempt was already submitted.",
        );
      }
      return { level: expectedLevel };
    },
    { timeout: 15_000 },
  );
}

export async function releasePlacementSpeakingAttempt(
  userId: string,
  sessionId: string,
  attemptId: string,
): Promise<void> {
  const session = await db.placementSession.findFirst({
    where: { id: sessionId, userId, status: "SPEAKING" },
    select: { id: true },
  });
  if (!session) return;
  await db.placementSpeakingAttempt.updateMany({
    where: { id: attemptId, sessionId, status: "GRADING" },
    data: { status: "PENDING", gradingStartedAt: null },
  });
}

export async function completePlacementSpeakingAttempt(
  userId: string,
  sessionId: string,
  attemptId: string,
  transcript: SpeakingTranscriptMessage[],
  learnerTurnConfidences: number[],
  evaluation: PlacementSpeakingEvaluation,
  evaluator: { provider: string; model: string },
): Promise<PlacementSpeakingCompletionRecord> {
  return db.$transaction(
    async (tx) => {
      const session = await loadOwnedSpeakingSession(tx, userId, sessionId);
      if (!session) {
        throw new PlacementSpeakingNotFoundError(
          "Active speaking placement session not found.",
        );
      }
      const expectedLevel = expectedLevelForSession(session);
      const attempt = session.speakingAttempts.find(
        (candidate) => candidate.id === attemptId,
      );
      if (
        expectedLevel == null ||
        !attempt ||
        attempt.hskLevel !== expectedLevel ||
        attempt.status !== "GRADING"
      ) {
        throw new PlacementSpeakingInvalidStateError(
          "This speaking attempt cannot be completed.",
        );
      }

      const passed = evaluation.score >= PLACEMENT_SPEAKING_PASS_SCORE;
      await tx.placementSpeakingAttempt.update({
        where: { id: attemptId },
        data: {
          status: "COMPLETED",
          transcript: transcript as unknown as Prisma.InputJsonValue,
          learnerAsrConfidences:
            learnerTurnConfidences as unknown as Prisma.InputJsonValue,
          evaluation: evaluation as unknown as Prisma.InputJsonValue,
          pronunciation: evaluation.pronunciation,
          fluency: evaluation.fluency,
          accuracy: evaluation.accuracy,
          complexity: evaluation.complexity,
          communicationEffectiveness:
            evaluation.communicationEffectiveness,
          objectiveCompletionRatio: evaluation.objectiveCompletionRatio,
          score: evaluation.score,
          passed,
          evaluatorProvider: evaluator.provider,
          evaluatorModel: evaluator.model,
          gradingStartedAt: null,
          completedAt: new Date(),
        },
      });

      const nextLevel = passed
        ? nextPlacementSpeakingLevel(expectedLevel)
        : null;
      if (nextLevel != null) {
        const nextAttempt = await tx.placementSpeakingAttempt.upsert({
          where: {
            sessionId_hskLevel: { sessionId, hskLevel: nextLevel },
          },
          create: {
            sessionId,
            hskLevel: nextLevel,
            diagnosticOnly: nextLevel >= 7,
          },
          update: {},
        });
        return {
          evaluation,
          nextAttempt: {
            attemptId: nextAttempt.id,
            level: nextLevel,
            lastPassedScore: evaluation.score,
          },
          outcome: null,
        };
      }

      const startLevel = startingLevelForSession(session);
      const creditedLevel = passed
        ? Math.min(expectedLevel, 6)
        : Math.min(
            expectedLevel === startLevel
              ? Math.max(0, startLevel - 1)
              : expectedLevel - 1,
            6,
          );
      const diagnosticLevel =
        expectedLevel >= 7 ? (7 as PlacementSpeakingLevel) : null;

      await tx.placementSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          speakingHskLevel: creditedLevel,
          speakingDiagnosticHskLevel: diagnosticLevel,
        },
      });

      return {
        evaluation,
        nextAttempt: null,
        outcome: { creditedLevel, diagnosticLevel },
      };
    },
    { timeout: 15_000 },
  );
}
