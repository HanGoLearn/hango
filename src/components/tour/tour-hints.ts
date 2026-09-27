import type { AppMessages } from "@/i18n/messages/types";
import type { TourHintId } from "@/lib/tour-hint-ids";

type TourMessages = AppMessages["tour"];

export interface TourHint {
  /**
   * Shared with `TourStep.hintId`, so a section the second leg already
   * visited never gets explained twice.
   */
  id: TourHintId;
  /**
   * Matched against the locale-less path. `exact` distinguishes the journey
   * hub from a scenario page, which live under the same prefix and say very
   * different things.
   */
  path: string;
  exact?: boolean;
  /** Optional `data-tour-id` to point at; unanchored hints sit at the foot of the screen. */
  anchor?: string;
  body: (messages: TourMessages) => string;
}

/**
 * The standalone section hints (2026-09-23, stage 5) - the safety net for
 * whoever declined the second leg.
 *
 * Six of these nine are also covered by the second leg and are silenced for
 * anyone who took it; the other three (scenario, lesson, Speaking Lab)
 * belong to places the second leg never visits, so they always apply.
 *
 * Deliberately **not** a sequence: one card, one "got it", no progress
 * dots, and Han at a smaller size than in the tour proper. Ten interruptions
 * carrying the same weight as a guided walkthrough would stop reading as a
 * teacher and start reading as nagging.
 *
 * There is no hint for a lesson's speaking step. It would have to be placed
 * inside the speaking components, which are out of scope for this work, and
 * a badly-placed one there is worse than none.
 */
export const TOUR_HINTS: TourHint[] = [
  {
    id: "journey",
    path: "/learning-journey",
    exact: true,
    body: (messages) => messages.hints.journey,
  },
  {
    // Any scenario page, but not the hub above or a chapter listing.
    id: "scenario",
    path: "/learning-journey/",
    body: (messages) => messages.hints.scenario,
  },
  {
    id: "lesson",
    path: "/lesson/",
    anchor: "lesson-steps",
    body: (messages) => messages.hints.lesson,
  },
  {
    id: "han",
    path: "/han",
    body: (messages) => messages.hints.han,
  },
  {
    id: "writingLab",
    path: "/writing-lab",
    body: (messages) => messages.hints.writingLab,
  },
  {
    id: "speakingLab",
    path: "/speaking-lab",
    body: (messages) => messages.hints.speakingLab,
  },
  {
    id: "progress",
    path: "/progress",
    body: (messages) => messages.hints.progress,
  },
  {
    id: "shop",
    path: "/tienda",
    body: (messages) => messages.hints.shop,
  },
  {
    id: "settings",
    path: "/settings",
    body: (messages) => messages.hints.settings,
  },
];

/**
 * The hint that belongs to a path, or null. Longest match wins so a
 * scenario page resolves to the scenario hint rather than the hub's, and a
 * chapter listing (`/learning-journey/chapter/...`) is excluded outright -
 * it is a plain list that explains itself, and the scenario hint would be
 * wrong there.
 */
export function resolveHintForPath(path: string): TourHint | null {
  if (path.startsWith("/learning-journey/chapter")) return null;

  const matches = TOUR_HINTS.filter((hint) =>
    hint.exact ? path === hint.path : path.startsWith(hint.path),
  );
  if (matches.length === 0) return null;

  return matches.reduce((longest, hint) =>
    hint.path.length > longest.path.length ? hint : longest,
  );
}
