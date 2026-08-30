import { tierNameForLevel } from "@/lib/points-system";
import {
  JOURNEY_CHAPTER_ORDER,
  CHAPTER_CONFIG,
} from "@/lib/content/learning-journey";

/**
 * Achievements catalog (2026-08-29, user request - "quiero que haya momento
 * de celebracion, y un registro de desbloqueo"). A fixed, code-defined list
 * of unlockable achievements - content (title/description/icon) lives here,
 * not the database, the same way HSK_POINT_THRESHOLDS's tier labels already
 * live in points-system.ts rather than a seeded table. `key` is permanent
 * once shipped: it's the primary identity `achievements.ts` writes into the
 * `Achievement` table, and existing learners' unlocked rows reference it
 * directly - renaming a key here orphans their unlock record.
 *
 * Every condition below is grounded in data the app already computes for
 * other reasons (streak, General Level tier, Reflection score, lesson/
 * scenario/placement completion, leaderboard rank) - no achievement here
 * introduces new gameplay logic, only new recognition of existing milestones.
 */

export type AchievementCategory =
  | "STREAK"
  | "LEVEL"
  | "MASTERY"
  | "PROGRESS"
  | "COMMUNITY";

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  STREAK: "Streaks",
  LEVEL: "General Level",
  MASTERY: "Mastery",
  PROGRESS: "Progress",
  COMMUNITY: "Community",
};

export interface AchievementDefinition {
  key: string;
  category: AchievementCategory;
  title: string;
  description: string;
  /**
   * Resolved to a lucide-react component only where rendered
   * (achievement-badge.tsx) - kept as a plain string here so this module
   * stays a lightweight data import for both server condition-checks
   * (src/lib/achievements.ts) and client rendering, with no icon components
   * pulled in where they aren't needed.
   */
  iconName:
    | "Flame"
    | "Award"
    | "Star"
    | "CheckCircle"
    | "Trophy"
    | "GraduationCap"
    | "Mic"
    | "PenLine";
  /**
   * HanCoins paid the moment this unlocks (2026-08-30, user's rarity table)
   * - written by achievements.ts's unlock() alongside the Achievement row
   * itself, in the same transaction, so a logro never exists without its
   * coin payment. Amounts are the user's own calibration by relative
   * rarity, not a formula.
   */
  coins: number;
}

const STREAK_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: "streak_3",
    category: "STREAK",
    title: "3-Day Streak",
    description: "Studied 3 days in a row.",
    iconName: "Flame",
    coins: 10,
  },
  {
    key: "streak_7",
    category: "STREAK",
    title: "Perfect Week",
    description: "Studied 7 days in a row.",
    iconName: "Flame",
    coins: 20,
  },
  {
    key: "streak_30",
    category: "STREAK",
    title: "30-Day Streak",
    description: "Studied 30 days in a row.",
    iconName: "Flame",
    coins: 50,
  },
  {
    key: "streak_60",
    category: "STREAK",
    title: "60-Day Streak",
    description: "Studied 60 days in a row.",
    iconName: "Flame",
    coins: 75,
  },
  {
    key: "streak_100",
    category: "STREAK",
    title: "100-Day Streak",
    description: "Studied 100 days in a row.",
    iconName: "Flame",
    coins: 100,
  },
];

/**
 * One achievement per real General Level tier (1-9), title reused verbatim
 * from points-system.ts's own tier labels - if that wording ever changes,
 * this list changes with it automatically instead of drifting out of sync.
 * Tier 0 ("Just Starting Out") is everyone's starting state, not an
 * achievement.
 */
const LEVEL_TIER_COINS = [10, 10, 15, 15, 20, 25, 30, 40, 50];

const LEVEL_ACHIEVEMENTS: AchievementDefinition[] = Array.from(
  { length: 9 },
  (_, index) => {
    const level = index + 1;
    const label = tierNameForLevel(level);
    return {
      key: `level_tier_${level}`,
      category: "LEVEL" as const,
      title: label,
      description: `Reached the "${label}" General Level tier.`,
      iconName: "Award" as const,
      coins: LEVEL_TIER_COINS[index]!,
    };
  },
);

const MASTERY_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: "reflection_perfect",
    category: "MASTERY",
    title: "Perfect Score",
    description: "Scored 100 on a lesson's Reflection.",
    iconName: "Star",
    coins: 20,
  },
  {
    key: "reflection_three_star_5",
    category: "MASTERY",
    title: "Rising Star",
    description: "Scored 90+ on 5 lessons.",
    iconName: "Star",
    coins: 20,
  },
  {
    key: "reflection_three_star_25",
    category: "MASTERY",
    title: "Star Performer",
    description: "Scored 90+ on 25 lessons.",
    iconName: "Star",
    coins: 40,
  },
];

