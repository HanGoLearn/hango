"use server";

import { auth } from "@/lib/auth";
import {
  acknowledgeAnnouncementForUser,
  getPendingAnnouncementsForUser,
} from "@/lib/learner-notices";
import type { LearnerAnnouncement } from "@/lib/learner-notices";
export type { LearnerAnnouncement } from "@/lib/learner-notices";

export async function getPendingAnnouncementsAction(): Promise<
  LearnerAnnouncement[]
> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return getPendingAnnouncementsForUser(userId);
}

export async function acknowledgeAnnouncementAction(id: string): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  await acknowledgeAnnouncementForUser(userId, id);
}
