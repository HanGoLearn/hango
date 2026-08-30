/**
 * Points & Leveling System (docs/02_academy/points_system.md) - pure,
 * testable formulas, same split as competency-progress.ts: this file only
 * computes; the actual DB reads/writes live in reflection.ts and (later)
 * the Phase D scenario-completion flow.
 */

/**
 * How many quiz questions the Vocabulary Step generates per word, driven by
 * the lesson's ScenarioDifficulty (points_system.md Part 1). 3 base
 * questions (meaning/chineseForm/sentence-order) always show; fill-blank
 * count scales with difficulty. The pinyin-recognition question was swapped
 * for sentence-order (2026-08-16, user feedback) as a like-for-like count
 * replacement, so these totals are unchanged. Mirrors vocabulary-step.tsx's
 * fillBlankIndices logic for a lesson with 3+ examples (true for every
 * published lesson today - Foundations authors exactly 3, every other
 * domain exactly 6) - keep both in sync if that content standard ever
 * changes.
 */
export function vocabularyQuestionsPerWord(difficulty: string): number {
  switch (difficulty) {
    case "BEGINNER":
      return 4; // 3 base + 1 fill-blank
    case "ADVANCED":
      return 6; // 3 base + 3 fill-blank
    default:
      return 5; // INTERMEDIATE / UPPER_INTERMEDIATE: 3 base + 2 fill-blank
  }
}

/**
 * Session score weights (points_system.md Part 1) - Situation is
 * deliberately absent, it's presentational and not scored.
 */
export const REFLECTION_WEIGHTS = {
  VOCABULARY: 20,
  GRAMMAR: 20,
  COMPREHENSION: 30,
  SPEAKING: 30,
} as const;

export const REFLECTION_PASS_SCORE = 70;

/**
 * Presentation-only 1-3 star band over a lesson's real Reflection
 * `totalScore` (2026-08-29, Learning Path Milestone 3's "inline stars") -
 * no new data, just a friendlier read of the same number the numeric score
 * chip already showed. Tied to REFLECTION_PASS_SCORE so "2 stars" always
 * means "passed": below it is 1 star (completed but didn't pass), up to a
 * near-perfect band is 2, 90+ is 3.
 */
export function starsForScore(score: number): 1 | 2 | 3 {
  if (score >= 90) return 3;
  if (score >= REFLECTION_PASS_SCORE) return 2;
  return 1;
}

/**
 * Combines the four 0-100 sub-scores into the weighted 0-100 session total.
 * A sub-score of null contributes 0, not "excluded from the average" - an
 * ungraded dimension (e.g. no grammar exercises in this lesson) should not
 * quietly inflate the other three; the design doc's total is a completeness
 * score, not a partial average.
 */
export function computeReflectionTotal(scores: {
  vocabularyScore: number | null;
  grammarScore: number | null;
  comprehensionScore: number | null;
  speakingScore: number | null;
}): number {
  const points =
    ((scores.vocabularyScore ?? 0) / 100) * REFLECTION_WEIGHTS.VOCABULARY +
    ((scores.grammarScore ?? 0) / 100) * REFLECTION_WEIGHTS.GRAMMAR +
    ((scores.comprehensionScore ?? 0) / 100) * REFLECTION_WEIGHTS.COMPREHENSION +
    ((scores.speakingScore ?? 0) / 100) * REFLECTION_WEIGHTS.SPEAKING;
  return Math.round(points);
}

/**
 * The Speaking (30 pts) formula is multiplicative, not an average
 * (points_system.md Part 1): a weak vocabulary-usage or objective-
 * completion ratio caps the score, it can't be averaged away by strong
 * conversational metrics elsewhere.
 */
export function computeSpeakingConversationScore(feedback: {
  pronunciation: number;
  fluency: number;
  accuracy: number;
  complexity: number;
  communicationEffectiveness: number;
  vocabularyUsageRatio: number;
  objectiveCompletionRatio: number;
}): number {
  const baseAverage =
    (feedback.pronunciation +
      feedback.fluency +
      feedback.accuracy +
      feedback.complexity +
      feedback.communicationEffectiveness) /
    5;
  const gated =
    baseAverage *
    feedback.vocabularyUsageRatio *
    feedback.objectiveCompletionRatio;
  return Math.round(gated);
}

/**
 * General Level (0-2000) budgets per Learning Journey chapter
 * (points_system.md Part 2) - keyed by the same JourneyChapter type
 * learning-journey.ts's resolveJourneyChapter() already produces, so a
 * scenario's chapter (and therefore its point budget) is always resolved
 * the identical way the Learning Journey screen groups it. Reading Lab's
 * eventual 150 points are NOT part of these 3 chapter budgets - they're a
 * separate Lab budget (Part 3), added on top once built.
 */
export const CHAPTER_BUDGET: Record<"BEGINNER" | "INTERMEDIATE" | "ADVANCED", number> = {
  BEGINNER: 350,
  INTERMEDIATE: 550,
  ADVANCED: 600,
};

