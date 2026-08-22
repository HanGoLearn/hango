/**
 * Adaptive placement exam - pure, testable engine (project/TASKS.md,
 * "Adaptive placement exam", 2026-08-16 pilot; redesigned 2026-08-19,
 * "Placement exam — adaptive engine redesign"). Same split as
 * points-system.ts: this file only computes; the actual DB reads/writes
 * live in placement-exam-data.ts.
 *
 * TWO mechanisms coexist here, deliberately - see the 2026-08-19 design
 * note in TASKS.md for the full reasoning:
 *
 * - **Level-gate** (Vocabulary/Grammar): each level asks a FIXED number
 *   of questions per category (questionsPerCategory below), once, then
 *   locks in pass/fail from that one pass - no retries. Replaces the
 *   original "keep asking until MASTERY_THRESHOLD_PER_CATEGORY correct or
 *   the category's bank is exhausted" approach, which let a learner
 *   stuck on one category grind through it (real measured cost: 44
 *   Vocabulary + 72 Grammar questions for a learner who climbs cleanly to
 *   HSK7 in both - project/db-operations-optimization.md's placement-exam
 *   section).
 * - **Accumulate-to-mastery** (Reading/Listening, unchanged): each has
 *   only one category ("comprehension") per level, so the level-gate's
 *   original problem (multiple categories, one stuck one grinding the
 *   whole level) never applied - already efficient, kept as-is.
 *
 * Both are still driven by the same "never a single number" principle:
 * each skill (Vocabulary/Grammar/Reading/Listening) gets its own detected
 * HSK level, because recognizing and producing/understanding are
 * different skills.
 */

export type PlacementSkillName =
  "VOCABULARY" | "GRAMMAR" | "READING" | "LISTENING";

export const PLACEMENT_SKILLS: PlacementSkillName[] = [
  "VOCABULARY", "GRAMMAR", "READING", "LISTENING",
];

/**
 * Ceiling the adaptive engine will climb to. Raised from 2 to 9 (2026-08-16,
 * "ahora si realiza el examen") once the full HSK1-9 item bank was seeded -
 * see project/placement-exam-questions.md. HSK7-9 is diagnostic only
 * (points_system.md's Lab-evidence-only rule for 1650-2000 points) - the
 * engine still climbs there so the learner sees how far their real ability
 * goes, but callers must not treat that tier as real placement/credit.
 */
export const PILOT_MAX_HSK_LEVEL = 9;

export interface PlacementQuestionMeta {
  id: string;
  skill: PlacementSkillName;
  hskLevel: number;
  category: string;
  type: "MULTIPLE_CHOICE" | "SENTENCE_ORDERING";
}

export interface PlacementAttemptRecord {
  questionId: string;
  isCorrect: boolean;
  /** Order the attempt happened in, ascending. Not used by either mechanism below directly (kept on the type since callers/DB layer still record and pass it around), but no longer drives an early-cutoff streak - see the 2026-08-19 design note for why that check was removed in favor of the level-gate itself producing the same effect, per skill. */
  sequence: number;
}

/** Per skill -> level -> category: how many attempts were made, and how many were correct. Tracks both (not just correct, unlike the pre-2026-08-19 version) because the level-gate mechanism below needs to know when a category has received its required number of attempts, not just whether it's been "mastered". */
export interface CategoryStats {
  attempted: number;
  correct: number;
}

export type CategoryProgress = Map<
  PlacementSkillName,
  Map<number, Map<string, CategoryStats>>
>;

export function computeCategoryProgress(
  attempts: PlacementAttemptRecord[],
  questionsById: Map<string, PlacementQuestionMeta>,
): CategoryProgress {
  const progress: CategoryProgress = new Map();
  for (const attempt of attempts) {
    const question = questionsById.get(attempt.questionId);
    if (!question) continue;

    const bySkill = progress.get(question.skill) ?? new Map();
    progress.set(question.skill, bySkill);
    const byLevel = bySkill.get(question.hskLevel) ?? new Map();
    bySkill.set(question.hskLevel, byLevel);
    const stats = byLevel.get(question.category) ?? { attempted: 0, correct: 0 };
    byLevel.set(question.category, stats);

    stats.attempted += 1;
    if (attempt.isCorrect) stats.correct += 1;
  }
  return progress;
}

// ============================================================================
// Accumulate-to-mastery mechanism - Reading/Listening only (unchanged design)
// ============================================================================

/** How many correct answers in one category before it counts as covered - Reading/Listening only. Vocabulary/Grammar use questionsPerCategory + LEVEL_PASS_RATIO instead (below). */
export const MASTERY_THRESHOLD_PER_CATEGORY = 2;

/**
 * Every category at this level must independently reach the threshold -
 * `levelCategories` is the full set of categories that exist for this
 * skill/level in the item bank, not just the ones attempted so far, so an
 * un-attempted category correctly blocks mastery instead of being ignored.
 * Reading/Listening only - see the file header.
 */