const PROGRESS_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: "lessons_10",
    category: "PROGRESS",
    title: "10 Lessons",
    description: "Completed 10 lessons.",
    iconName: "CheckCircle",
    coins: 15,
  },
  {
    key: "lessons_50",
    category: "PROGRESS",
    title: "50 Lessons",
    description: "Completed 50 lessons.",
    iconName: "CheckCircle",
    coins: 35,
  },
  {
    key: "scenario_first",
    category: "PROGRESS",
    title: "First Scenario",
    description: "Completed your first scenario.",
    iconName: "CheckCircle",
    coins: 15,
  },
];

/**
 * One per Chapter (2026-08-30, user request) - every scenario in the
 * chapter completed AND a plain average of every lesson's Reflection score
 * in it above 70 (checked in achievements.ts, not just "touched" - a
 * chapter finished with weak scores doesn't count). Titles reuse
 * CHAPTER_CONFIG's real names so this can never drift from what the
 * Learning Journey page itself calls each chapter. Coins are the user's
 * own explicit numbers, not derived from a formula - Foundations is the
 * smallest chapter but still the first real "you finished a whole chapter"
 * moment, Advanced Situations is the hardest content.
 */
const CHAPTER_COINS: Record<(typeof JOURNEY_CHAPTER_ORDER)[number], number> = {
  BEGINNER: 100,
  INTERMEDIATE: 200,
  ADVANCED: 250,
};

const CHAPTER_ACHIEVEMENTS: AchievementDefinition[] = JOURNEY_CHAPTER_ORDER.map(
  (chapter) => {
    const title = CHAPTER_CONFIG[chapter].title;
    return {
      key: `chapter_completed_${chapter.toLowerCase()}`,
      category: "PROGRESS" as const,
      title: `${title} Complete`,
      description: `Completed every scenario in ${title} with an average Reflection score above 70.`,
      iconName: "CheckCircle" as const,
      coins: CHAPTER_COINS[chapter],
    };
  },
);

/**
 * The capstone (2026-08-30, user request - "el graduado") - all 3 chapters
 * done. Deliberately just "all 3 CHAPTER_ACHIEVEMENTS keys already
 * unlocked" (achievements.ts) rather than a fresh curriculum-wide average -
 * each chapter already required its own >70 average to unlock, so "all 3
 * unlocked" already means the whole curriculum was finished with a real
 * score, with no need to recompute it a second way.
 */
const GRADUATE_ACHIEVEMENT: AchievementDefinition = {
  key: "curriculum_graduate",
  category: "PROGRESS",
  title: "Graduate",
  description: "Completed Foundations, Everyday Life, and Advanced Situations.",
  iconName: "GraduationCap",
  coins: 50,
};

/**
 * First session in each Lab (2026-08-30, user request - "me gusta los
 * primeros pasos en labs"). Icons reuse the exact same Mic/PenLine glyphs
 * navigation.ts already brands these two Labs with, not new icons of their
 * own - the badge should look like "that Lab", the same way CHAPTER_
 * ACHIEVEMENTS reuses CHAPTER_CONFIG's titles instead of writing new ones.
 */
const LAB_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: "speaking_lab_first",
    category: "PROGRESS",
    title: "First Words",
    description: "Completed your first Speaking Lab session.",
    iconName: "Mic",
    coins: 15,
  },
  {
    key: "writing_lab_first",
    category: "PROGRESS",
    title: "First Draft",
    description: "Completed your first Writing Lab submission.",
    iconName: "PenLine",
    coins: 15,
  },
];

const COMMUNITY_ACHIEVEMENTS: AchievementDefinition[] = [
  {
    key: "leaderboard_top10",
    category: "COMMUNITY",
    title: "Top 10",
    description: "Reached the top 10 on the leaderboard.",
    iconName: "Trophy",
    coins: 20,
  },
  {
    key: "leaderboard_rank1",
    category: "COMMUNITY",
    title: "#1 on the Leaderboard",
    description: "Reached #1 on the leaderboard.",
    iconName: "Trophy",
    coins: 50,
  },
];

export const ACHIEVEMENTS: AchievementDefinition[] = [
  ...STREAK_ACHIEVEMENTS,
  ...LEVEL_ACHIEVEMENTS,
  ...MASTERY_ACHIEVEMENTS,
  ...PROGRESS_ACHIEVEMENTS,
  ...CHAPTER_ACHIEVEMENTS,
  GRADUATE_ACHIEVEMENT,
  ...LAB_ACHIEVEMENTS,
  ...COMMUNITY_ACHIEVEMENTS,
];

export const ACHIEVEMENTS_BY_KEY: Map<string, AchievementDefinition> = new Map(
  ACHIEVEMENTS.map((achievement) => [achievement.key, achievement]),
);
