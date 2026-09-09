import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getAiProvider, AiProviderError } from "@/lib/ai";
import { estimateCostUsd } from "@/lib/ai/cost";
import {
  recordAiUsage,
  trackAiOperation,
  DailyUsageCapExceededError,
} from "@/lib/ai-usage";
import {
  buildWritingFeedbackPrompt,
  buildCustomWritingFeedbackPrompt,
  parseWritingFeedback,
  DEFAULT_WRITING_FEEDBACK,
  type WritingFeedback,
  type CustomWritingCharacteristics,
} from "@/lib/writing-feedback";
import {
  recordProgressEvidence,
  getLessonCompetencyIds,
} from "@/lib/progress-evidence";
import { recomputeGeneralLevelPoints } from "@/lib/general-level";
import { checkWritingLabAchievements } from "@/lib/achievements";

export interface WritingLessonOption {
  id: string;
  slug: string;
  title: string;
  scenarioTitle: string;
}

/** Every published lesson with writing tasks, for the Writing Lab's lesson picker (same pattern as Speaking Lab's, 2026-08-08). */
export async function getWritingLessonOptions(): Promise<
  WritingLessonOption[]
> {
  const lessons = await db.lesson.findMany({
    where: {
      status: "PUBLISHED",
      writingTasks: { some: { status: "PUBLISHED" } },
    },
    orderBy: { order: "asc" },
    include: { scenarioLevel: { include: { scenario: true } } },
  });
  return lessons
    .map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      scenarioTitle: lesson.scenarioLevel.scenario.name,
      scenarioOrder: lesson.scenarioLevel.scenario.order,
    }))
    .sort((a, b) => a.scenarioOrder - b.scenarioOrder)
    .map(({ scenarioOrder: _scenarioOrder, ...option }) => option);
}

/** Writing tasks for one lesson (defaults to the first available lesson) - was an unscoped global catalog until 2026-08-08, now scoped like Speaking Lab. */
export async function getWritingTasks(lessonId?: string) {
  const resolvedLessonId =
    lessonId ??
    (
      await db.lesson.findFirst({
        where: {
          status: "PUBLISHED",
          writingTasks: { some: { status: "PUBLISHED" } },
        },
        // Matches getWritingLessonOptions()'s ordering exactly (scenario
        // order first, then lesson order) - that function sorts by lesson
        // order in the DB query but then re-sorts by scenario order in JS,
        // so "the first option" is scenario-order-first, not lesson-order-first.
        orderBy: [
          { scenarioLevel: { scenario: { order: "asc" } } },
          { order: "asc" },
        ],
        select: { id: true },
      })
    )?.id;
  if (!resolvedLessonId) return [];

  return db.writingTask.findMany({
    where: { status: "PUBLISHED", lessonId: resolvedLessonId },
    orderBy: { order: "asc" },
  });
}

/** Standalone pool of Translation Challenge texts - not scoped to any lesson (Writing Lab redesign, 2026-08-08 round 2). */
export async function getTranslationChallenges() {
  return db.writingTask.findMany({
    where: {
      status: "PUBLISHED",
      type: "TRANSLATION_CHALLENGE",
      lessonId: null,
    },
    orderBy: { order: "asc" },
  });
}

export async function getRecentAttempts(userId: string, limit = 5) {
  return db.writingAttempt.findMany({
    where: { userId, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    take: limit,
    include: { task: true },
  });
}

// submitWritingAttempt triggers a paid AI feedback call - same abuse/cost
// protection as the AI Teacher/Mission/Speaking chats (16.5 "Rate limiting").
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 15;
const recentSubmissionTimestamps = new Map<string, number[]>();

export class WritingRateLimitError extends Error {}
export class WritingInputError extends Error {}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentSubmissionTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
    throw new WritingRateLimitError(
      "You've submitted a lot of attempts in a short time. Please wait a bit before continuing.",
    );
  }
  timestamps.push(now);
  recentSubmissionTimestamps.set(userId, timestamps);
}

async function assertOwnedAttempt(userId: string, attemptId: string) {
  const attempt = await db.writingAttempt.findUniqueOrThrow({
    where: { id: attemptId },
  });
  if (attempt.userId !== userId) throw new Error("Not authorized");
  return attempt;
}

