/**
 * Competency stage computation (13.2) - pure and deterministic so stage
 * transitions are predictable (a listed rule) and testable without a
 * database. Reuses the `CompetencyStage` enum's real names from FASE 4
 * (EXPOSURE/PRACTICE/FUNCTIONAL/CONFIDENT/MASTERY, from
 * competency_framework.md) rather than TASKS.md 13.2's own wording
 * (Introduced/Practicing/Developing/Confident/Mastered) - same concept,
 * the schema enum already existed and takes precedence over re-inventing
 * a second one.
 */
export type CompetencyStageValue =
  "EXPOSURE" | "PRACTICE" | "FUNCTIONAL" | "CONFIDENT" | "MASTERY";

export interface EvidenceInput {
  /** 0-1 normalized success/score. */
  result: number;
  /** 1-5 normalized difficulty weight. */
  difficulty: number;
  source: string;
}

export interface CompetencyProgress {
  stage: CompetencyStageValue;
  evidenceCount: number;
  /** 0-1, difficulty-weighted average result. */
  weightedScore: number;
  distinctSources: number;
}

/**
 * Rules encoded here (13.2):
 * - "One activity cannot create mastery" - MASTERY needs 8+ evidence rows.
 * - "Multiple evidence sources are required" - CONFIDENT/MASTERY require
 *   evidence from 2+/3+ distinct activity types, not just one repeated.
 * - "Difficulty affects evidence" - the score is a difficulty-weighted
 *   average, not a flat average; a hard win counts for more than an easy one.
 * - "Repeated mistakes affect progress" - low results pull the weighted
 *   average down, which blocks every threshold above PRACTICE.
 * - "Stage transitions are predictable" - pure function, same input always
 *   produces the same stage.
 */
export function computeCompetencyProgress(
  evidence: EvidenceInput[],
): CompetencyProgress {
  if (evidence.length === 0) {
    return {
      stage: "EXPOSURE",
      evidenceCount: 0,
      weightedScore: 0,
      distinctSources: 0,
    };
  }

  const totalWeight = evidence.reduce((sum, e) => sum + e.difficulty, 0);
  const weightedScore =
    evidence.reduce((sum, e) => sum + e.result * e.difficulty, 0) / totalWeight;
  const distinctSources = new Set(evidence.map((e) => e.source)).size;
  const evidenceCount = evidence.length;

  let stage: CompetencyStageValue = "PRACTICE";
  if (evidenceCount >= 3 && weightedScore >= 0.5) stage = "FUNCTIONAL";
  if (evidenceCount >= 5 && distinctSources >= 2 && weightedScore >= 0.7) {
    stage = "CONFIDENT";
  }
  if (evidenceCount >= 8 && distinctSources >= 3 && weightedScore >= 0.85) {
    stage = "MASTERY";
  }

  return { stage, evidenceCount, weightedScore, distinctSources };
}

const EXERCISE_DIFFICULTY_WEIGHT: Record<string, number> = {
  BEGINNER: 2,
  INTERMEDIATE: 3,
  ADVANCED: 5,
};

const QUIZ_DIFFICULTY_WEIGHT: Record<string, number> = {
  EASY: 2,
  MEDIUM: 3,
  HARD: 4,
  ADAPTIVE: 3,
};

const MISSION_DIFFICULTY_WEIGHT: Record<string, number> = {
  GUIDED: 2,
  SUPPORTED: 3,
  INDEPENDENT: 4,
  ADAPTIVE: 3,
  EXPERT: 5,
};

/** Normalizes each source's own difficulty vocabulary to the shared 1-5 scale ProgressEvidence stores. Speaking/Writing have no difficulty field, so they default to the midpoint. */
export function normalizeDifficulty(
  source: "EXERCISE" | "QUIZ" | "SPEAKING" | "WRITING" | "MISSION",
  label: string | null | undefined,
): number {
  if (!label) return 3;
  switch (source) {
    case "EXERCISE":
      return EXERCISE_DIFFICULTY_WEIGHT[label] ?? 3;
    case "QUIZ":
      return QUIZ_DIFFICULTY_WEIGHT[label] ?? 3;
    case "MISSION":
      return MISSION_DIFFICULTY_WEIGHT[label] ?? 3;
    default:
      return 3;
  }
}
