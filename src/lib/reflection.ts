import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getAiProvider, AiProviderError } from "@/lib/ai";
import { estimateCostUsd } from "@/lib/ai/cost";
import {
  recordAiUsage,
  checkDailyUsageCap,
  DailyUsageCapExceededError,
} from "@/lib/ai-usage";
import {
  getLessonCompetencyIds,
  replaceProgressEvidence,
} from "@/lib/progress-evidence";
import {
  buildSpeakingConversationFeedbackPrompt,
  hasEnoughSpeakingEvidence,
  parseSpeakingConversationFeedback,
  DEFAULT_SPEAKING_CONVERSATION_FEEDBACK,
  buildHanReflectionNarrativePrompt,
  parseHanReflectionNarrative,
  type SpeakingConversationFeedback,
  type SpeakingTranscriptMessage,
} from "@/lib/reflection-prompt";
import {
  computeReflectionTotal,
  computeSpeakingConversationScore,
  starsForScore,
} from "@/lib/points-system";
import { planVocabularyQuestions } from "@/lib/content/vocabulary-quiz";
import {
  sanitizeSpeakingTurnEvidence,
  type SpeakingTurnEvidence,
} from "@/lib/speech/speaking-pronunciation-evidence";
import { checkReflectionAchievements } from "@/lib/achievements";
import { grantCoins } from "@/lib/coins";

export class ReflectionNotFoundError extends Error {}

async function syncLessonSpeakingEvidence(
  userId: string,
  lessonId: string,
  speakingScore: number | null,
): Promise<void> {
  if (speakingScore === null) return;
  const competencyIds = await getLessonCompetencyIds(lessonId, "SPEAKING");
  await replaceProgressEvidence(
    userId,
    competencyIds,
    "SPEAKING",
    speakingScore / 100,
    null,
    `lesson-reflection-speaking:${lessonId}`,
  );
}

function containsNonEnglishCachedNarrative(
  narrative: string,
  strengths: unknown,
  improvements: unknown,
): boolean {
  const combined = [
    narrative,
    ...(Array.isArray(strengths) ? strengths : []),
    ...(Array.isArray(improvements) ? improvements : []),
  ].join(" ");
  // Permit an isolated vocabulary example such as 你好, but regenerate old
  // reports whose actual feedback was written in Mandarin.
  return (combined.match(/\p{Script=Han}/gu) ?? []).length >= 6;
}

/**
 * Fire-and-forget-safe: called every time a learner opens a word's
 * examples or audio - the highest-frequency interaction in a lesson (once
 * per vocabulary word). A plain `create` that swallows the "already
 * exists" case (P2002, the `@@unique([userId, vocabularyItemId])`
 * constraint) costs one statement either way; `upsert` cost 4 real SQL
 * statements for the same no-op (a pre-check SELECT, the INSERT, a
 * post-insert re-SELECT, and COMMIT - confirmed via Prisma's query log,
 * 2026-08-20, project/learning-journey-optimization.md) for data this
 * function never actually returns to its caller.
 */
