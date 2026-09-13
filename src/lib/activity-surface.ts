export const LEARNER_ACTIVITY_SURFACES = [
  "GENERAL",
  "LEARNING_JOURNEY",
  "HAN_TUTOR",
  "HAN_COMPANION",
  "SPEAKING_LAB",
  "WRITING_LAB",
  "MISSIONS",
  "HAN_VOCABULARY",
  "PLACEMENT",
] as const;

export type LearnerActivitySurface = (typeof LEARNER_ACTIVITY_SURFACES)[number];

const SURFACE_SET = new Set<string>(LEARNER_ACTIVITY_SURFACES);

export function isLearnerActivitySurface(
  value: unknown,
): value is LearnerActivitySurface {
  return typeof value === "string" && SURFACE_SET.has(value);
}

/**
 * Route-owned experiences stay separate. In-page systems such as Han Tutor,
 * Missions and HanVocabulary override this through data-activity-surface.
 */
export function resolveActivitySurface(
  pathname: string,
): LearnerActivitySurface {
  const routePath = pathWithoutLocale(pathname);
  // /han is a hub containing Tutor, Companion and HanVocabulary. Its
  // view-specific containers provide explicit data-activity-surface markers.
  if (routePath === "/han" || routePath.startsWith("/han/")) return "GENERAL";
  if (routePath === "/speaking-lab" || routePath.startsWith("/speaking-lab/")) {
    return "SPEAKING_LAB";
  }
  if (routePath === "/writing-lab" || routePath.startsWith("/writing-lab/")) {
    return "WRITING_LAB";
  }
  if (
    routePath === "/placement-exam" ||
    routePath.startsWith("/placement-exam/") ||
    routePath === "/speaking-test" ||
    routePath.startsWith("/speaking-test/")
  ) {
    return "PLACEMENT";
  }
  if (
    routePath === "/learning-journey" ||
    routePath.startsWith("/learning-journey/") ||
    routePath === "/lesson" ||
    routePath.startsWith("/lesson/") ||
    routePath === "/welcome-to-chinese" ||
    routePath.startsWith("/welcome-to-chinese/")
  ) {
    return "LEARNING_JOURNEY";
  }
  return "GENERAL";
}
import { pathWithoutLocale } from "@/i18n/config";
