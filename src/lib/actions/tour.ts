"use server";

import { auth } from "@/lib/auth";
import {
  markHintsSeen,
  markTourCompleted,
  markTourSkipped,
  resetTour,
  resetTourHints,
} from "@/lib/tour-progress";

/**
 * All of these are fire-and-forget from the tour's own controls: the card
 * has already moved on by the time they resolve, and a failed write costs
 * the learner nothing worse than seeing something once more. None throws
 * for an unauthenticated caller for the same reason - there is nothing to
 * tell them, and nothing to protect.
 */
export async function completeTourAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await markTourCompleted(session.user.id);
}

export async function skipTourAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await markTourSkipped(session.user.id);
}

export async function markTourHintsSeenAction(
  hintIds: string[],
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await markHintsSeen(session.user.id, hintIds);
}

/** From Settings: run the introduction again from its first card. */
export async function restartTourAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await resetTour(session.user.id);
}

/** From Settings: bring back the per-section explanations. */
export async function restoreTourHintsAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await resetTourHints(session.user.id);
}