export async function recordVocabularyInteraction(
  userId: string,
  vocabularyItemId: string,
): Promise<void> {
  try {
    await db.learnerVocabularyInteraction.create({
      data: { userId, vocabularyItemId },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return;
    }
    throw error;
  }
}

export interface ScoreCounts {
  correct: number;
  total: number;
}

async function computeExerciseCounts(
  userId: string,
  exerciseIds: string[],
): Promise<ScoreCounts> {
  if (exerciseIds.length === 0) return { correct: 0, total: 0 };

  const attempts = await db.exerciseAttempt.findMany({
    where: { userId, exerciseId: { in: exerciseIds } },
    orderBy: { createdAt: "asc" },
    select: { exerciseId: true, isCorrect: true },
  });

  const firstByExercise = new Map<string, boolean | null>();
  for (const attempt of attempts) {
    if (!firstByExercise.has(attempt.exerciseId)) {
      firstByExercise.set(attempt.exerciseId, attempt.isCorrect);
    }
  }

  const correct = exerciseIds.filter(
    (id) => firstByExercise.get(id) === true,
  ).length;
  return { correct, total: exerciseIds.length };
}

async function computeExerciseScore(
  userId: string,
  exerciseIds: string[],
): Promise<number | null> {
  if (exerciseIds.length === 0) return null;
  const { correct, total } = await computeExerciseCounts(userId, exerciseIds);
  return Math.round((correct / total) * 100);
}

interface VocabularyWordForScoring {
  vocabularyItemId: string;
  exampleCount: number;
}

/**
 * Points & Leveling System (2026-08-16, revised 2026-08-31 for rhythm
 * variation): real quiz accuracy, replacing coverage as the Vocabulary
 * score's basis. The expected question set per word is no longer a flat
 * count - it's recomputed here via `planVocabularyQuestions`, the exact
 * same deterministic function vocabulary-step.tsx calls to decide what to
 * render, seeded only off (lessonId, vocabularyItemId, difficulty,
 * exampleCount). Neither side trusts the other's report of what was asked;
 * both independently arrive at the same answer from the same real inputs.
 *
 * Per-word rule: a word answered via the quick-test mode (questionKey
 * `{itemId}:quicktest`) and answered correctly there scores 1/1 on its own
 * - it was never asked the fuller walkthrough questions, so it can't be
 * scored against them. Anything else (no quick-test attempt, or a wrong
 * one - which routes the learner into remediation for that word) falls
 * back to the full per-word plan, scored against whichever of *those*
 * specific keys have a matching first attempt with isCorrect: true. A
 * fabricated or stray questionKey the app never actually planned can't
 * inflate a score, since only recomputed, real plan keys are ever looked
 * up - "first attempt, unanswered = not correct" still applies, same
 * convention as computeExerciseScore.
 */
async function computeVocabularyCounts(
  userId: string,
  lessonId: string,
  words: VocabularyWordForScoring[],
  difficulty: string,
): Promise<ScoreCounts> {
  if (words.length === 0) return { correct: 0, total: 0 };

  const attempts = await db.vocabularyQuizAttempt.findMany({
    where: { userId, lessonId },
    orderBy: { createdAt: "asc" },
    select: { questionKey: true, isCorrect: true },
  });

  const firstByQuestion = new Map<string, boolean>();
  for (const attempt of attempts) {
    if (!firstByQuestion.has(attempt.questionKey)) {
      firstByQuestion.set(attempt.questionKey, attempt.isCorrect);
    }
  }

  let correct = 0;
  let total = 0;
  for (const word of words) {
    if (firstByQuestion.get(`${word.vocabularyItemId}:quicktest`) === true) {
      correct += 1;
      total += 1;
      continue;
    }
    const plan = planVocabularyQuestions(
      word.vocabularyItemId,
      lessonId,
      difficulty,
      word.exampleCount,
    );
    total += plan.length;
    for (const entry of plan) {
      if (firstByQuestion.get(entry.key) === true) correct += 1;
    }
  }

  // A degenerate word (no examples, no viable distractors) can legitimately
  // plan to zero questions - the old flat formula could never hit 0/0 once
  // wordCount > 0, this per-word sum can. Guard before it becomes NaN.
  if (total === 0) return { correct: 0, total: 0 };
  return { correct, total };
}

async function computeVocabularyScore(
  userId: string,
  lessonId: string,
  words: VocabularyWordForScoring[],
  difficulty: string,
): Promise<number | null> {
  if (words.length === 0) return null;
  const { correct, total } = await computeVocabularyCounts(
    userId,
    lessonId,
    words,
    difficulty,
  );
  if (total === 0) return null;
  return Math.round((correct / total) * 100);
}

interface ContextSnapshotShape {
  lessonTitle?: string;
  rolePlay?: unknown;
  speakingEvidenceRecord?: boolean;
}

interface LessonSpeakingRecord {
  transcript: SpeakingTranscriptMessage[];
  speakingEvidence: SpeakingTurnEvidence[];
}

/**
 * Reconstructs the Speaking step's practice transcript for this lesson out
 * of the learner's single ongoing AiConversation thread (there's no
 * per-lesson conversation table - see AiConversation.userId @unique),
 * filtering by the AiTeacherContext snapshot each message was sent under.
 * A learner practicing the same lesson's Speaking step more than once
 * would have all of those turns blended together - an accepted
 * simplification for the first version of this evaluator, not a bug to
 * chase down further right now.
 */
/** Comfortably covers one lesson's Speaking practice exchange even for a learner who's also been chatting with Han elsewhere - just a cap on unbounded growth as conversation history accumulates over a learner's lifetime, not a business-logic limit. */
const SPEAKING_TRANSCRIPT_LOOKBACK = 200;

async function getSpeakingTranscriptForLesson(
  userId: string,
  lessonTitle: string,
): Promise<LessonSpeakingRecord> {
  const conversation = await db.aiConversation.findUnique({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: SPEAKING_TRANSCRIPT_LOOKBACK,
      },
    },
  });
  if (!conversation) return { transcript: [], speakingEvidence: [] };

  const messages = [...conversation.messages].reverse().filter((message) => {
    const snapshot = message.contextSnapshot as ContextSnapshotShape | null;
    return snapshot?.lessonTitle === lessonTitle && Boolean(snapshot?.rolePlay);
  });
  const speakingEvidence = messages.flatMap((message) => {
    const snapshot = message.contextSnapshot as ContextSnapshotShape | null;
    if (!snapshot?.speakingEvidenceRecord) return [];
    try {
      return sanitizeSpeakingTurnEvidence(JSON.parse(message.content));
    } catch {
      return [];
    }
  });
  const transcript = messages
    .filter((message) => {
      const snapshot = message.contextSnapshot as ContextSnapshotShape | null;
      return !snapshot?.speakingEvidenceRecord;
    })
    .map((message) => ({
      role:
        message.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: message.content,
    }));
  return { transcript, speakingEvidence };
}

