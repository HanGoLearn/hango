import "server-only";

import { serverEnv } from "@/lib/env/server";
import {
  JOURNEY_CHAPTER_ORDER,
  type JourneyChapter,
} from "@/lib/content/learning-journey";
import type { UserRole } from "@/lib/auth-role";

export type BetaLearningScope = "FOUNDATIONS_ONLY" | "FULL";

export interface BetaSpeakingStationDefinition {
  id: "INTRODUCTIONS" | "NUMBERS_TIME" | "PRICES";
  lessonSlug: string;
}

export const BETA_SPEAKING_STATIONS: readonly BetaSpeakingStationDefinition[] =
  [
    {
      id: "INTRODUCTIONS",
      lessonSlug: "foundations-greetings-and-introductions",
    },
    {
      id: "NUMBERS_TIME",
      lessonSlug: "foundations-numbers-time-and-dates",
    },
    {
      id: "PRICES",
      lessonSlug: "basic-shopping-asking-the-price",
    },
  ];

export function resolveBetaLearningScope(
  value: string | undefined,
): BetaLearningScope {
  return value === "FULL" ? "FULL" : "FOUNDATIONS_ONLY";
}

export function getBetaLearningScope(): BetaLearningScope {
  return resolveBetaLearningScope(serverEnv.HANGO_BETA_LEARNING_SCOPE);
}

export function getMaximumJourneyChapter(
  role: string | undefined,
  scope: BetaLearningScope = getBetaLearningScope(),
): JourneyChapter {
  if (role === "ADMINISTRATOR" || scope === "FULL") return "ADVANCED";
  return "BEGINNER";
}

export function isJourneyChapterAccessible(
  chapter: JourneyChapter,
  role: string | undefined,
  scope: BetaLearningScope = getBetaLearningScope(),
): boolean {
  const maximum = getMaximumJourneyChapter(role, scope);
  return (
    JOURNEY_CHAPTER_ORDER.indexOf(chapter) <=
    JOURNEY_CHAPTER_ORDER.indexOf(maximum)
  );
}

export function hasFullBetaLearningAccess(
  role: string | undefined,
  scope: BetaLearningScope = getBetaLearningScope(),
): boolean {
  return getMaximumJourneyChapter(role, scope) === "ADVANCED";
}

export function isPlacementExamAvailable(
  role: UserRole | string | undefined,
  scope: BetaLearningScope = getBetaLearningScope(),
): boolean {
  return hasFullBetaLearningAccess(role, scope);
}
