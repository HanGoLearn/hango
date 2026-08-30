"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ACHIEVEMENTS_BY_KEY,
  type AchievementDefinition,
} from "@/lib/achievements-catalog";

export interface UnlockedAchievement extends AchievementDefinition {
  unlockedAt: Date;
}

/**
 * Powers the celebration modal (2026-08-29) - detection (achievements.ts)
 * and celebration are deliberately decoupled: this just reads whatever's
 * sitting unseen in the Achievement table, regardless of which of the 7
 * hook points wrote it. Oldest first, so a learner who unlocked several at
 * once sees them in the order they actually happened.
 */
export async function getUnseenAchievementsAction(): Promise<
  UnlockedAchievement[]
> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const rows = await db.achievement.findMany({
    where: { userId: session.user.id, seenAt: null },
    orderBy: { unlockedAt: "asc" },
  });

  return rows.flatMap((row) => {
    const definition = ACHIEVEMENTS_BY_KEY.get(row.key);
    return definition ? [{ ...definition, unlockedAt: row.unlockedAt }] : [];
  });
}

export async function markAchievementsSeenAction(
  keys: string[],
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || keys.length === 0) return;
  await db.achievement.updateMany({
    where: { userId: session.user.id, key: { in: keys }, seenAt: null },
    data: { seenAt: new Date() },
  });
}
