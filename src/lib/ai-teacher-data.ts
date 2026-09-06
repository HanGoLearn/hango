import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getAiProvider } from "@/lib/ai";
import { AiProviderError, type AiMessageInput } from "@/lib/ai/provider";
import { estimateCostUsd } from "@/lib/ai/cost";
import { recordAiUsage, checkDailyUsageCap } from "@/lib/ai-usage";
import {
  buildSystemPrompt,
  detectHanResponseLanguage,
  findLatestExplicitHskSessionLevel,
  type HanResponseLanguage,
  type AiTeacherContext,
  type AiTeacherMode,
} from "@/lib/ai-context";
import {
  getCompetencyProgress,
  getRawProgressEvidence,
} from "@/lib/progress-data";
import { buildAdaptiveLearnerSummary } from "@/lib/ai-learner-adaptation";
import { createTtlCache } from "@/lib/ttl-cache";
import { detectHanAppContextIntent } from "@/lib/han-app-intent";
import { getHanOnDemandAppContext } from "@/lib/han-app-context-data";
import type { SpeakingTurnEvidence } from "@/lib/speech/speaking-pronunciation-evidence";
import {
  buildLearnerFactsExtractionPrompt,
  parseLearnerFacts,
  type LearnerFactTranscriptMessage,
} from "@/lib/learner-facts-prompt";

const MAX_INPUT_LENGTH = 1000;
/**
 * How many recent TEXT chat messages (never Speaking practice - see
 * isSpeakingMessage below) feed Han's memory within one open chat session.
 * Lowered from 20 (2026-08-19, user request) alongside removing cross-
 * session persistence (see resetConversation/getConversationHistory below)
 * - the chat is meant to feel like it starts fresh each time it's opened,
 * not carry in context from a different lesson visited weeks ago.
 */
const HISTORY_LIMIT = 10;
/** Generous multiple of HISTORY_LIMIT to fetch before filtering out Speaking messages and taking the most recent HISTORY_LIMIT real ones - a burst of Speaking practice turns can otherwise fill the naive "most recent N" window entirely, starving the text chat of any real history. */
const HISTORY_FETCH_MULTIPLIER = 5;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_MESSAGES = 15;

/**
 * In-memory (8.6 "Add rate limiting") - resets on server restart and
 * doesn't share state across instances. Fine for a single dev/small
 * deployment; a multi-instance production deployment would need this
 * backed by Redis or the database instead.
 */
const recentMessageTimestamps = new Map<string, number[]>();

export class AiTeacherInputError extends Error {}
export class AiTeacherRateLimitError extends Error {}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const timestamps = (recentMessageTimestamps.get(userId) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  if (timestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
    throw new AiTeacherRateLimitError(
      "You've sent a lot of messages in a short time. Please wait a bit before continuing.",
    );
  }
  timestamps.push(now);
  recentMessageTimestamps.set(userId, timestamps);
}

/** Rarely changes, but used to be re-read from the database on every single AI Teacher turn (2026-08-19, project/learning-journey-optimization.md - same Tier 3 createTtlCache pattern used throughout that audit). */
const AI_TEACHER_PREFS_TTL_MS = 5 * 60 * 1000;

const getCachedConversationStorageEnabled = createTtlCache(
  async (userId: string): Promise<boolean> => {
    const profile = await db.learnerProfile.findUnique({
      where: { userId },
      select: { aiConversationStorageEnabled: true },
    });
    return profile?.aiConversationStorageEnabled ?? true;
  },
  AI_TEACHER_PREFS_TTL_MS,
);

/** AiConversation.userId is @unique - one row per user, effectively permanent once created (2026-08-19: resetConversation below no longer deletes this row, only individual messages), so the row is safe to cache instead of re-querying on every turn. */
const getCachedConversation = createTtlCache(async (userId: string) => {
  const existing = await db.aiConversation.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.aiConversation.create({ data: { userId } });
}, AI_TEACHER_PREFS_TTL_MS);

export async function getOrCreateConversation(userId: string) {
  return getCachedConversation(userId);
}

interface ContextSnapshotShape {
  lessonTitle?: string;
  rolePlay?: unknown;
}

