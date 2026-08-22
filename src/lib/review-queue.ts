/**
 * Review Queue (13.5) - a lightweight, deterministic "what to review right
 * now" generator recomputed fresh on every page load, not a persistent
 * spaced-repetition schedule. "Reschedule"/"remove" (13.6) is achieved by
 * excluding anything reviewed in the last COOLDOWN_HOURS, not by a real
 * scheduler with per-item due dates - a documented simplification.
 */
export type ReviewItemType =
  "VOCABULARY" | "GRAMMAR" | "MISTAKE" | "DIALOGUE" | "AI_PRACTICE";

export interface ReviewItem {
  id: string;
  type: ReviewItemType;
  itemKey: string;
  title: string;
  reason: string;
  estimatedMinutes: number;
  actionLabel: string;
  actionHref?: string;
}

export const REVIEW_COOLDOWN_HOURS = 24;

export function isOnCooldown(
  lastReviewedAt: Date,
  now: Date = new Date(),
): boolean {
  const hoursSince =
    (now.getTime() - lastReviewedAt.getTime()) / (1000 * 60 * 60);
  return hoursSince < REVIEW_COOLDOWN_HOURS;
}
