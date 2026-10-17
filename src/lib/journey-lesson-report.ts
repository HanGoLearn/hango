import { z } from "zod";
import { REFLECTION_WEIGHTS, starsForScore } from "@/lib/points-system";
import type { JourneyEvaluationReport } from "@/lib/journey-speaking-evaluation";

export const JOURNEY_LESSON_REPORT_VERSION = "journey-lesson-2026-10-11-v2";
// Explicit versioned provenance in the existing optional report JSON column.
export const JourneyReportProvenanceSchema = z
  .object({
    version: z.literal(JOURNEY_LESSON_REPORT_VERSION),
    attemptId: z.string().min(1).max(100),
    progressId: z.string().min(1).max(100),
    progressStartedAt: z.iso.datetime(),
  })
  .strict();
export const JourneySpeakingStepResponseSchema = z
  .object({
    journeySpeakingAttemptId: z.string().min(1).max(100),
  })
  .strict();

/** Invalid versioned metadata must not be misread as an old acoustic rubric. */
export function hasJourneyReportProvenance(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    ("version" in value || "attemptId" in value)
  );
}

const QuestionEvidenceSchema = z
  .object({
    key: z.string().min(1).max(200),
    attemptId: z.string().min(1).max(100).nullable(),
    result: z.boolean().nullable(),
  })
  .strict()
  .superRefine((entry, ctx) => {
    if (entry.attemptId === null && entry.result !== null)
      ctx.addIssue({
        code: "custom",
        message: "A result requires an actual attempt",
      });
  });
const QuestionListSchema = z
  .array(QuestionEvidenceSchema)
  .max(1_000)
  .superRefine((entries, ctx) => {
    if (new Set(entries.map((entry) => entry.key)).size !== entries.length)
      ctx.addIssue({
        code: "custom",
        message: "Duplicate assessment question",
      });
  });
export const JourneyAssessmentSnapshotSchema = z
  .object({
    version: z.literal(JOURNEY_LESSON_REPORT_VERSION),
    progressId: z.string().min(1).max(100),
    progressStartedAt: z.iso.datetime(),
    capturedAt: z.iso.datetime(),
    vocabulary: QuestionListSchema,
    grammar: QuestionListSchema,
    comprehension: QuestionListSchema,
  })
  .strict();
export type JourneyAssessmentSnapshot = z.infer<
  typeof JourneyAssessmentSnapshotSchema
>;
export type JourneyQuestionEvidence = z.infer<typeof QuestionEvidenceSchema>;
export type JourneyQuizSummary = {
  state: "COMPLETE" | "PARTIAL" | "MISSING" | "NO_OPPORTUNITY";
  score: number | null;
  total: number;
  correct: number;
  incorrect: number;
  pending: number;
  missing: number;
};

/** Entries must be server-selected and sorted by createdAt, then ID. First
 * submitted answer wins; an ungraded first answer is not a wrong answer. */
export function selectJourneyQuestionEvidence(
  expectedKeys: readonly string[],
  attempts: readonly { id: string; key: string; isCorrect: boolean | null }[],
): JourneyQuestionEvidence[] {
  const first = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts)
    if (!first.has(attempt.key)) first.set(attempt.key, attempt);
  return [...new Set(expectedKeys)].map((key) => ({
    key,
    attemptId: first.get(key)?.id ?? null,
    result: first.get(key)?.isCorrect ?? null,
  }));
}

export function summarizeJourneyQuiz(
  entries: readonly JourneyQuestionEvidence[],
): JourneyQuizSummary {
  const checked = QuestionListSchema.parse(entries);
  const total = checked.length;
  const correct = checked.filter((entry) => entry.result === true).length;
  const incorrect = checked.filter((entry) => entry.result === false).length;
  const pending = checked.filter(
    (entry) => entry.attemptId !== null && entry.result === null,
  ).length;
  const missing = checked.filter((entry) => entry.attemptId === null).length;
  const state =
    total === 0
      ? "NO_OPPORTUNITY"
      : correct + incorrect === total
        ? "COMPLETE"
        : missing === total
          ? "MISSING"
          : "PARTIAL";
  return {
    state,
    total,
    correct,
    incorrect,
    pending,
    missing,
    score: state === "COMPLETE" ? Math.round((correct / total) * 100) : null,
  };
}

export type JourneySpeakingReportState =
  | "MISSING"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETE"
  | "PARTIAL"
  | "INSUFFICIENT"
  | "FAILED";
export type JourneyLessonReportView = {
  version: typeof JOURNEY_LESSON_REPORT_VERSION;
  attemptId: string;
  locale: "es" | "en";
  categories: {
    vocabulary: JourneyQuizSummary;
    grammar: JourneyQuizSummary;
    comprehension: JourneyQuizSummary;
  };
  speaking: {
    reason?: "TECHNICAL_CAPTURE" | "NO_SPEECH" | "EVALUATION_FAILED";
    state: JourneySpeakingReportState;
    score: number | null;
    report: JourneyEvaluationReport | null;
  };
  overall: {
    state: "COMPLETE" | "PARTIAL" | "PENDING";
    score: number | null;
    stars: 1 | 2 | 3 | null;
  };
  /** Eligibility only. No claim that HanCoins/General Level were granted. */
  rewards: { eligible: boolean; settlement: "NOT_SETTLED" | "SETTLED" };
};

/** Pure aggregation; no missing-to-zero conversion and no reweighting. */
export function buildJourneyLessonReport(
  attemptId: string,
  locale: "es" | "en",
  assessment: JourneyAssessmentSnapshot,
  speakingState: JourneySpeakingReportState,
  speakingReport: JourneyEvaluationReport | null,
): JourneyLessonReportView {
  const snapshot = JourneyAssessmentSnapshotSchema.parse(assessment);
  if (
    speakingReport &&
    (speakingReport.locale !== locale ||
      speakingReport.status !== speakingState)
  )
    throw new Error("Speaking report does not match this lesson report");
  const categories = {
    vocabulary: summarizeJourneyQuiz(snapshot.vocabulary),
    grammar: summarizeJourneyQuiz(snapshot.grammar),
    comprehension: summarizeJourneyQuiz(snapshot.comprehension),
  };
  const validSpeaking =
    speakingState === "COMPLETE" &&
    speakingReport?.status === "COMPLETE" &&
    typeof speakingReport.score === "number" &&
    Number.isInteger(speakingReport.score) &&
    speakingReport.score >= 0 &&
    speakingReport.score <= 100;
  const complete =
    validSpeaking &&
    Object.values(categories).every((item) => item.state === "COMPLETE");
  const score = complete
    ? Math.round(
        (categories.vocabulary.score! * REFLECTION_WEIGHTS.VOCABULARY) / 100 +
          (categories.grammar.score! * REFLECTION_WEIGHTS.GRAMMAR) / 100 +
          (categories.comprehension.score! * REFLECTION_WEIGHTS.COMPREHENSION) /
            100 +
          (speakingReport!.score! * REFLECTION_WEIGHTS.SPEAKING) / 100,
      )
    : null;
  return {
    version: JOURNEY_LESSON_REPORT_VERSION,
    attemptId,
    locale,
    categories,
    speaking: {
      state: speakingState,
      score: validSpeaking ? speakingReport!.score : null,
      report: speakingReport,
    },
    overall: {
      state: complete
        ? "COMPLETE"
        : ["PENDING", "PROCESSING"].includes(speakingState)
          ? "PENDING"
          : "PARTIAL",
      score,
      stars: score === null ? null : starsForScore(score),
    },
    rewards: { eligible: complete, settlement: "NOT_SETTLED" },
  };
}