/**
 * A Speaking-practice turn (HanVoiceConversation's role-play, saved via
 * saveRealtimeConversationTurn/-Message below) - reflection.ts's
 * getSpeakingTranscriptForLesson reconstructs a lesson's Speaking score
 * from these, so they must never be deleted by the (unrelated) text
 * chat's "start fresh on open" reset, and must never leak into the text
 * chat's own history/display either (see getConversationHistory and
 * resetConversation, both below).
 */
function isSpeakingMessage(contextSnapshot: unknown): boolean {
  return Boolean((contextSnapshot as ContextSnapshotShape | null)?.rolePlay);
}

/**
 * The text chat's own recent history only - Speaking-practice turns are
 * filtered out (see isSpeakingMessage) so a role-play exchange doesn't
 * show up as out-of-place chat bubbles, or get fed to Han as if it were
 * part of the current text conversation.
 */
export async function getConversationHistory(userId: string) {
  const conversation = await db.aiConversation.findUnique({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: HISTORY_LIMIT * HISTORY_FETCH_MULTIPLIER,
      },
    },
  });
  if (!conversation) return [];
  return conversation.messages
    .filter((message) => !isSpeakingMessage(message.contextSnapshot))
    .slice(0, HISTORY_LIMIT)
    .reverse();
}

/**
 * How many real text-chat messages (already excluding Speaking-practice
 * turns) a conversation needs before it's worth extracting personal facts
 * from (2026-08-31, Han Companion memory) - `resetConversation` fires on
 * every single `openTeacher()` call, i.e. every bubble open, not on close
 * (see ai-teacher-provider.tsx's `openTeacher`), so without a floor this
 * would fire an AI call on every stray open/glance instead of once per
 * real conversation.
 */
const MIN_MESSAGES_FOR_FACT_EXTRACTION = 8;

/**
 * Fire-and-forget, deliberately never awaited by resetConversation below -
 * the 2026-08-21 fix that made resetConversation itself non-blocking exists
 * specifically so opening the chat panel isn't delayed by a database round
 * trip; awaiting an AI call here would reintroduce that exact regression.
 * Own try/catch since nothing awaits this promise - an unhandled rejection
 * here must never surface anywhere else.
 */
async function extractAndSaveLearnerFacts(
  userId: string,
  conversationId: string,
  messages: { role: "USER" | "ASSISTANT"; content: string }[],
): Promise<void> {
  try {
    const transcript: LearnerFactTranscriptMessage[] = messages.map((m) => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
    }));
    const result = await getAiProvider().complete({
      systemPrompt: buildLearnerFactsExtractionPrompt(transcript),
      messages: [{ role: "user", content: "Extract the facts." }],
      maxOutputTokens: 400,
    });
    const facts = parseLearnerFacts(result.content);
    if (facts.length === 0) return;
    await db.learnerFact.createMany({
      data: facts.map((fact) => ({
        userId,
        category: fact.category,
        fact: fact.fact,
        sourceConversationId: conversationId,
      })),
    });
  } catch (error) {
    console.error("[ai-teacher] extractAndSaveLearnerFacts failed", error);
  }
}

/**
 * Clears the text chat's own history so Han "starts fresh" every time the
 * chat is opened (openTeacher, ai-teacher-provider.tsx) - deliberately
 * does NOT delete the AiConversation row itself, and deliberately never
 * deletes Speaking-practice messages (see isSpeakingMessage), even though
 * they live in the same thread, since reflection.ts still needs them to
 * score a not-yet-reflected lesson's Speaking step.
 *
 * Real bug this fixes (2026-08-19): before this, opening the text chat for
 * *any* reason, anywhere in the app - every "Ask AI" button, not just the
 * main panel - deleted the *entire* conversation, silently destroying an
 * in-progress lesson's Speaking transcript along with it. A learner who
 * did Speaking practice, then later clicked any "Ask AI" button before
 * reaching Reflection, would lose that Speaking evidence with no warning.
 *
 * Also the trigger point for Han Companion's personal-memory extraction
 * (2026-08-31) - the about-to-be-deleted messages ARE the just-finished
 * conversation, so this is read before the delete, not a separate fetch.
 *
 * `extractFacts` (2026-08-31 fix) defaults to `false` and must be passed
 * `true` explicitly by Han Companion's own reset call only. The original
 * version extracted from *any* reset conversation with enough messages,
 * gated only by "not role-play" - Han Tutor is also not role-play, so a
 * long Tutor conversation got captured as personal memory too, and Tutor
 * then read it back on a later, unrelated visit. That directly broke an
 * already-agreed rule: Tutor always resets fresh, it never remembers
 * anything across sessions (real user report, 2026-08-31).
 */
