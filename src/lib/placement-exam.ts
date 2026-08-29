/**
 * Adaptive placement exam - pure, testable engine (project/TASKS.md,
 * "Adaptive placement exam", 2026-08-16 pilot; redesigned 2026-08-19,
 * "Placement exam — adaptive engine redesign"; unified 2026-08-27). Same
 * split as points-system.ts: this file only computes; the actual DB reads/
 * writes live in placement-exam-data.ts.
 *
 * All 4 written skills (Vocabulary/Grammar/Reading/Listening) share ONE
 * mechanism - **level-gate**: each level asks a FIXED number of questions
 * per category (questionsPerCategory below), once, then locks in pass/fail
 * from that one pass - no retries, and it resolves EARLY (levelGateStatus)
 * the moment the outcome is mathematically certain, so a struggling learner
 * is never asked more questions than necessary to decide the level.
 *
 * Reading/Listening used a separate "accumulate-to-mastery" mechanism until
 * 2026-08-27 (keep asking a category until MASTERY_THRESHOLD_PER_CATEGORY
 * correct, however many attempts that took) - it never had Vocabulary/
 * Grammar's original multi-category grinding problem (each has only one
 * category, "comprehension", per level), but it also never stopped early
 * on repeated failure, which real user testing surfaced as confusing
 * ("why does it keep asking more Reading after I already failed"). Folding
 * them into the level-gate mechanism fixes that directly, at the cost of a
 * stricter pass bar where the real item bank per level is small (HSK5-9
 * Reading/Listening: 2 questions/level, so LEVEL_PASS_RATIO's ceiling
 * rounds the threshold up to both correct - consistent with the mechanism's
 * existing "round up, never down" rule elsewhere).
 *
 * Driven by the same "never a single number" principle throughout: each
 * skill gets its own detected HSK level, because recognizing and producing/
 * understanding are different skills.
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
// Level-gate mechanism - all 4 written skills (2026-08-19 redesign;
// unified across every skill 2026-08-27)
// ============================================================================

/** Fraction of a level's fixed question set that must be correct to advance - always rounded UP via levelPassThreshold, never down, so the bar never gets easier by rounding. */
export const LEVEL_PASS_RATIO = 0.8;

/**
 * How many questions each category at this level/skill asks, in one
 * single pass, no retries. 3 for Vocabulary HSK5+ specifically - that
 * band only has 2 categories (noun/verb, project/placement-exam-questions.md),
 * and 2 would leave `levelPassThreshold` needing 100% (Math.ceil(4*0.8)=4)
 * - zero margin for one bad/ambiguous question, right where content is
 * hardest. Grammar uses 2 at every level - it never had that 2-category
 * margin problem.
 *
 * Reading/Listening (folded into this mechanism 2026-08-27) each have a
 * single category ("comprehension") per level, so this is just the real
 * seeded bank size at that level - project/placement-exam-questions.md's
 * content: Reading HSK1 has 4, HSK2-4 have 6 (2 passages), HSK5-9 have 2
 * (1 shared passage); Listening HSK1-4 have 4, HSK5-9 have 2. At HSK5-9's
 * small counts the 80% threshold rounds up to "both correct" - deliberately
 * strict, consistent with levelPassThreshold's own "never easier by
 * rounding" rule, not a bug.
 */
export function questionsPerCategory(
  skill: PlacementSkillName,
  hskLevel: number,
): number {
  if (skill === "VOCABULARY" && hskLevel >= 5) return 3;
  if (skill === "READING") {
    if (hskLevel === 1) return 4;
    if (hskLevel <= 4) return 6;
    return 2;
  }
  if (skill === "LISTENING") return hskLevel <= 4 ? 4 : 2;
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
 * Highest level passed so far for a skill, walking up contiguously from 1 -
 * a gap can't be skipped (passing level 2's gate without level 1's ever
 * being attempted doesn't count). 0 means "no level passed yet" (Pre-HSK).
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
