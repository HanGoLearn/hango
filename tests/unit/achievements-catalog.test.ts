import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_KEY,
  CATEGORY_LABELS,
} from "@/lib/achievements-catalog";
import { tierNameForLevel } from "@/lib/points-system";
import { CHAPTER_CONFIG } from "@/lib/content/learning-journey";

describe("achievements catalog", () => {
  it("has no duplicate keys", () => {
    const keys = ACHIEVEMENTS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has a label for every category used in the catalog", () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(CATEGORY_LABELS[achievement.category]).toBeTruthy();
    }
  });

  it("every entry is reachable by key via ACHIEVEMENTS_BY_KEY", () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(ACHIEVEMENTS_BY_KEY.get(achievement.key)).toEqual(achievement);
    }
  });

  it("has one LEVEL achievement per real General Level tier (1-9), titled from points-system.ts", () => {
    for (let level = 1; level <= 9; level++) {
      const achievement = ACHIEVEMENTS_BY_KEY.get(`level_tier_${level}`);
      expect(achievement).toBeDefined();
      expect(achievement!.title).toBe(tierNameForLevel(level));
    }
    // Tier 0 ("Just Starting Out") is everyone's starting state, not an achievement.
    expect(ACHIEVEMENTS_BY_KEY.get("level_tier_0")).toBeUndefined();
  });

  it("every achievement has non-empty title and description", () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(achievement.title.length).toBeGreaterThan(0);
      expect(achievement.description.length).toBeGreaterThan(0);
    }
  });

  it("has one chapter-completion achievement per real Chapter, titled from CHAPTER_CONFIG, with the user's exact coin amounts", () => {
    const expectedCoins: Record<string, number> = {
      BEGINNER: 100,
      INTERMEDIATE: 200,
      ADVANCED: 250,
    };
    for (const [chapter, coins] of Object.entries(expectedCoins)) {
      const key = `chapter_completed_${chapter.toLowerCase()}`;
      const achievement = ACHIEVEMENTS_BY_KEY.get(key);
      expect(achievement).toBeDefined();
      expect(achievement!.category).toBe("PROGRESS");
      expect(achievement!.title).toBe(
        `${CHAPTER_CONFIG[chapter as keyof typeof CHAPTER_CONFIG].title} Complete`,
      );
      expect(achievement!.coins).toBe(coins);
    }
  });

  it("has 60 and 100-day streak tiers", () => {
    const streak60 = ACHIEVEMENTS_BY_KEY.get("streak_60");
    expect(streak60).toBeDefined();
    expect(streak60!.category).toBe("STREAK");
    expect(streak60!.coins).toBe(75);

    const streak100 = ACHIEVEMENTS_BY_KEY.get("streak_100");
    expect(streak100).toBeDefined();
    expect(streak100!.category).toBe("STREAK");
    expect(streak100!.coins).toBe(100);
  });

  it("has the Graduate capstone achievement", () => {
    const graduate = ACHIEVEMENTS_BY_KEY.get("curriculum_graduate");
    expect(graduate).toBeDefined();
    expect(graduate!.category).toBe("PROGRESS");
    expect(graduate!.coins).toBe(50);
  });

  it("has first-session Lab achievements for Speaking and Writing", () => {
    const speaking = ACHIEVEMENTS_BY_KEY.get("speaking_lab_first");
    expect(speaking).toBeDefined();
    expect(speaking!.category).toBe("PROGRESS");
    expect(speaking!.coins).toBe(15);

    const writing = ACHIEVEMENTS_BY_KEY.get("writing_lab_first");
    expect(writing).toBeDefined();
    expect(writing!.category).toBe("PROGRESS");
    expect(writing!.coins).toBe(15);
  });
});