export async function resetConversation(
  userId: string,
  extractFacts = false,
): Promise<void> {
  const conversation = await db.aiConversation.findUnique({
    where: { userId },
    include: {
      messages: {
        select: { id: true, role: true, content: true, contextSnapshot: true },
      },
    },
  });
  if (!conversation) return;

  const messagesToDelete = conversation.messages.filter(
    (message) => !isSpeakingMessage(message.contextSnapshot),
  );
  if (messagesToDelete.length === 0) return;

  if (extractFacts && messagesToDelete.length >= MIN_MESSAGES_FOR_FACT_EXTRACTION) {
    void extractAndSaveLearnerFacts(userId, conversation.id, messagesToDelete);
  }

  await db.aiMessage.deleteMany({
    where: { id: { in: messagesToDelete.map((message) => message.id) } },
  });
}

async function invalidateLessonReflection(
  userId: string,
  context: AiTeacherContext,
): Promise<void> {
  if (!context.lessonTitle || !context.rolePlay) return;
  await db.lessonReflectionReport.deleteMany({
    where: { userId, lesson: { title: context.lessonTitle } },
  });
}

export async function saveRealtimeConversationTurn(
  userId: string,
  userText: string,
  assistantText: string,
  context: AiTeacherContext,
): Promise<void> {
  if (!(await getCachedConversationStorageEnabled(userId))) return;
  const conversation = await getOrCreateConversation(userId);
  const contextSnapshot = context as unknown as Prisma.InputJsonValue;
  const userCreatedAt = new Date();
  await db.aiMessage.createMany({
    data: [
      {
        conversationId: conversation.id,
        role: "USER",
        content: userText,
        contextSnapshot,
        createdAt: userCreatedAt,
      },
      {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: assistantText,
        contextSnapshot,
        createdAt: new Date(userCreatedAt.getTime() + 1),
      },
    ],
  });
  await invalidateLessonReflection(userId, context);
}

export async function saveRealtimeConversationMessage(
  userId: string,
  role: "USER" | "ASSISTANT",
  content: string,
  context: AiTeacherContext,
): Promise<void> {
  if (!(await getCachedConversationStorageEnabled(userId))) return;
  const conversation = await getOrCreateConversation(userId);
  await db.aiMessage.create({
    data: {
      conversationId: conversation.id,
      role,
      content,
      contextSnapshot: context as unknown as Prisma.InputJsonValue,
    },
  });
  await invalidateLessonReflection(userId, context);
}

export async function saveRealtimeSpeakingEvidence(
  userId: string,
  evidence: readonly SpeakingTurnEvidence[],
  context: AiTeacherContext,
): Promise<void> {
  if (
    !context.rolePlay ||
    context.rolePlay.isFreeTopic ||
    !context.lessonTitle ||
    evidence.length === 0 ||
    !(await getCachedConversationStorageEnabled(userId))
  )
    return;
  const conversation = await getOrCreateConversation(userId);
  await db.aiMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: JSON.stringify(evidence),
      contextSnapshot: {
        ...context,
        speakingEvidenceRecord: true,
      } as unknown as Prisma.InputJsonValue,
    },
  });
  await invalidateLessonReflection(userId, context);
}

interface SendMessageResult {
  reply: string;
  responseLanguage: HanResponseLanguage;
}

/**
 * The orchestration step from ai_architecture.md's "AI Request Flow":
 * load learner context -> generate response -> store interaction. Never
 * throws for provider failures (8.6 "Ensure AI failure does not block
 * lesson completion" - the caller can't be allowed to crash the lesson
 * page over a flaky AI response) - those are surfaced as a normal
 * exception subclass the Server Action translates to a friendly message,
 * same as validation/rate-limit errors.
 */