async function computeSpeakingScore(
  lesson: {
    title: string;
    mission: {
      learnerRole: string | null;
      aiRole: string | null;
      objective: string;
      successConditions: { description: string }[];
    } | null;
    vocabulary: { vocabularyItem: { chineseForm: string } }[];
    grammarPoints: { grammarPoint: { name: string; structure: string } }[];
  },
  userId: string,
): Promise<{
  score: number | null;
  feedback: SpeakingConversationFeedback | null;
}> {
  if (!lesson.mission) return { score: null, feedback: null };

  const { transcript, speakingEvidence } = await getSpeakingTranscriptForLesson(
    userId,
    lesson.title,
  );
  // A greeting and an immediate exit do not demonstrate Speaking ability.
  if (!hasEnoughSpeakingEvidence(transcript))
    return { score: null, feedback: null };

  try {
    await checkDailyUsageCap(userId, "lesson-reflection");
    const result = await getAiProvider().complete({
      systemPrompt: buildSpeakingConversationFeedbackPrompt(
        {
          learnerRole: lesson.mission.learnerRole ?? "the learner",
          aiRole: lesson.mission.aiRole ?? "the AI",
          objective: lesson.mission.objective,
          taughtVocabulary: lesson.vocabulary.map(
            (item) => item.vocabularyItem.chineseForm,
          ),
          taughtGrammar: lesson.grammarPoints.map(
            (item) =>
              `${item.grammarPoint.name}: ${item.grammarPoint.structure}`,
          ),
          successConditions: lesson.mission.successConditions.map(
            (condition) => condition.description,
          ),
        },
        transcript,
        speakingEvidence,
      ),
      messages: [{ role: "user", content: "Evaluate this conversation." }],
      // GPT-5 reasoning tokens count against this budget. The full rubric and
      // mistake list need more room than an ordinary chat reply.
      maxOutputTokens: 1_600,
      // Reflection is a background-quality evaluation, not an interactive
      // chat turn, so allow it to finish without slowing Han elsewhere.
      timeoutMs: 45_000,
    });
    await recordAiUsage({
      userId,
      feature: "lesson-reflection",
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
    const feedback = parseSpeakingConversationFeedback(result.content);
    // Points & Leveling System (2026-08-15): multiplicative, not an
    // average - a weak vocabulary/objective ratio caps the score.
    const score = computeSpeakingConversationScore(feedback);
    return { score, feedback };
  } catch (error) {
    if (
      !(error instanceof AiProviderError) &&
      !(error instanceof DailyUsageCapExceededError)
    ) {
      throw error;
    }
    return {
      score: null,
      feedback: {
        ...DEFAULT_SPEAKING_CONVERSATION_FEEDBACK,
        notes: "Speaking evaluation is temporarily unavailable.",
        recommendedNextStep: "Speaking evaluation pending.",
      },
    };
  }
}

export interface LessonReflectionReportView {
  vocabularyCovered: number;
  vocabularyTotal: number;
  vocabularyScore: number | null;
  comprehensionScore: number | null;
  grammarScore: number | null;
  speakingScore: number | null;
  speakingDimensions: SpeakingConversationFeedback | null;
  /** Weighted session total (0-100): Vocabulary(20)+Grammar(20)+Comprehension(30)+Speaking(30). Null until all four are available. */
  totalScore: number | null;
  hanNarrative: string;
  strengths: string[];
  improvements: string[];
}

/**
 * Lazily generates and caches the Reflection step's scored report for one
 * learner's completion of one lesson - not regenerated every time they
 * revisit the same report (user decision, 2026-08-08).
 */
/** Shared by the staleness check and the actual regeneration below - both end up needing the exact same lesson shape, so widening this to serve both instead of fetching it twice is what fixes Tier 2's single biggest finding (project/db-operations-optimization.md). */
function fetchLessonForReflection(lessonId: string) {
  return db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      vocabulary: {
        include: {
          vocabularyItem: {
            select: { chineseForm: true, examples: { select: { id: true } } },
          },
        },
      },
      grammarPoints: {
        include: { grammarPoint: { select: { name: true, structure: true } } },
      },
      scenarioLevel: { select: { difficulty: true } },
    },
  });
}

