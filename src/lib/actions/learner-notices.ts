"use server";

import { auth } from "@/lib/auth";
import {
  acknowledgeAnnouncementForUser,
  getPendingAnnouncementsForUser,
} from "@/lib/learner-notices";
import type { LearnerAnnouncement } from "@/lib/learner-notices";
import {
  interfaceLanguageFromLocale,
  isAppLocale,
  type AppLocale,
} from "@/i18n/config";
export type { LearnerAnnouncement } from "@/lib/learner-notices";

export async function getPendingAnnouncementsAction(
  locale: AppLocale,
): Promise<LearnerAnnouncement[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  if (!isAppLocale(locale)) return [];
  return getPendingAnnouncementsForUser(
    userId,
    interfaceLanguageFromLocale(locale),
  );
}

export async function acknowledgeAnnouncementAction(id: string): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return;

  await acknowledgeAnnouncementForUser(userId, id);
}
