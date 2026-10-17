import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import {
  dedupeLabEvidence,
  computeLabSkillPoints,
  LAB_SKILL_BUDGET,
  type LabEvidencePoint,
} from "@/lib/points-system";

/**
 * Raw records fetched (most recent first) before deduping by task/session
 * id, per skill - comfortably contains 60+ distinct attempts (the
 * full-weight threshold in computeLabFactorVolumen/points-system.ts) even
 * for a learner who resubmits the same task/session repeatedly. Trimmed
 * from 150 to 90 (2026-08-21, project/learning-journey-optimization.md
 * "Facet F" follow-up) - still a comfortable 1.5x buffer over the real 60
 * threshold, at 40% less row volume fetched and processed in JS on every
 * single Writing/Speaking submission. Not an operations-cost fix (Prisma
 * Postgres bills per query regardless of row count, confirmed the same
 * investigation this constant was tuned in) - a plain row-volume/JS-work
 * tuning, deliberately not the bigger incremental-summary redesign also
 * considered, since there's no evidence yet that this is a real bottleneck.
 */
const ROLLING_WINDOW_RAW_LIMIT = 90;

interface WritingFeedbackShape {
  overallScore?: number;
  grammar?: number;
  vocabulary?: number;
  naturalness?: number;
  communicationClarity?: number;
}

/**
 * Writing Lab evidence (points_system.md Part 3). Includes Custom Writing
 * attempts (2026-08-15) - `submitCustomWriting()` now persists a
 * `WritingAttempt` with `taskId: null`, so those are deduped by the
 * attempt's own id instead of a shared task id: unlike a fixed `WritingTask`
 * (where resubmitting the *same* task repeatedly shouldn't inflate
 * `factor_volumen`), every Custom Writing submission is a genuinely
 * distinct piece of writing and should count as its own attempt.
 */
async function getWritingEvidence(
  userId: string,
  client: Prisma.TransactionClient,
): Promise<LabEvidencePoint[]> {
  const attempts = await client.writingAttempt.findMany({
    where: { userId, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    take: ROLLING_WINDOW_RAW_LIMIT,
    select: { id: true, taskId: true, submittedAt: true, feedback: true },
  });

  const points: LabEvidencePoint[] = [];
  for (const attempt of attempts) {
    if (!attempt.submittedAt) continue;
    const feedback = attempt.feedback as unknown as WritingFeedbackShape | null;
    if (!feedback) continue;
    const legacyScores = [
      feedback.grammar,
      feedback.vocabulary,
      feedback.naturalness,
      feedback.communicationClarity,
    ];
    const score =
      typeof feedback.overallScore === "number"
        ? feedback.overallScore
        : legacyScores.every((value) => typeof value === "number")
          ? (legacyScores as number[]).reduce((sum, value) => sum + value, 0) /
            4
          : null;
    if (score === null || !Number.isFinite(score)) continue;
    points.push({
      distinctKey: attempt.taskId ?? attempt.id,
      score,
      occurredAt: attempt.submittedAt,
    });
  }
  return dedupeLabEvidence(points);
}

interface SpeakingFeedbackShape {
  pronunciation: number;
  fluency: number;
  accuracy: number;
  complexity: number;
  communicationEffectiveness: number;
}

/**
 * Speaking Lab evidence - one point per completed session, scored from its
 * most recent attempt (a session can hold multiple re-recordings; only the
 * latest represents "how it actually went"). Every Speaking Lab activity
 * type (Pronunciation, Shadowing, Guided Conversation, Scenario Role Play)
 * persists through SpeakingSession/SpeakingAttempt, unlike Writing's Custom
 * Writing gap - no exclusions needed here.
 */
async function getSpeakingEvidence(
  userId: string,
  client: Prisma.TransactionClient,
): Promise<LabEvidencePoint[]> {
  const sessions = await client.speakingSession.findMany({
    where: { userId, completionState: "COMPLETED", completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: ROLLING_WINDOW_RAW_LIMIT,
    select: {
      id: true,
      completedAt: true,
      attempts: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { feedback: true },
      },
    },
  });

  const points: LabEvidencePoint[] = [];
  for (const session of sessions) {
    if (!session.completedAt) continue;
    const feedback = session.attempts[0]?.feedback as unknown as
      SpeakingFeedbackShape | null | undefined;
    if (!feedback) continue;
    const score =
      (feedback.pronunciation +
        feedback.fluency +
        feedback.accuracy +
        feedback.complexity +
        feedback.communicationEffectiveness) /
      5;
    points.push({
      distinctKey: session.id,
      score,
      occurredAt: session.completedAt,
    });
  }
  // Sessions are already distinct by id; dedupeLabEvidence is a no-op
  // safety net here, not load-bearing like it is for Writing.
  return dedupeLabEvidence(points);
}

export interface LabPointsSummary {
  writing: number;
  speaking: number;
  total: number;
}

export async function computeLabPoints(
  userId: string,
  client: Prisma.TransactionClient = db,
): Promise<LabPointsSummary> {
  const [writingEvidence, speakingEvidence] = await Promise.all([
    getWritingEvidence(userId, client),
    getSpeakingEvidence(userId, client),
  ]);
  const writing = computeLabSkillPoints(
    LAB_SKILL_BUDGET.WRITING,
    writingEvidence,
  );
  const speaking = computeLabSkillPoints(
    LAB_SKILL_BUDGET.SPEAKING,
    speakingEvidence,
  );
  return { writing, speaking, total: writing + speaking };
}
