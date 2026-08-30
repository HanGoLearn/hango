import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  getCoinBalance,
  grantCoins,
  purchaseAccessory,
  equipAccessory,
  InsufficientCoinsError,
  AlreadyOwnedError,
  NotOwnedError,
  AccessoryNotFoundError,
} from "@/lib/coins";
import { checkStreakAchievements } from "@/lib/achievements";

const testEmails: string[] = [];

afterEach(async () => {
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  return db.user.create({ data: { email } });
}

describe("HanCoins (integration, real database)", () => {
  it("grantCoins is idempotent per sourceKey - a lesson redo never pays twice", async () => {
    const user = await createTestUser(`coins-grant-${Date.now()}@hango.dev`);

    await grantCoins(user.id, 3, "lesson_completed", "lesson:abc");
    expect(await getCoinBalance(user.id)).toBe(3);

    // Same sourceKey again (simulating a redo re-hitting the same hook) -
    // must not add a second entry.
    await grantCoins(user.id, 3, "lesson_completed", "lesson:abc");
    expect(await getCoinBalance(user.id)).toBe(3);

    const entries = await db.coinLedgerEntry.findMany({
      where: { userId: user.id },
    });
    expect(entries).toHaveLength(1);
  });

  it("getCoinBalance sums positive and negative entries", async () => {
    const user = await createTestUser(`coins-balance-${Date.now()}@hango.dev`);
    await grantCoins(user.id, 10, "lesson_completed", "lesson:a");
    await grantCoins(user.id, 5, "scenario_completed", "scenario:x");
    expect(await getCoinBalance(user.id)).toBe(15);
  });

  it("unlocking an achievement also grants its coin payout, exactly once even if re-checked after losing and regaining the streak", async () => {
    const user = await createTestUser(`coins-achievement-${Date.now()}@hango.dev`);

    await checkStreakAchievements(user.id, 3); // unlocks streak_3 (10 coins)
    expect(await getCoinBalance(user.id)).toBe(10);

    const achievement = await db.achievement.findFirst({
      where: { userId: user.id, key: "streak_3" },
    });
    expect(achievement).not.toBeNull();

    // Streak lost (drops to 0) and regained to 3 - re-checking must not
    // unlock streak_3 again or pay its coins a second time.
    await checkStreakAchievements(user.id, 0);
    await checkStreakAchievements(user.id, 3);
    expect(await getCoinBalance(user.id)).toBe(10);

    const achievementRows = await db.achievement.count({
      where: { userId: user.id, key: "streak_3" },
    });
    expect(achievementRows).toBe(1);
  });

  describe("purchaseAccessory", () => {
    it("deducts the price and grants ownership atomically", async () => {
      const user = await createTestUser(`coins-purchase-${Date.now()}@hango.dev`);
      await grantCoins(user.id, 100, "lesson_completed", "lesson:seed");

      await purchaseAccessory(user.id, "cap"); // COMMON, 50 coins
      expect(await getCoinBalance(user.id)).toBe(50);

      const owned = await db.learnerAccessoryOwnership.findUnique({
        where: { userId_accessoryKey: { userId: user.id, accessoryKey: "cap" } },
      });
      expect(owned).not.toBeNull();
    });

    it("rejects an insufficient balance and changes nothing", async () => {
      const user = await createTestUser(`coins-poor-${Date.now()}@hango.dev`);
      await grantCoins(user.id, 10, "lesson_completed", "lesson:seed");

      await expect(purchaseAccessory(user.id, "cap")).rejects.toBeInstanceOf(
        InsufficientCoinsError,
      );
      expect(await getCoinBalance(user.id)).toBe(10);
      const owned = await db.learnerAccessoryOwnership.findUnique({
        where: { userId_accessoryKey: { userId: user.id, accessoryKey: "cap" } },
      });
      expect(owned).toBeNull();
    });

    it("rejects buying the same accessory twice", async () => {
      const user = await createTestUser(`coins-double-${Date.now()}@hango.dev`);
      await grantCoins(user.id, 200, "lesson_completed", "lesson:seed");

      await purchaseAccessory(user.id, "cap");
      await expect(purchaseAccessory(user.id, "cap")).rejects.toBeInstanceOf(
        AlreadyOwnedError,
      );
      // Only charged once.
      expect(await getCoinBalance(user.id)).toBe(150);
    });

    it("rejects an unknown accessory key", async () => {
      const user = await createTestUser(`coins-unknown-${Date.now()}@hango.dev`);
      await expect(
        purchaseAccessory(user.id, "not-a-real-accessory"),
      ).rejects.toBeInstanceOf(AccessoryNotFoundError);
    });
  });

  describe("equipAccessory", () => {
    it("equips an owned accessory into its slot", async () => {
      const user = await createTestUser(`coins-equip-${Date.now()}@hango.dev`);
      await grantCoins(user.id, 100, "lesson_completed", "lesson:seed");
      await purchaseAccessory(user.id, "cap");

      await equipAccessory(user.id, "HEAD", "cap");
      const equipped = await db.learnerEquippedAccessory.findUnique({
        where: { userId_slot: { userId: user.id, slot: "HEAD" } },
      });
      expect(equipped?.accessoryKey).toBe("cap");
    });

    it("rejects equipping an accessory that isn't owned", async () => {
      const user = await createTestUser(`coins-notowned-${Date.now()}@hango.dev`);
      await expect(
        equipAccessory(user.id, "HEAD", "cap"),
      ).rejects.toBeInstanceOf(NotOwnedError);
    });

    it("unequips a slot when passed null", async () => {
      const user = await createTestUser(`coins-unequip-${Date.now()}@hango.dev`);
      await grantCoins(user.id, 100, "lesson_completed", "lesson:seed");
      await purchaseAccessory(user.id, "cap");
      await equipAccessory(user.id, "HEAD", "cap");

      await equipAccessory(user.id, "HEAD", null);
      const equipped = await db.learnerEquippedAccessory.findUnique({
        where: { userId_slot: { userId: user.id, slot: "HEAD" } },
      });
      expect(equipped).toBeNull();
    });
  });
});
