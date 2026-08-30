import { cache } from "react";
import { db } from "@/lib/db";
import { createTtlCache } from "@/lib/ttl-cache";
import { checkLeaderboardAchievements } from "@/lib/achievements";
import type { AccessorySlot } from "@/lib/avatar-catalog";

type EquippedBySlot = Record<AccessorySlot, string | null>;
const EMPTY_EQUIPPED: EquippedBySlot = { HEAD: null, FACE: null, TORSO: null };

/**
 * Batched avatar lookup for a list of userIds (2026-08-30, user request -
 * "en leaderboard no aparece mi personaje") - exactly 2 queries regardless
 * of how many userIds are passed in, never N+1. Used by both
 * getLeaderboardTop and getLearnerRank below.
 */
async function loadAvatarsByUserId(
  userIds: string[],
): Promise<Map<string, { animal: string; equipped: EquippedBySlot }>> {
  if (userIds.length === 0) return new Map();
  const [avatars, equippedRows] = await Promise.all([
    db.learnerAvatar.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, animal: true },
    }),
    db.learnerEquippedAccessory.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, slot: true, accessoryKey: true },
    }),
  ]);

  const equippedByUser = new Map<string, EquippedBySlot>();
  for (const row of equippedRows) {
    const current = equippedByUser.get(row.userId) ?? { ...EMPTY_EQUIPPED };
    current[row.slot as AccessorySlot] = row.accessoryKey;
    equippedByUser.set(row.userId, current);
  }

  return new Map(
    avatars.map((avatar) => [
      avatar.userId,
      {
        animal: avatar.animal,
        equipped: equippedByUser.get(avatar.userId) ?? EMPTY_EQUIPPED,
      },
    ]),
  );
}

/**
 * XP Leaderboard (2026-08-29) - ranks learners by the same
 * `generalLevelPoints` Dashboard/Progress already show as "General
 * Level," all-time/cumulative (no separate weekly window - there's no
 * point-over-time tracking to build one from, and the user's own framing
 * was "los general points que ya tenemos"). Everyone with a `nickname`
 * participates automatically (set during onboarding's "profile" step,
 * already framed to the learner as "what other learners will see on the
 * leaderboard" - no separate opt-in/opt-out).
 *
 * `generalLevelPoints > 0` is the eligibility bar for both the top list
 * and a learner's own rank - a learner who hasn't earned anything yet
 * isn't meaningfully "ranked," just tied at zero with everyone else who
 * also hasn't started.
 *
 * Shows `nickname` only, not `displayName` (2026-08-29 revision, user's
 * own rule): the leaderboard is specifically the "Account Name" surface -
 * permanent, public, set once. `displayName` ("the name Han calls you")
 * is deliberately a separate, always-editable, non-public concept now
 * (Settings' `DisplayNameSection`) and doesn't belong here at all
 * anymore - not fetched by this module.
 */

export interface LeaderboardEntry {
  userId: string;
  rank: number;
  accountName: string;
  points: number;
  /** Null if this learner hasn't picked a zodiac animal yet. */
  animal: string | null;
  equipped: EquippedBySlot;
}

const LEADERBOARD_TTL_MS = 60 * 1000;

const getCachedLeaderboardTop = createTtlCache(
  async (limit: number): Promise<LeaderboardEntry[]> => {
    const rows = await db.learnerProfile.findMany({
      where: { nickname: { not: null }, generalLevelPoints: { gt: 0 } },
      orderBy: { generalLevelPoints: "desc" },
      take: limit,
      select: { userId: true, nickname: true, generalLevelPoints: true },
    });

    const avatarsByUserId = await loadAvatarsByUserId(rows.map((r) => r.userId));

    return rows.map((row, index) => {
      const avatar = avatarsByUserId.get(row.userId);
      return {
        userId: row.userId,
        rank: index + 1,
        accountName: row.nickname!,
        points: Math.round(row.generalLevelPoints),
        animal: avatar?.animal ?? null,
        equipped: avatar?.equipped ?? EMPTY_EQUIPPED,
      };
    });
  },
  LEADERBOARD_TTL_MS,
  (limit) => `top:${limit}`,
);

/** Cached per-request (React.cache) - Dashboard's teaser and a full /leaderboard visit both need this in the same request when the teaser links straight through. */
export const getLeaderboardTop = cache(
  async (limit: number): Promise<LeaderboardEntry[]> => getCachedLeaderboardTop(limit),
);

export interface LearnerRank {
  rank: number;
  points: number;
  totalRanked: number;
}

/**
 * A learner's own position, independent of the top-N list (2026-08-29,
 * standard leaderboard UX - "you're #47" even outside the visible top
 * list). `null` when the learner hasn't earned any points yet, or has no
 * nickname (hasn't reached/completed the onboarding "profile" step - an
 * existing account from before that step existed).
 */
export const getLearnerRank = cache(
  async (userId: string): Promise<LearnerRank | null> => {
    const profile = await db.learnerProfile.findUnique({
      where: { userId },
      select: { nickname: true, generalLevelPoints: true },
    });
    if (!profile?.nickname || profile.generalLevelPoints <= 0) return null;

    const [ahead, totalRanked] = await Promise.all([
      db.learnerProfile.count({
        where: {
          nickname: { not: null },
          generalLevelPoints: { gt: profile.generalLevelPoints },
        },
      }),
      db.learnerProfile.count({
        where: { nickname: { not: null }, generalLevelPoints: { gt: 0 } },
      }),
    ]);

    const rank = ahead + 1;
    // Rank-based achievements are read-only data (leaderboard-rank.rank
    // isn't written by any mutation) - checked here, the single choke point
    // both the Dashboard teaser and the full /leaderboard page read through,
    // rather than duplicated at each caller (2026-08-29).
    await checkLeaderboardAchievements(userId, rank);

    return {
      rank,
      points: Math.round(profile.generalLevelPoints),
      totalRanked,
    };
  },
);
