import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Creates the profile on first access — every learner has exactly one.
 * Wrapped in React's `cache()` so every caller within the same request
 * (layout, AppShell, Dashboard, Progress - each independently needing
 * this same row) shares one fetch instead of each re-querying by userId
 * (project/db-operations-optimization.md, Tier 1's biggest single win).
 * Request-scoped only, so it never sees stale data across requests - see
 * `db.learnerProfile.update` call sites (settings.ts, onboarding.ts,
 * general-level.ts), none of which read this cached getter afterward
 * within the same request.
 */
export const getOrCreateLearnerProfile = cache(async (userId: string) => {
  const existing = await db.learnerProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.learnerProfile.create({ data: { userId } });
});

export type OnboardingStep =
  | "welcome"
  | "goal"
  | "level"
  | "explanation-language"
  | "skills"
  | "daily-target"
  | "placement-offer"
  | "recommendation";

const STEP_ORDER: OnboardingStep[] = [
  "welcome",
  "goal",
  "level",
  "explanation-language",
  "skills",
  "daily-target",
  "placement-offer",
  "recommendation",
];

/**
 * Restores interrupted onboarding (3.3) by deriving the resume point from
 * which fields are already filled in, rather than tracking a separate
 * "current step" column that could drift out of sync with the real data.
 *
 * Welcome has no persisted field of its own, so an untouched profile is
 * indistinguishable from "interrupted right before answering the first
 * question" — both must resume at "welcome" (never skip straight to "goal"),
 * since a first-time learner landing on a question with no introduction at
 * all would be a real regression, not just a harmless repeat.
 *
 * AI Preferences was removed as an onboarding step (2026-08-24) -
 * `correctionStyle` is still independently editable in Settings
 * (learning-preferences-section.tsx), it's just no longer asked here.
 * `placementExamOfferAcknowledgedAt` is the "como unica vez" marker for the
 * placement-exam offer that replaced it in the step order - set the moment
 * the learner skips the offer or starts the exam, so it's never re-shown.
 */
export function resolveResumeStep(profile: {
  learningGoals: string[];
  currentLevel: string | null;
  explanationLanguage: string | null;
  skillPriorities: string[];
  dailyStudyTargetMinutes: number | null;
  placementExamOfferAcknowledgedAt: Date | null;
}): OnboardingStep {
  if (profile.learningGoals.length === 0) return "welcome";
  if (!profile.currentLevel) return "level";
  if (!profile.explanationLanguage) return "explanation-language";
  if (profile.skillPriorities.length === 0) return "skills";
  if (profile.dailyStudyTargetMinutes === null) return "daily-target";
  if (!profile.placementExamOfferAcknowledgedAt) return "placement-offer";
  return "recommendation";
}

export { STEP_ORDER };