export async function sendAiTeacherMessage(
  userId: string,
  message: string,
  context: AiTeacherContext,
  mode: AiTeacherMode,
): Promise<SendMessageResult> {
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    throw new AiTeacherInputError("Message can't be empty.");
  }
  if (trimmed.length > MAX_INPUT_LENGTH) {
    throw new AiTeacherInputError(
      `Message is too long (max ${MAX_INPUT_LENGTH} characters).`,
    );
  }
  checkRateLimit(userId);
  await checkDailyUsageCap(userId, "ai-teacher-chat");

  const appIntent = !context.rolePlay
    ? detectHanAppContextIntent(trimmed, context.currentPageName)
    : null;

  const [profile, competencyProgress, rawEvidence, onDemandAppContext, learnerFacts] =
    await Promise.all([
      db.learnerProfile.findUnique({
        where: { userId },
        select: {
          currentLevel: true,
          explanationLanguage: true,
          aiConversationStorageEnabled: true,
          generalLevelPoints: true,
          displayName: true,
        },
      }),
      getCompetencyProgress(userId),
      getRawProgressEvidence(userId),
      appIntent
        ? getHanOnDemandAppContext(userId, trimmed, context.currentPageName)
        : Promise.resolve(null),
      // Han Companion's personal memory (2026-08-31, fixed same day) - only
      // Companion (mode === "PRACTICE", no role-play) ever reads this.
      // Originally gated on `!context.rolePlay` alone, which also matches
      // Han Tutor (also not role-play) - a real user report caught Tutor
      // "remembering" a past conversation across sessions, breaking the
      // already-agreed "Tutor always resets fresh" rule. Mirrors the same
      // `mode === "PRACTICE" && !context.rolePlay` condition ai-context.ts
      // uses to decide immersion Practice instructions.
      mode === "PRACTICE" && !context.rolePlay
        ? db.learnerFact.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
            take: 8,
            select: { fact: true },
          })
        : Promise.resolve([]),
    ]);
  // The 10 most recent results, derived from the same rows
  // getCompetencyProgress already fetched (via getRawProgressEvidence)
  // instead of a second, separately-ordered/bounded query
  // (project/db-operations-optimization.md, Tier 2).
  const recentEvidence = [...rawEvidence]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  const adaptiveSummary = buildAdaptiveLearnerSummary(
    competencyProgress.map((item) => ({
      name: item.name,
      weightedScore: item.weightedScore,
      evidenceCount: item.evidenceCount,
    })),
    recentEvidence.map((item) => item.result),
  );

  const storageEnabled = profile?.aiConversationStorageEnabled ?? true;

  const history: AiMessageInput[] = storageEnabled
    ? (await getConversationHistory(userId)).map((m) => ({
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
      }))
    : [];

  const sessionLevelOverride = findLatestExplicitHskSessionLevel([
    ...history
      .filter((historyMessage) => historyMessage.role === "user")
      .map((historyMessage) => historyMessage.content),
    trimmed,
  ]);

  const systemPrompt = buildSystemPrompt(
    {
      level: profile?.currentLevel ?? null,
      explanationLanguage: profile?.explanationLanguage ?? null,
      generalLevelPoints: profile?.generalLevelPoints,
      learnerName: profile?.displayName,
      knownFacts: learnerFacts.map((row) => row.fact),
      ...adaptiveSummary,
    },
    context.rolePlay
      ? context
      : { ...context, onDemandAppContext: onDemandAppContext ?? undefined },
    mode,
    trimmed,
    sessionLevelOverride,
  );

  const provider = getAiProvider();
  const result = await provider.complete({
    systemPrompt,
    messages: [...history, { role: "user", content: trimmed }],
    maxOutputTokens: 800,
  });

  await recordAiUsage({
    userId,
    feature: "ai-teacher-chat",
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

  if (storageEnabled) {
    const conversation = await getOrCreateConversation(userId);
    const contextSnapshot = context as unknown as Prisma.InputJsonValue;
    const userCreatedAt = new Date();
    const assistantCreatedAt = new Date(userCreatedAt.getTime() + 1);
    await db.aiMessage.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: "USER",
          content: trimmed,
          contextSnapshot,
          createdAt: userCreatedAt,
        },
        {
          conversationId: conversation.id,
          role: "ASSISTANT",
          content: result.content,
          contextSnapshot,
          createdAt: assistantCreatedAt,
        },
      ],
    });
  }

  return {
    reply: result.content,
    responseLanguage: detectHanResponseLanguage(
      trimmed,
      profile?.explanationLanguage ?? null,
    ),
  };
}

export { AiProviderError };