/** Reuses an existing unsubmitted draft for this task if one exists (11.4 "Restore drafts"), otherwise starts a fresh one. */
export async function getOrCreateDraftAttempt(userId: string, taskId: string) {
  const existing = await db.writingAttempt.findFirst({
    where: { userId, taskId, submittedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing;

  return db.writingAttempt.create({ data: { userId, taskId } });
}

/** 11.4 autosave - just persists the draft text, no grading. */
export async function saveDraft(
  userId: string,
  attemptId: string,
  draft: string,
) {
  await assertOwnedAttempt(userId, attemptId);
  return db.writingAttempt.update({
    where: { id: attemptId },
    data: { draft },
  });
}

async function generateFeedback(
  userId: string,
  taskType: string,
  prompt: string,
  submittedText: string,
  referenceAnswer?: string | null,
): Promise<WritingFeedback> {
  try {
    const provider = getAiProvider();
    const result = await trackAiOperation(
      { userId, feature: "writing-feedback", provider: provider.name },
      () =>
        provider.complete({
          systemPrompt: buildWritingFeedbackPrompt(
            taskType,
            prompt,
            submittedText,
            referenceAnswer,
          ),
          messages: [{ role: "user", content: submittedText }],
          maxOutputTokens: 500,
        }),
    );
    await recordAiUsage({
      userId,
      feature: "writing-feedback",
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCostUsd: estimateCostUsd(
        result.model,
        result.inputTokens,
        result.outputTokens,
      ),
    });
    return parseWritingFeedback(result.content);
  } catch (error) {
    if (
      error instanceof AiProviderError ||
      error instanceof DailyUsageCapExceededError
    ) {
      return DEFAULT_WRITING_FEEDBACK;
    }
    throw error;
  }
}

/**
 * Grades the learner's own text as submitted, then generates a corrected
 * version (11.5 "The AI must evaluate the learner's own attempt before
 * providing a complete corrected answer" - encoded directly into the
 * feedback prompt's ordering). `submittedResponse` is a snapshot so a later
 * draft edit on this same row can't retroactively change what was graded.
 */
export async function submitWritingAttempt(userId: string, attemptId: string) {
  checkRateLimit(userId);
  const attempt = await assertOwnedAttempt(userId, attemptId);
  if (!attempt.taskId) {
    throw new Error(
      "This attempt has no task - use submitCustomWriting() for Custom Writing.",
    );
  }
  const task = await db.writingTask.findUniqueOrThrow({
    where: { id: attempt.taskId },
  });

  const feedback = await generateFeedback(
    userId,
    task.type,
    task.prompt,
    attempt.draft,
    task.referenceAnswer,
  );

  const updated = await db.writingAttempt.update({
    where: { id: attemptId },
    data: {
      submittedResponse: attempt.draft,
      submittedAt: new Date(),
      feedback: feedback as unknown as Prisma.InputJsonValue,
      correctedVersion: feedback.correctedVersion || null,
    },
  });

  const competencyIds = await getLessonCompetencyIds(task.lessonId, "WRITING");
  const result =
    (feedback.grammar +
      feedback.vocabulary +
      feedback.naturalness +
      feedback.communicationClarity) /
    400;
  await recordProgressEvidence(
    userId,
    competencyIds,
    "WRITING",
    result,
    null,
    updated.id,
  );
  // Points & Leveling System (2026-08-16): a graded submission can change
  // Writing Lab's contribution to the General Level (new distinct task, or
  // an improved score on a resubmission).
  await recomputeGeneralLevelPoints(userId);
  await checkWritingLabAchievements(userId);

  return updated;
}

const MAX_CUSTOM_WRITING_LENGTH = 2000;

/**
 * "Custom Writing" (Writing Lab redesign, 2026-08-15 round 3) - grades a
 * one-off, learner-defined prompt and persists it as a `WritingAttempt`
 * with `taskId: null` and `customPrompt` holding the characteristics it was
 * graded against, instead of a `WritingTask` row (there's no fixed catalog
 * entry for a prompt the learner made up themselves). Persisting even on an
 * AI-provider failure (falling back to `DEFAULT_WRITING_FEEDBACK`) matches
 * `submitWritingAttempt()`'s behavior - the writing itself was real and
 * worth keeping regardless of whether grading succeeded. This is what makes
 * Custom Writing count toward Writing Lab points via
 * `lab-points.ts`'s `getWritingEvidence()`, which previously excluded it
 * entirely because there was nothing in the database to query.
 */
export async function submitCustomWriting(
  userId: string,
  characteristics: CustomWritingCharacteristics,
  text: string,
): Promise<WritingFeedback> {
  if (!characteristics.topic.trim()) {
    throw new WritingInputError("Topic can't be empty.");
  }
  if (!text.trim()) {
    throw new WritingInputError("Response can't be empty.");
  }
  if (text.length > MAX_CUSTOM_WRITING_LENGTH) {
    throw new WritingInputError(
      `Response is too long (max ${MAX_CUSTOM_WRITING_LENGTH} characters).`,
    );
  }
  checkRateLimit(userId);

  let feedback: WritingFeedback;
  try {
    const provider = getAiProvider();
    const result = await trackAiOperation(
      { userId, feature: "writing-feedback", provider: provider.name },
      () =>
        provider.complete({
          systemPrompt: buildCustomWritingFeedbackPrompt(characteristics, text),
          messages: [{ role: "user", content: text }],
          maxOutputTokens: 500,
        }),
    );
    await recordAiUsage({
      userId,
      feature: "writing-feedback",
      provider: result.provider,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      estimatedCostUsd: estimateCostUsd(
        result.model,
        result.inputTokens,
        result.outputTokens,
      ),
    });
    feedback = parseWritingFeedback(result.content);
  } catch (error) {
    if (
      !(error instanceof AiProviderError) &&
      !(error instanceof DailyUsageCapExceededError)
    ) {
      throw error;
    }
    feedback = DEFAULT_WRITING_FEEDBACK;
  }

  await db.writingAttempt.create({
    data: {
      userId,
      customPrompt: characteristics as unknown as Prisma.InputJsonValue,
      draft: text,
      submittedResponse: text,
      submittedAt: new Date(),
      feedback: feedback as unknown as Prisma.InputJsonValue,
      correctedVersion: feedback.correctedVersion || null,
    },
  });
  await recomputeGeneralLevelPoints(userId);
  await checkWritingLabAchievements(userId);

  return feedback;
}

/** 11.5 "Rewrite action" - a fresh attempt linked back to the original, not an edit of the graded one. */
export async function createRewriteAttempt(userId: string, attemptId: string) {
  const original = await assertOwnedAttempt(userId, attemptId);

  return db.writingAttempt.create({
    data: {
      userId,
      taskId: original.taskId,
      rewriteOfAttemptId: original.id,
    },
  });
}
