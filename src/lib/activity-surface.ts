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
  // /han is a hub containing Tutor, Companion and HanVocabulary. Its
  // view-specific containers provide explicit data-activity-surface markers.
  if (pathname === "/han" || pathname.startsWith("/han/")) return "GENERAL";
  if (pathname === "/speaking-lab" || pathname.startsWith("/speaking-lab/")) {
    return "SPEAKING_LAB";
  }
  if (pathname === "/writing-lab" || pathname.startsWith("/writing-lab/")) {
    return "WRITING_LAB";
  }
  if (
    pathname === "/placement-exam" ||
    pathname.startsWith("/placement-exam/") ||
    pathname === "/speaking-test" ||
    pathname.startsWith("/speaking-test/")
  ) {
    return "PLACEMENT";
  }
  if (
    pathname === "/learning-journey" ||
    pathname.startsWith("/learning-journey/") ||
    pathname === "/lesson" ||
    pathname.startsWith("/lesson/") ||
    pathname === "/welcome-to-chinese" ||
    pathname.startsWith("/welcome-to-chinese/")
  ) {
    return "LEARNING_JOURNEY";
  }
  return "GENERAL";
}