/**
 * A lesson with no hskReference falls back to 3 (the curriculum's de facto
 * median) rather than 0, so a single unset value can't zero out an entire
 * scenario's or chapter's weighting.
 */
export function effectiveHskWeight(hskReference: number | null): number {
  return hskReference ?? 3;
}

/**
 * How many of a chapter's General Level points one scenario is worth,
 * proportional to its share of the chapter's total HSK-reference weight
 * (points_system.md Part 2's formula) - harder/larger scenarios are
 * automatically worth more, no per-scenario judgment call needed.
 */
export function computeScenarioPointsBudget(
  scenarioHskSum: number,
  chapterHskSum: number,
  chapterBudget: number,
): number {
  if (chapterHskSum === 0) return 0;
  return (scenarioHskSum / chapterHskSum) * chapterBudget;
}

/**
 * How much of a scenario's own point budget a specific lesson is worth -
 * same proportional-to-HSK-weight logic, one level down. Used to generate
 * the lesson-level breakdown table on demand rather than hand-listing
 * ~224 rows (points_system.md Part 2).
 */
export function computeLessonPointsWithinScenario(
  lessonHsk: number | null,
  scenarioHskSum: number,
  scenarioPointsBudget: number,
): number {
  if (scenarioHskSum === 0) return 0;
  return (effectiveHskWeight(lessonHsk) / scenarioHskSum) * scenarioPointsBudget;
}

/**
 * A scenario's weighted Reflection average (points_system.md Part 2) -
 * each completed lesson's totalScore contributes proportional to that
 * lesson's own HSK weight, mirroring exactly how points are allocated in
 * the first place. An unattempted lesson (totalScore null) contributes 0,
 * not "excluded" - a scenario isn't done until every lesson is.
 */
export function computeWeightedReflectionAverage(
  lessons: { hskReference: number | null; totalScore: number | null }[],
): number {
  const totalWeight = lessons.reduce(
    (sum, l) => sum + effectiveHskWeight(l.hskReference),
    0,
  );
  if (totalWeight === 0) return 0;
  const weightedSum = lessons.reduce(
    (sum, l) => sum + (l.totalScore ?? 0) * effectiveHskWeight(l.hskReference),
    0,
  );
  return Math.round(weightedSum / totalWeight);
}

/**
 * What a scenario contributes to the learner's General Level
 * (points_system.md Part 2): its point budget scaled by how well it was
 * actually completed. A perfect scenario earns its full budget; a 78.5%
 * weighted average earns 78.5% of it.
 */
export function computeScenarioEarnedPoints(
  scenarioPointsBudget: number,
  weightedReflectionAverage: number,
): number {
  return (scenarioPointsBudget * weightedReflectionAverage) / 100;
}

/**
 * General Level (0-2000) → display tier name (points_system.md Part 2's
 * table, reconciled 2026-08-24: no longer claims a literal official-HSK
 * equivalence - see "Relationship to Existing Docs" at the bottom of that
 * file for why). Thresholds are the point at which each tier is *reached*;
 * a score is labeled by the highest threshold it has crossed. `level` is
 * the same 0-9 internal difficulty number the curriculum's hskReference
 * field already uses - unchanged, and load-bearing: han-realtime.ts's
 * character-limit/pace/vocabulary-scaling logic and
 * speech/realtime-turn-guard.ts's turn-timeout logic both derive their
 * "HSK N" technical string from hskNumberForPoints() (below), never from
 * this table's `label`. Only `label` is safe to reword freely - `minPoints`
 * and `level` must stay exactly as-is, or Han's real-time Speaking pacing
 * shifts at different point totals than it used to.
 */
const HSK_POINT_THRESHOLDS: { minPoints: number; level: number; label: string }[] = [
  { minPoints: 2000, level: 9, label: "Mastering the Language" },
  { minPoints: 1800, level: 8, label: "Refined Fluency" },
  { minPoints: 1650, level: 7, label: "Nearing Mastery" },
  { minPoints: 1500, level: 6, label: "Speaking Like a Professional" },
  { minPoints: 1150, level: 5, label: "Handling Real Situations" },
  { minPoints: 900, level: 4, label: "Easily Understood" },
  { minPoints: 700, level: 3, label: "Speaking with Ease" },
  { minPoints: 350, level: 2, label: "Finding Your Footing" },
  { minPoints: 100, level: 1, label: "Getting By" },
  { minPoints: 0, level: 0, label: "Just Starting Out" },
];

/**
 * The friendly tier name shown to the learner (Dashboard, Progress) and to
 * Han himself (ai-context.ts's resolveEffectiveLevel - Han is meant to see
 * this exact wording). Never feed this into anything that parses an "HSK N"
 * pattern back out of it - use hskNumberForPoints() for that instead.
 */
export function hskLevelForPoints(points: number): string {
  const match = HSK_POINT_THRESHOLDS.find((tier) => points >= tier.minPoints);
  return match?.label ?? "Just Starting Out";
}

