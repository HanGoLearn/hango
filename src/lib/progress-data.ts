import { cache } from "react";
import { db } from "@/lib/db";
import {
  computeCompetencyProgress,
  type CompetencyProgress,
  type EvidenceInput,
} from "@/lib/competency-progress";
import {
  getScenariosWithProgress,
  getLessonVocabularyRows,
  getLessonGrammarPointRows,
} from "@/lib/content/learning-journey-data";
import { isEvidenceRelevantToCompetency } from "@/lib/progress-evidence";
import { hskLevelForPoints } from "@/lib/points-system";
import { getOrCreateLearnerProfile } from "@/lib/learner-profile";

export interface CompetencyProgressSummary extends CompetencyProgress {
  name: string;
  category: string;
}

/**
 * Every progressEvidence row for one learner, unfiltered - cached
 * per-request (React.cache) so getCompetencyProgress and any other
 * consumer needing the raw rows (e.g. sendAiTeacherMessage's "10 most
 * recent results" summary, ai-teacher-data.ts) share one fetch instead of
 * each querying the same table separately (project/db-operations-optimization.md,
 * Tier 2).
 */
export const getRawProgressEvidence = cache(async (userId: string) => {
  return db.progressEvidence.findMany({
    where: { userId },
    include: { competency: true },
  });
});

/**
 * Only competencies with at least one piece of evidence are returned -
 * naturally hides Professional/Academic Communication until content
 * touches them (13.3).
 *
 * Cached per-request (React.cache) - getScenarioMastery calls this
 * internally, and its own callers (Progress) also call it directly in
 * the same Promise.all, so without the cache it fired twice
 * (project/db-operations-optimization.md, Tier 1).
 */
export const getCompetencyProgress = cache(
  async (userId: string): Promise<CompetencyProgressSummary[]> => {
    const rows = await getRawProgressEvidence(userId);

    const byCompetency = new Map<
      string,
      { name: string; category: string; evidence: EvidenceInput[] }
    >();
    for (const row of rows) {
      if (!isEvidenceRelevantToCompetency(row.source, row.competency)) continue;
      const existing = byCompetency.get(row.competencyId);
      const evidenceInput: EvidenceInput = {
        result: row.result,
        difficulty: row.difficulty,
        source: row.source,
      };
      if (existing) {
        existing.evidence.push(evidenceInput);
      } else {
        byCompetency.set(row.competencyId, {
          name: row.competency.name,
          category: row.competency.category,
          evidence: [evidenceInput],
        });
      }
    }

    return Array.from(byCompetency.values()).map(
      ({ name, category, evidence }) => ({
        name,
        category,
        ...computeCompetencyProgress(evidence),
      }),
    );
  },
);

/**
 * Grammar/Vocabulary "progress" (13.3) - deliberately not Competency
 * evidence (see progress-evidence.ts's note). Just a count of distinct
 * items encountered across completed lessons - exposure, not mastery.
 *
 * Zero extra queries (2026-08-21) - derives its counts from the same
 * cached rows getReviewQueue already fetches (getLessonVocabularyRows/
 * getLessonGrammarPointRows, learning-journey-data.ts), both of which fire
 * in the same Promise.all on the Progress page. Previously ran its own
 * separate `distinct` queries against the identical `lessonId: { in:
 * lessonIds } }` filter - a real duplicate round trip, not just a stylistic
 * one, since the two queries selected different columns from the same rows.
 */
export async function getVocabularyGrammarExposure(userId: string) {
  const [vocabRows, grammarRows] = await Promise.all([
    getLessonVocabularyRows(userId),
    getLessonGrammarPointRows(userId),
  ]);

  return {
    vocabularyCount: new Set(vocabRows.map((r) => r.vocabularyItemId)).size,
    grammarCount: new Set(grammarRows.map((r) => r.grammarPointId)).size,
  };
}

const HSK_LABELS: Record<string, string> = {
  HSK_1_2: "HSK 1-2",
  HSK_3: "HSK 3",
  HSK_4: "HSK 4",
  HSK_5: "HSK 5",
  HSK_6: "HSK 6",
  HSK_7_9: "HSK 7-9",
  UNSURE: "Not yet assessed",
};

/** Self-reported at onboarding, not computed from evidence - no scoring formula for this exists in any doc. */
export async function getEstimatedLevel(userId: string): Promise<{
  hskLabel: string;
} | null> {
  const profile = await getOrCreateLearnerProfile(userId);
  if (!profile.currentLevel) return null;
  return { hskLabel: HSK_LABELS[profile.currentLevel] ?? profile.currentLevel };
}

export interface GeneralLevelSummary {
  /** 0-2000, earned - see docs/02_academy/points_system.md. Distinct from getEstimatedLevel's self-reported currentLevel. */
  points: number;
  hskLevel: string;
  /** Simple average of weightedReflectionAverage across every completed scenario - null with 0 completions. */
  learningJourneyAverage: number | null;
  scenariosCompleted: number;
}

/**
 * The Points & Leveling System's General Level (Progress tab) - earned
 * from ScenarioCompletion rows, not self-reported. `generalLevelPoints` on
 * LearnerProfile is a cached derived value (see scenario-completion.ts's
 * recomputeGeneralLevelPoints) so this is a cheap read, no aggregation
 * needed for the headline number - only for the secondary average below.
 */
export async function getGeneralLevelSummary(
  userId: string,
): Promise<GeneralLevelSummary> {
  const [profile, completions] = await Promise.all([
    getOrCreateLearnerProfile(userId),
    db.scenarioCompletion.findMany({
      where: { userId },
      select: { weightedReflectionAverage: true },
    }),
  ]);

  const points = profile.generalLevelPoints;
  const learningJourneyAverage =
    completions.length > 0
      ? Math.round(
          completions.reduce((sum, c) => sum + c.weightedReflectionAverage, 0) /
            completions.length,
        )
      : null;

  return {
    points,
    hskLevel: hskLevelForPoints(points),
    learningJourneyAverage,
    scenariosCompleted: completions.length,
  };
}

export interface ScenarioMasterySummary {
  name: string;
  slug: string;
  completionPercent: number;
  mastered: boolean;
}

/**
 * "Mastered" (5.2's deferred scenario status, closed here) requires 100%
 * lesson completion AND the learner's overall competency average being at
 * least CONFIDENT - a coarse, whole-profile heuristic rather than a true
 * per-scenario one, since ProgressEvidence doesn't record which lesson (or
 * scenario) produced each row, only which competency. Acceptable while
 * only one scenario has real content; revisit if that stops being true.
 */
export async function getScenarioMastery(
  userId: string,
): Promise<ScenarioMasterySummary[]> {
  const [scenarios, competencyProgress] = await Promise.all([
    getScenariosWithProgress(userId),
    getCompetencyProgress(userId),
  ]);

  const highStageCount = competencyProgress.filter(
    (c) => c.stage === "CONFIDENT" || c.stage === "MASTERY",
  ).length;
  const overallStrong =
    competencyProgress.length > 0 &&
    highStageCount / competencyProgress.length >= 0.5;

  return scenarios.map((scenario) => {
    const completionPercent =
      scenario.totalLessons === 0
        ? 0
        : Math.round((scenario.completedLessons / scenario.totalLessons) * 100);
    return {
      name: scenario.name,
      slug: scenario.slug,
      completionPercent,
      mastered: completionPercent === 100 && overallStrong,
    };
  });
}

export { getContinueLearningTarget } from "@/lib/content/learning-journey-data";
