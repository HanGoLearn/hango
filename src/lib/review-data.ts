import { db } from "@/lib/db";
import {
  REVIEW_COOLDOWN_HOURS,
  type ReviewItem,
  type ReviewItemType,
} from "@/lib/review-queue";
import {
  getCompletedLessonIds,
  getLessonVocabularyRows,
  getLessonGrammarPointRows,
} from "@/lib/content/learning-journey-data";

const ITEMS_PER_TYPE = 2;
const COOLDOWN_TRACKED_TYPES: ReviewItemType[] = [
  "VOCABULARY",
  "GRAMMAR",
  "MISTAKE",
  "DIALOGUE",
];

/**
 * One filtered query instead of 4 unbounded ones (one per item type, no
 * createdAt/take bound - project/db-operations-optimization.md, Tier 1).
 * Only rows within the cooldown window can possibly put an item on
 * cooldown, so filtering to `createdAt >= cutoff` up front is exactly
 * equivalent to the old "fetch everything, keep only the most recent row
 * per key, check if that one's within cooldown" logic - any row that
 * survives the filter already means its itemKey is on cooldown.
 */
async function getRecentlyReviewedKeysByType(
  userId: string,
): Promise<Record<ReviewItemType, Set<string>>> {
  const cutoff = new Date(Date.now() - REVIEW_COOLDOWN_HOURS * 60 * 60 * 1000);
  const rows = await db.reviewCompletion.findMany({
    where: {
      userId,
      itemType: { in: COOLDOWN_TRACKED_TYPES },
      createdAt: { gte: cutoff },
    },
    select: { itemType: true, itemKey: true },
  });

  const byType: Record<ReviewItemType, Set<string>> = {
    VOCABULARY: new Set(),
    GRAMMAR: new Set(),
    MISTAKE: new Set(),
    DIALOGUE: new Set(),
    AI_PRACTICE: new Set(),
  };
  for (const row of rows) {
    // itemType is a plain String column (not a real Prisma enum), but the
    // `in: COOLDOWN_TRACKED_TYPES` filter above already guarantees every
    // row here is one of those 4 values at runtime.
    byType[row.itemType as ReviewItemType].add(row.itemKey);
  }
  return byType;
}

/** 13.5 - builds the review queue from the learner's real activity history. */
export async function getReviewQueue(userId: string): Promise<ReviewItem[]> {
  const lessonIds = await getCompletedLessonIds(userId);
  if (lessonIds.length === 0) return [];

  const cooldownByType = await getRecentlyReviewedKeysByType(userId);
  const vocabOnCooldown = cooldownByType.VOCABULARY;
  const grammarOnCooldown = cooldownByType.GRAMMAR;
  const mistakeOnCooldown = cooldownByType.MISTAKE;
  const dialogueOnCooldown = cooldownByType.DIALOGUE;

  const items: ReviewItem[] = [];

  const vocabRows = await getLessonVocabularyRows(userId);
  for (const row of vocabRows) {
    if (items.filter((i) => i.type === "VOCABULARY").length >= ITEMS_PER_TYPE)
      break;
    if (vocabOnCooldown.has(row.vocabularyItemId)) continue;
    items.push({
      id: `VOCABULARY:${row.vocabularyItemId}`,
      type: "VOCABULARY",
      itemKey: row.vocabularyItemId,
      title: row.vocabularyItem.chineseForm,
      reason: `You learned this in "${row.lesson.title}"`,
      estimatedMinutes: 2,
      actionLabel: "Review",
      actionHref: `/lesson/${row.lesson.slug}`,
    });
  }

  const grammarRows = await getLessonGrammarPointRows(userId);
  for (const row of grammarRows) {
    if (items.filter((i) => i.type === "GRAMMAR").length >= ITEMS_PER_TYPE)
      break;
    if (grammarOnCooldown.has(row.grammarPointId)) continue;
    items.push({
      id: `GRAMMAR:${row.grammarPointId}`,
      type: "GRAMMAR",
      itemKey: row.grammarPointId,
      title: row.grammarPoint.name,
      reason: `You learned this in "${row.lesson.title}"`,
      estimatedMinutes: 3,
      actionLabel: "Review",
      actionHref: `/lesson/${row.lesson.slug}`,
    });
  }

  const mistakes = await db.exerciseAttempt.findMany({
    where: {
      userId,
      isCorrect: false,
      exercise: { lessonId: { in: lessonIds } },
    },
    include: {
      exercise: {
        include: { lesson: { select: { slug: true, title: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  const seenExercises = new Set<string>();
  for (const attempt of mistakes) {
    if (items.filter((i) => i.type === "MISTAKE").length >= ITEMS_PER_TYPE)
      break;
    if (seenExercises.has(attempt.exerciseId)) continue;
    seenExercises.add(attempt.exerciseId);
    if (mistakeOnCooldown.has(attempt.exerciseId)) continue;
    items.push({
      id: `MISTAKE:${attempt.exerciseId}`,
      type: "MISTAKE",
      itemKey: attempt.exerciseId,
      title: attempt.exercise.prompt,
      reason: "You got this wrong recently",
      estimatedMinutes: 2,
      actionLabel: "Try again",
      actionHref: `/lesson/${attempt.exercise.lesson.slug}`,
    });
  }

  const dialogues = await db.dialogue.findMany({
    where: { lessonId: { in: lessonIds }, status: "PUBLISHED" },
    include: { lesson: { select: { slug: true, title: true } } },
  });
  for (const dialogue of dialogues) {
    if (items.filter((i) => i.type === "DIALOGUE").length >= ITEMS_PER_TYPE)
      break;
    if (dialogueOnCooldown.has(dialogue.id)) continue;
    items.push({
      id: `DIALOGUE:${dialogue.id}`,
      type: "DIALOGUE",
      itemKey: dialogue.id,
      title: `Replay: ${dialogue.title}`,
      reason: `From "${dialogue.lesson.title}" - practice listening again`,
      estimatedMinutes: 3,
      actionLabel: "Replay",
      actionHref: `/lesson/${dialogue.lesson.slug}`,
    });
  }

  items.push({
    id: "AI_PRACTICE:general",
    type: "AI_PRACTICE",
    itemKey: "general",
    title: "AI-generated practice",
    reason: "Get a fresh practice question from your AI Teacher",
    estimatedMinutes: 5,
    actionLabel: "Start",
  });

  return items;
}

/** 13.6 "Store review results" - just an acknowledgement that this item was acted on, used to apply the cooldown. */
export async function completeReviewItem(
  userId: string,
  itemType: ReviewItemType,
  itemKey: string,
): Promise<void> {
  await db.reviewCompletion.create({ data: { userId, itemType, itemKey } });
}
