/**
 * The only section identifiers the client may persist for the guided tour.
 * Both the UI and the server mutation import this allowlist.
 */
export const TOUR_HINT_IDS = [
  "journey",
  "scenario",
  "lesson",
  "han",
  "writingLab",
  "speakingLab",
  "progress",
  "shop",
  "settings",
] as const;

export type TourHintId = (typeof TOUR_HINT_IDS)[number];
