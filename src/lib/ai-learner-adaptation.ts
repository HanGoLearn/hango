export interface DemonstratedCompetency {
  name: string;
  weightedScore: number;
  evidenceCount: number;
}

export interface AdaptiveLearnerSummary {
  demonstratedBand: string;
  recentAccuracy: number | null;
  strengths: string[];
  focusAreas: string[];
}

/**
 * Converts durable, graded performance into compact prompt context. This is
 * intentionally separate from self-reported HSK: practice evidence adapts Han
 * without presenting an in-app estimate as an official language certificate.
 */
export function buildAdaptiveLearnerSummary(
  competencies: DemonstratedCompetency[],
  recentResults: number[],
): AdaptiveLearnerSummary {
  const totalEvidence = competencies.reduce(
    (sum, item) => sum + item.evidenceCount,
    0,
  );
  const overallScore =
    totalEvidence === 0
      ? null
      : competencies.reduce(
          (sum, item) => sum + item.weightedScore * item.evidenceCount,
          0,
        ) / totalEvidence;

  const demonstratedBand =
    overallScore == null
      ? "Not yet established"
      : overallScore < 0.5
        ? "Foundational — needs frequent scaffolding"
        : overallScore < 0.7
          ? "Developing — can handle guided variation"
          : overallScore < 0.85
            ? "Independent — ready for less translation and more Chinese"
            : "Strong — ready for nuanced, mostly Chinese interaction";

  const byScoreDescending = [...competencies].sort(
    (a, b) => b.weightedScore - a.weightedScore,
  );
  const strengths = byScoreDescending
    .filter((item) => item.evidenceCount >= 3 && item.weightedScore >= 0.75)
    .slice(0, 3)
    .map((item) => item.name);
  const focusAreas = [...byScoreDescending]
    .reverse()
    .filter((item) => item.weightedScore < 0.7)
    .slice(0, 3)
    .map((item) => item.name);

  return {
    demonstratedBand,
    recentAccuracy:
      recentResults.length === 0
        ? null
        : recentResults.reduce((sum, result) => sum + result, 0) /
          recentResults.length,
    strengths,
    focusAreas,
  };
}
