import { db } from "@/lib/db";
import { TOUR_HINT_IDS } from "@/lib/tour-hint-ids";

const TOUR_HINT_ID_SET = new Set<string>(TOUR_HINT_IDS);

/**
 * Server-side boundary for a client-controlled value. Unknown, duplicated
 * and non-string entries are discarded before anything reaches Prisma.
 */
export function sanitizeTourHintIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (hintId): hintId is string =>
          typeof hintId === "string" && TOUR_HINT_ID_SET.has(hintId),
      ),
    ),
  ];
}

/**
 * Whether a learner should be shown the guided tour, and why (2026-09-23,
 * stage 3). Kept apart from the server actions so the decision itself can
 * be reasoned about and tested without a request.
 */
export type TourAudience =
  /** Finished onboarding, never saw the tour, hasn't studied yet. */
  | "NEW"
  /** Was already using HanGo before the tour existed. */
  | "EXISTING"
  /** Started the tour and left it. */
  | "SKIPPED"
  /** Reached the end of the first leg. */
  | "COMPLETED";

export interface TourState {
  audience: TourAudience;
  /** True only for NEW: the one case the tour opens by itself. */
  autoStart: boolean;
  /** Sections already explained, by the second leg or by a hint. */
  seenHints: string[];
}

export interface TourProfileFacts {
  onboardingCompletedAt: Date | null;
  tourCompletedAt: Date | null;
  tourSkippedAt: Date | null;
  seenTourHints: string[];
  /** Any finished lesson at all - the signal that someone predates the tour. */
  hasStudied: boolean;
}

/**
 * Pure decision, so the awkward case is easy to see and easy to test: a
 * learner who has already completed lessons must never be ambushed by an
 * introduction to an app they clearly know. They are offered it instead,
 * from a dismissible prompt, which is what `EXISTING` drives.
 */
export function resolveTourState(facts: TourProfileFacts): TourState {
  const seenHints = facts.seenTourHints;

  if (facts.tourCompletedAt) {
    return { audience: "COMPLETED", autoStart: false, seenHints };
  }
  if (facts.tourSkippedAt) {
    return { audience: "SKIPPED", autoStart: false, seenHints };
  }
  if (!facts.onboardingCompletedAt || facts.hasStudied) {
    return { audience: "EXISTING", autoStart: false, seenHints };
  }
  return { audience: "NEW", autoStart: true, seenHints };
}

/**
 * Resolved from a profile the caller already has, because the app shell
 * loads one on every authenticated page and a second read of the same row
 * would be pure waste.
 *
 * The one query this can still cost - "has this learner ever finished a
 * lesson?" - is deliberately last and conditional. Every other branch
 * answers without it, so it only runs for an account that finished
 * onboarding and has not yet resolved the tour either way: a window one
 * visit wide for most people, and never again afterwards.
 */
export async function resolveTourStateForUser(
  userId: string,
  profile: Omit<TourProfileFacts, "hasStudied"> | null,
): Promise<TourState> {
  // No profile means onboarding hasn't finished, so the tour has nothing to
  // introduce yet. EXISTING rather than NEW, so it never auto-opens over a
  // half-finished account.
  if (!profile) {
    return { audience: "EXISTING", autoStart: false, seenHints: [] };
  }

  const seenHints = profile.seenTourHints;
  if (profile.tourCompletedAt) {
    return { audience: "COMPLETED", autoStart: false, seenHints };
  }
  if (profile.tourSkippedAt) {
    return { audience: "SKIPPED", autoStart: false, seenHints };
  }
  if (!profile.onboardingCompletedAt) {
    return { audience: "EXISTING", autoStart: false, seenHints };
  }

  const studied = await db.learnerLessonCompletion.findFirst({
    where: { userId },
    select: { lessonId: true },
  });

  return resolveTourState({ ...profile, hasStudied: studied !== null });
}

/**
 * `updateMany`, not `update`: this runs from a client callback that can fire
 * for an account whose profile row doesn't exist, and a missing row is not
 * an error worth throwing at a learner mid-tour - the same reasoning
 * `recomputeGeneralLevelPoints` documents.
 */
export async function markTourCompleted(userId: string): Promise<void> {
  await db.learnerProfile.updateMany({
    where: { userId },
    data: { tourCompletedAt: new Date(), tourSkippedAt: null },
  });
}

export async function markTourSkipped(userId: string): Promise<void> {
  await db.learnerProfile.updateMany({
    // Only if it hasn't already been completed - leaving a replayed tour
    // must not downgrade a learner who already finished it once.
    where: { userId, tourCompletedAt: null },
    data: { tourSkippedAt: new Date() },
  });
}

/**
 * Clears both markers so the tour opens again on the next visit - what the
 * "see the introduction again" control in Settings calls.
 */
export async function resetTour(userId: string): Promise<void> {
  await db.learnerProfile.updateMany({
    where: { userId },
    data: { tourCompletedAt: null, tourSkippedAt: null },
  });
}

/** Brings back every section hint, for the matching control in Settings. */
export async function resetTourHints(userId: string): Promise<void> {
  await db.learnerProfile.updateMany({
    where: { userId },
    data: { seenTourHints: [] },
  });
}

/**
 * Adds section ids without disturbing the ones already stored. Read first
 * rather than using `push`, so re-recording a section the learner has seen
 * before can never grow the list with duplicates - both the section walk
 * and the hints write here, and either can fire for the same section.
 */
export async function markHintsSeen(
  userId: string,
  hintIds: unknown,
): Promise<void> {
  const safeHintIds = sanitizeTourHintIds(hintIds);
  if (safeHintIds.length === 0) return;

  const profile = await db.learnerProfile.findUnique({
    where: { userId },
    select: { seenTourHints: true },
  });
  if (!profile) return;

  const merged = [...new Set([...profile.seenTourHints, ...safeHintIds])];
  if (merged.length === profile.seenTourHints.length) return;

  await db.learnerProfile.updateMany({
    where: { userId },
    data: { seenTourHints: merged },
  });
}