export function isLevelMastered(
  progress: CategoryProgress,
  skill: PlacementSkillName,
  hskLevel: number,
  levelCategories: string[],
): boolean {
  if (levelCategories.length === 0) return false;
  const byCategory = progress.get(skill)?.get(hskLevel);
  if (!byCategory) return false;
  return levelCategories.every(
    (category) => (byCategory.get(category)?.correct ?? 0) >= MASTERY_THRESHOLD_PER_CATEGORY,
  );
}

/**
 * Highest level mastered so far for a skill, walking up contiguously from 1
 * (a gap can't be skipped - mastering HSK2 without HSK1's evidence isn't
 * meaningful). 0 means "no level mastered yet" (Pre-HSK).
 * Reading/Listening only - see the file header.
 */
export function currentSkillLevel(
  progress: CategoryProgress,
  skill: PlacementSkillName,
  categoriesByLevel: Map<number, string[]>,
  maxLevel: number = PILOT_MAX_HSK_LEVEL,
): number {
  let level = 0;
  for (let candidate = 1; candidate <= maxLevel; candidate++) {
    const categories = categoriesByLevel.get(candidate) ?? [];
    if (isLevelMastered(progress, skill, candidate, categories)) {
      level = candidate;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Which category to draw the next question from for a skill: the lowest
 * not-yet-mastered level, then within it, the category furthest from the
 * threshold (ties broken by category order) - keeps coverage balanced
 * instead of hammering one category to the threshold before touching
 * another. Reading/Listening only - see the file header.
 */
export function selectNextCategory(
  progress: CategoryProgress,
  skill: PlacementSkillName,
  categoriesByLevel: Map<number, string[]>,
  maxLevel: number = PILOT_MAX_HSK_LEVEL,
): { hskLevel: number; category: string } | null {
  const level = currentSkillLevel(progress, skill, categoriesByLevel, maxLevel) + 1;
  if (level > maxLevel) return null;

  const categories = categoriesByLevel.get(level) ?? [];
  if (categories.length === 0) return null;

  const byCategory = progress.get(skill)?.get(level);
  let best: { category: string; correct: number } | null = null;
  for (const category of categories) {
    const correct = byCategory?.get(category)?.correct ?? 0;
    if (correct >= MASTERY_THRESHOLD_PER_CATEGORY) continue;
    if (!best || correct < best.correct) best = { category, correct };
  }
  if (!best) return null;
  return { hskLevel: level, category: best.category };
}

// ============================================================================
// Level-gate mechanism - Vocabulary/Grammar only (2026-08-19 redesign)
// ============================================================================

/** Fraction of a level's fixed question set that must be correct to advance - always rounded UP via levelPassThreshold, never down, so the bar never gets easier by rounding. */
export const LEVEL_PASS_RATIO = 0.8;

/**
 * How many questions each category at this level/skill asks, in one
 * single pass, no retries. 3 for Vocabulary HSK5+ specifically - that
 * band only has 2 categories (noun/verb, project/placement-exam-questions.md),
 * and 2 would leave `levelPassThreshold` needing 100% (Math.ceil(4*0.8)=4)
 * - zero margin for one bad/ambiguous question, right where content is
 * hardest. Every other skill/level combination uses 2.
 */
export function questionsPerCategory(
  skill: PlacementSkillName,
  hskLevel: number,
): number {
  if (skill === "VOCABULARY" && hskLevel >= 5) return 3;
  return 2;
}

/** How many of a level's total questions must be correct to pass - rounds up, never down. */
export function levelPassThreshold(questionCount: number): number {
  return Math.ceil(questionCount * LEVEL_PASS_RATIO);
}

export type LevelGateStatus = "pending" | "passed" | "failed";

/**
 * Whether this level's fixed question set has been fully asked yet, and
 * if so, whether it was passed. "pending" covers both "hasn't started"
 * and "started but not every category has reached its required attempt
 * count yet" - callers needing to distinguish those two only care about
 * "is there more to ask", which selectNextGatedQuestion (below) already
 * answers directly.
 *
 * Resolves EARLY, before every category has its required attempts, the
 * moment the outcome is mathematically certain either way - "passed" as
 * soon as the correct count alone already meets the threshold (no
 * remaining answer, however it goes, can undo that), "failed" as soon as
 * even a perfect score on every remaining question couldn't reach it.
 * Skipping the remaining questions in either case loses no information
 * relevant to the pass/fail decision - they can't change it - so this is
 * a pure operations saving, not a leniency/strictness tradeoff (found
 * 2026-08-19, after live-measuring that a perfect-scorer run was still
 * asking already-decided questions - project/TASKS.md's placement-exam
 * redesign section).
 */
export function levelGateStatus(
  progress: CategoryProgress,
  skill: PlacementSkillName,
  hskLevel: number,
  levelCategories: string[],
): LevelGateStatus {
  if (levelCategories.length === 0) return "pending";
  const required = questionsPerCategory(skill, hskLevel);
  const byCategory = progress.get(skill)?.get(hskLevel);

  let totalAttempted = 0;
  let totalCorrect = 0;
  for (const category of levelCategories) {
    const stats = byCategory?.get(category);
    totalAttempted += Math.min(stats?.attempted ?? 0, required);
    totalCorrect += stats?.correct ?? 0;
  }

  const totalQuestions = levelCategories.length * required;
  const threshold = levelPassThreshold(totalQuestions);
  if (totalCorrect >= threshold) return "passed";

  const remaining = totalQuestions - totalAttempted;
  if (totalCorrect + remaining < threshold) return "failed";

  return "pending";
}

/**
 * Highest level passed so far for a skill, walking up contiguously from 1
 * - same "no skipping a gap" rule as the accumulate mechanism's
 * currentSkillLevel. 0 means "no level passed yet" (Pre-HSK).
 */
export function currentGatedLevel(
  progress: CategoryProgress,
  skill: PlacementSkillName,
  categoriesByLevel: Map<number, string[]>,
  maxLevel: number = PILOT_MAX_HSK_LEVEL,
): number {
  let level = 0;
  for (let candidate = 1; candidate <= maxLevel; candidate++) {
    const categories = categoriesByLevel.get(candidate) ?? [];
    if (levelGateStatus(progress, skill, candidate, categories) !== "passed") break;
    level = candidate;
  }
  return level;
}

/**
 * Whether this skill's climb is permanently over because it attempted and
 * failed the next level's gate - as opposed to simply not having reached
 * the ceiling yet. Once true, the skill never gets asked another question
 * for the rest of the session (see nextGatedQuestionTarget below), and
 * currentGatedLevel's result is final.
 */
export function hasGatedSkillStopped(
  progress: CategoryProgress,
  skill: PlacementSkillName,
  categoriesByLevel: Map<number, string[]>,
  maxLevel: number = PILOT_MAX_HSK_LEVEL,
): boolean {
  const level = currentGatedLevel(progress, skill, categoriesByLevel, maxLevel);
  if (level >= maxLevel) return false;
  const nextLevel = level + 1;
  const categories = categoriesByLevel.get(nextLevel) ?? [];
  return levelGateStatus(progress, skill, nextLevel, categories) === "failed";
}

/**
 * Which category to draw the next question from: the category in the
 * current gate level (currentGatedLevel + 1) that has received the fewest
 * attempts so far among those still under their required count - keeps
 * categories balanced within the level instead of finishing one before
 * touching another. Returns null once the skill has stopped (failed a
 * gate), reached the ceiling, or (defensively) if every category in the
 * target level already has its required attempts recorded, which
 * shouldn't happen in practice since levelGateStatus would already report
 * that level as resolved (passed/failed) at that point.
 */
export function nextGatedQuestionTarget(
  progress: CategoryProgress,
  skill: PlacementSkillName,
  categoriesByLevel: Map<number, string[]>,
  maxLevel: number = PILOT_MAX_HSK_LEVEL,
): { hskLevel: number; category: string } | null {
  return nextGatedQuestionTargets(progress, skill, categoriesByLevel, 1, maxLevel)[0] ?? null;
}

/**
 * Up to `batchSize` targets for the current gate level, balanced across
 * categories the same way as nextGatedQuestionTarget (fewest-attempted-so-
 * far first, ties by category order) - lets a caller batch several
 * questions from one level into a single screen/submission (2026-08-19
 * "agrupar preguntas por pantalla" - project/TASKS.md) instead of paying
 * the fixed per-question session/attempts overhead once per question.
 *
 * Deliberately still per-level, not per-gate: this only ever returns
 * targets from the SAME level nextGatedQuestionTarget would offer next, so
 * a caller that checks levelGateStatus again between batches (not mid-
 * batch) still gets the early-exit's full benefit for a struggling learner
 * - only a learner who's still "pending" at the end of a batch gets asked
 * another one.
 */
export function nextGatedQuestionTargets(
  progress: CategoryProgress,
  skill: PlacementSkillName,
  categoriesByLevel: Map<number, string[]>,
  batchSize: number,
  maxLevel: number = PILOT_MAX_HSK_LEVEL,
): { hskLevel: number; category: string }[] {
  if (hasGatedSkillStopped(progress, skill, categoriesByLevel, maxLevel)) return [];

  const level = currentGatedLevel(progress, skill, categoriesByLevel, maxLevel) + 1;
  if (level > maxLevel) return [];

  const categories = categoriesByLevel.get(level) ?? [];
  if (categories.length === 0) return [];

  const required = questionsPerCategory(skill, level);
  const byCategory = progress.get(skill)?.get(level);
  const attemptedSoFar = new Map(
    categories.map((category) => [category, byCategory?.get(category)?.attempted ?? 0]),
  );

  const targets: { hskLevel: number; category: string }[] = [];
  while (targets.length < batchSize) {
    let best: { category: string; attempted: number } | null = null;
    for (const category of categories) {
      const attempted = attemptedSoFar.get(category) ?? 0;
      if (attempted >= required) continue;
      if (!best || attempted < best.attempted) best = { category, attempted };
    }
    if (!best) break;
    targets.push({ hskLevel: level, category: best.category });
    attemptedSoFar.set(best.category, best.attempted + 1);
  }
  return targets;
}