/**
 * Same 10 tier names as hskLevelForPoints(), keyed directly by the 0-9
 * internal level instead of a points total (2026-08-24) - for callers that
 * already have a raw skill level, not a General Level score. The placement
 * exam's per-skill results (placement-exam-home.tsx) are the first caller:
 * each of Vocabulary/Grammar/Reading/Listening/Speaking lands on its own
 * 0-9 level, independent of General Level points, but should still use the
 * exact same vocabulary the rest of the app does - "Easily Understood"
 * means the same thing whether it's describing earned points or a
 * placement result.
 */
export function tierNameForLevel(level: number): string {
  const match = HSK_POINT_THRESHOLDS.find((tier) => tier.level === level);
  return match?.label ?? "Just Starting Out";
}

/**
 * Same table as hskLevelForPoints(), but the bare number (0 for none yet)
 * instead of a display label - for callers that feed it into a numeric
 * scale like describeSpeakingDifficulty(), or that need to reconstruct a
 * literal "HSK N" string for han-realtime.ts's/realtime-turn-guard.ts's
 * regex-based pacing logic, rather than showing anything to the learner
 * directly.
 */
export function hskNumberForPoints(points: number): number {
  const match = HSK_POINT_THRESHOLDS.find((tier) => points >= tier.minPoints);
  return match?.level ?? 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Lab point budgets (points_system.md Part 3, decided 2026-08-15). Reading
 * Lab's 150 is reserved but not counted until that Lab exists - the true
 * reachable max today is 1850/2000, not 2000. Listening deliberately gets
 * no slice here - it stays covered by the existing LISTENING competency
 * (see the doc's "Future skills" section).
 */
export const LAB_SKILL_BUDGET = {
  SPEAKING: 200,
  WRITING: 150,
  READING: 150, // reserved, not yet earnable
} as const;

/** True max reachable today, before Reading Lab exists. */
export const CURRENT_MAX_GENERAL_LEVEL_POINTS = 2000 - LAB_SKILL_BUDGET.READING;

/**
 * One piece of Lab evidence - a distinct graded Writing task or Speaking
 * session (points_system.md Part 3's "distinct attempts, not raw
 * repetition"). `distinctKey` is the WritingTask id or SpeakingSession id;
 * resubmitting/re-recording the *same* one should not create a second
 * point here.
 */
export interface LabEvidencePoint {
  distinctKey: string;
  score: number;
  occurredAt: Date;
}

/** Keeps only the most recent point per distinctKey - a rewrite/re-recording updates the point rather than adding a new one. */
export function dedupeLabEvidence(
  points: LabEvidencePoint[],
): LabEvidencePoint[] {
  const byKey = new Map<string, LabEvidencePoint>();
  for (const point of points) {
    const existing = byKey.get(point.distinctKey);
    if (!existing || point.occurredAt > existing.occurredAt) {
      byKey.set(point.distinctKey, point);
    }
  }
  return [...byKey.values()];
}

/** ISO-ish year-week bucket, e.g. "2026-W33" - used to count distinct calendar weeks of practice. */
export function weekKey(date: Date): string {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayNumber = (target.getUTCDay() + 6) % 7; // Monday = 0
  target.setUTCDate(target.getUTCDate() - dayNumber + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Score quality factor - nothing below a 70% average counts at all (points_system.md Part 3). */
export function computeLabFactorDominio(scores: number[]): number {
  if (scores.length === 0) return 0;
  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return clamp((average - 70) / 30, 0, 1);
}

/** Distinct-evidence volume factor - needs 20 distinct attempts to start, full weight at 60+. */
export function computeLabFactorVolumen(distinctAttemptCount: number): number {
  return clamp((distinctAttemptCount - 20) / 40, 0, 1);
}

/** Practice spread over real calendar time - needs 2 distinct weeks to start, full weight at 12 (~3 months). The key anti-farming lever: the same volume compressed into one week scores far lower than spread across a season. */
export function computeLabFactorTiempo(distinctWeekCount: number): number {
  return clamp((distinctWeekCount - 2) / 10, 0, 1);
}

/** Reliability, not just a lucky spike - lower variance in recent scores scores higher. */
export function computeLabFactorConsistencia(scores: number[]): number {
  if (scores.length === 0) return 0;
  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance =
    scores.reduce((sum, s) => sum + (s - average) ** 2, 0) / scores.length;
  return clamp(1 - Math.sqrt(variance) / 100, 0, 1);
}

/**
 * A Lab skill's earned points (points_system.md Part 3) - the four factors
 * multiply, so any one of them at 0 zeroes the whole result. `evidence`
 * must already be deduped (dedupeLabEvidence) before calling this.
 */
export function computeLabSkillPoints(
  skillBudget: number,
  evidence: LabEvidencePoint[],
): number {
  const scores = evidence.map((e) => e.score);
  const distinctWeeks = new Set(evidence.map((e) => weekKey(e.occurredAt))).size;
  const factorDominio = computeLabFactorDominio(scores);
  const factorVolumen = computeLabFactorVolumen(evidence.length);
  const factorTiempo = computeLabFactorTiempo(distinctWeeks);
  const factorConsistencia = computeLabFactorConsistencia(scores);
  return (
    skillBudget * factorDominio * factorVolumen * factorTiempo * factorConsistencia
  );
}