export async function getOrGenerateLessonReflectionReport(
  userId: string,
  lessonId: string,
): Promise<LessonReflectionReportView> {
  const existing = await db.lessonReflectionReport.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  const existingSpeaking = existing?.speakingDimensions as
    SpeakingConversationFeedback | null | undefined;

  // Needed either way: to check whether a cached report's scores are still
  // accurate (below, only when `existing`) or to actually compute them if
  // regeneration turns out to be necessary (further down) - fetched once
  // here instead of up to twice.
  const scoredExercises = await db.exercise.findMany({
    where: { lessonId, status: "PUBLISHED" },
    select: { id: true, grammarPointId: true },
  });
  const comprehensionExerciseIds = scoredExercises
    .filter((item) => !item.grammarPointId)
    .map((item) => item.id);
  const grammarExerciseIds = scoredExercises
    .filter((item) => item.grammarPointId)
    .map((item) => item.id);

  let exerciseScoreMismatch = false;
  let vocabularyScoreMismatch = false;
  // Only meaningful when `existing` is truthy (that's the only branch that
  // sets them) - already the fresh, correct scores at that point (that's
  // what the mismatch check needs them for), so the regeneration path
  // further down reuses them directly instead of recomputing a third time.
  let freshComprehensionScore: number | null = null;
  let freshGrammarScore: number | null = null;
  let freshVocabularyScore: number | null = null;
  // Doubles as the full lesson row regeneration needs, if it turns out to
  // be necessary - the narrow shape this used before was a second, separate
  // fetch of the same row (see fetchLessonForReflection above).
  let lesson: Awaited<ReturnType<typeof fetchLessonForReflection>> | null =
    null;

  if (existing) {
    lesson = await fetchLessonForReflection(lessonId);
    [freshComprehensionScore, freshGrammarScore, freshVocabularyScore] =
      await Promise.all([
        computeExerciseScore(userId, comprehensionExerciseIds),
        computeExerciseScore(userId, grammarExerciseIds),
        lesson
          ? computeVocabularyScore(
              userId,
              lessonId,
              lesson.vocabulary.map((v) => ({
                vocabularyItemId: v.vocabularyItemId,
                exampleCount: v.vocabularyItem.examples.length,
              })),
              lesson.scenarioLevel.difficulty,
            )
          : null,
      ]);
    exerciseScoreMismatch =
      existing.comprehensionScore !== freshComprehensionScore ||
      existing.grammarScore !== freshGrammarScore;
    vocabularyScoreMismatch = existing.vocabularyScore !== freshVocabularyScore;
  }
  // A report generated before the vocabularyUsageRatio/objectiveCompletionRatio
  // fields existed (2026-08-16) has neither - regenerate it under the new
  // multiplicative Speaking formula instead of trusting a stale score.
  const usesLegacySpeakingRubric = Boolean(
    existing?.speakingScore !== null &&
    existingSpeaking &&
    typeof existingSpeaking.vocabularyUsageRatio !== "number",
  );
  const hasFailedSpeakingFallback = Boolean(
    existing?.speakingScore === null &&
    (existingSpeaking?.recommendedNextStep ===
      "Feel free to try this activity again." ||
      existingSpeaking?.recommendedNextStep === "Speaking evaluation pending."),
  );
  const hasNonEnglishCachedNarrative = Boolean(
    existing &&
    containsNonEnglishCachedNarrative(
      existing.hanNarrative,
      existing.strengths,
      existing.improvements,
    ),
  );
  if (
    existing &&
    !usesLegacySpeakingRubric &&
    !exerciseScoreMismatch &&
    !vocabularyScoreMismatch &&
    !hasFailedSpeakingFallback &&
    !hasNonEnglishCachedNarrative
  ) {
    await syncLessonSpeakingEvidence(userId, lessonId, existing.speakingScore);
    return {
      vocabularyCovered: existing.vocabularyCovered,
      vocabularyTotal: existing.vocabularyTotal,
      vocabularyScore: existing.vocabularyScore,
      comprehensionScore: existing.comprehensionScore,
      grammarScore: existing.grammarScore,
      speakingScore: existing.speakingScore,
      speakingDimensions:
        existing.speakingDimensions as SpeakingConversationFeedback | null,
      totalScore: existing.totalScore,
      hanNarrative: existing.hanNarrative,
      strengths: existing.strengths as string[],
      improvements: existing.improvements as string[],
    };
  }
  if (existing) {
    await db.lessonReflectionReport.delete({ where: { id: existing.id } });
  }

  // Already fetched above when `existing` was truthy - only a first-ever
  // report (no `existing` at all) still needs it here.
  lesson ??= await fetchLessonForReflection(lessonId);
  if (!lesson) {
    throw new ReflectionNotFoundError("Lesson not found.");
  }
  const mission = await db.mission.findFirst({
    where: { lessonId, status: "PUBLISHED" },
    include: { successConditions: { orderBy: { order: "asc" } } },
  });

  const vocabularyItemIds = lesson.vocabulary.map((v) => v.vocabularyItemId);
  const vocabularyCovered =
    vocabularyItemIds.length > 0
      ? await db.learnerVocabularyInteraction.count({
          where: { userId, vocabularyItemId: { in: vocabularyItemIds } },
        })
      : 0;

  // When `existing` was truthy, the mismatch check above already computed
  // these 3 scores fresh (that's what "mismatch" means - comparing the
  // cached value to a freshly computed one) - reuse them instead of a
  // third computation. Only a first-ever report (no `existing`) computes
  // them here for the first time.
  const [comprehensionScore, grammarScore, vocabularyScore, speaking] =
    await Promise.all([
      existing
        ? freshComprehensionScore
        : computeExerciseScore(userId, comprehensionExerciseIds),
      existing
        ? freshGrammarScore
        : computeExerciseScore(userId, grammarExerciseIds),
      existing
        ? freshVocabularyScore
        : computeVocabularyScore(
            userId,
            lessonId,
            lesson.vocabulary.map((v) => ({
              vocabularyItemId: v.vocabularyItemId,
              exampleCount: v.vocabularyItem.examples.length,
            })),
            lesson.scenarioLevel.difficulty,
          ),
      computeSpeakingScore(
        {
          title: lesson.title,
          mission,
          vocabulary: lesson.vocabulary,
          grammarPoints: lesson.grammarPoints,
        },
        userId,
      ),
    ]);
  const totalScore = computeReflectionTotal({
    vocabularyScore,
    grammarScore,
    comprehensionScore,
    speakingScore: speaking.score,
  });

  let narrative = parseHanReflectionNarrative("");
  try {
    await checkDailyUsageCap(userId, "lesson-reflection");
    const result = await getAiProvider().complete({
      systemPrompt: buildHanReflectionNarrativePrompt(lesson.title, {
        vocabularyCovered,
        vocabularyTotal: vocabularyItemIds.length,
        vocabularyScore,
        comprehensionScore,
        grammarScore,
        speakingScore: speaking.score,
      }),
      messages: [{ role: "user", content: "Write the note." }],
      maxOutputTokens: 500,
    });
    await recordAiUsage({
      userId,
      feature: "lesson-reflection",
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
    narrative = parseHanReflectionNarrative(result.content);
  } catch (error) {
    if (
      !(error instanceof AiProviderError) &&
      !(error instanceof DailyUsageCapExceededError)
    ) {
      throw error;
    }
  }

  const created = await db.lessonReflectionReport.create({
    data: {
      userId,
      lessonId,
      vocabularyCovered,
      vocabularyTotal: vocabularyItemIds.length,
      vocabularyScore,
      comprehensionScore,
      grammarScore,
      speakingScore: speaking.score,
      speakingDimensions: speaking.feedback
        ? (speaking.feedback as unknown as Prisma.InputJsonValue)
        : undefined,
      totalScore,
      hanNarrative: narrative.narrative,
      strengths: narrative.strengths,
      improvements: narrative.improvements,
    },
  });

  await syncLessonSpeakingEvidence(userId, lessonId, created.speakingScore);
  await checkReflectionAchievements(userId, totalScore);
  // HanCoins (2026-08-30): 1/2/3 coins by star band, once per lesson ever -
  // placement-credited completions never reach this branch at all
  // (applyPlacementCredit inserts LessonReflectionReport rows directly, see
  // placement-credit.ts), so no separate source-guard is needed here.
  await grantCoins(
    userId,
    starsForScore(totalScore),
    "lesson_completed",
    `lesson:${lessonId}`,
  );

  return {
    vocabularyCovered: created.vocabularyCovered,
    vocabularyTotal: created.vocabularyTotal,
    vocabularyScore: created.vocabularyScore,
    comprehensionScore: created.comprehensionScore,
    grammarScore: created.grammarScore,
    speakingScore: created.speakingScore,
    speakingDimensions:
      created.speakingDimensions as SpeakingConversationFeedback | null,
    totalScore: created.totalScore,
    hanNarrative: created.hanNarrative,
    strengths: created.strengths as string[],
    improvements: created.improvements as string[],
  };
}

export interface LessonScoreBreakdown {
  vocabulary: ScoreCounts | null;
  grammar: ScoreCounts | null;
  comprehension: ScoreCounts | null;
  speakingMistakeCount: number | null;
}

/**
 * Per-category correct/incorrect counts behind each Reflection score card
 * (2026-08-16 user request: long-press a card to see "how many right, how
 * many wrong"). Recomputed fresh from the same attempt tables the scores
 * themselves derive from rather than persisted - cheap, and avoids a
 * schema change just to cache a number the score already implies. Speaking
 * has no clean correct/incorrect count (it's a continuous rubric, not
 * graded questions), so it surfaces the number of specific mistakes the
 * Speaking evaluator identified instead, read from the already-cached
 * LessonReflectionReport rather than triggering a second AI call.
 */
export async function getLessonScoreBreakdown(
  userId: string,
  lessonId: string,
): Promise<LessonScoreBreakdown> {
  const [lesson, report] = await Promise.all([
    db.lesson.findUnique({
      where: { id: lessonId },
      select: {
        vocabulary: {
          select: {
            vocabularyItemId: true,
            vocabularyItem: { select: { examples: { select: { id: true } } } },
          },
        },
        scenarioLevel: { select: { difficulty: true } },
      },
    }),
    db.lessonReflectionReport.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      select: { speakingDimensions: true },
    }),
  ]);
  if (!lesson) throw new ReflectionNotFoundError("Lesson not found.");

  const scoredExercises = await db.exercise.findMany({
    where: { lessonId, status: "PUBLISHED" },
    select: { id: true, grammarPointId: true },
  });
  const comprehensionExerciseIds = scoredExercises
    .filter((item) => !item.grammarPointId)
    .map((item) => item.id);
  const grammarExerciseIds = scoredExercises
    .filter((item) => item.grammarPointId)
    .map((item) => item.id);

  const [comprehension, grammar, vocabulary] = await Promise.all([
    computeExerciseCounts(userId, comprehensionExerciseIds),
    computeExerciseCounts(userId, grammarExerciseIds),
    computeVocabularyCounts(
      userId,
      lessonId,
      lesson.vocabulary.map((v) => ({
        vocabularyItemId: v.vocabularyItemId,
        exampleCount: v.vocabularyItem.examples.length,
      })),
      lesson.scenarioLevel.difficulty,
    ),
  ]);

  const speakingDimensions =
    report?.speakingDimensions as SpeakingConversationFeedback | null;

  return {
    comprehension: comprehensionExerciseIds.length > 0 ? comprehension : null,
    grammar: grammarExerciseIds.length > 0 ? grammar : null,
    vocabulary: lesson.vocabulary.length > 0 ? vocabulary : null,
    speakingMistakeCount: speakingDimensions?.mistakes?.length ?? null,
  };
}
