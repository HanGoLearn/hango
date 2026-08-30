import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getLeaderboardTop, getLearnerRank } from "@/lib/leaderboard-data";

// getLeaderboardTop is TTL-cached (leaderboard-data.ts, keyed by `limit`) -
// each test below uses a distinct limit so it can't read a stale result
// left behind by another test in this same file/process.
const testEmails: string[] = [];

afterEach(async () => {
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createRankedLearner(
  email: string,
  data: { nickname?: string; displayName?: string; points: number },
) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  await db.learnerProfile.create({
    data: {
      userId: user.id,
      nickname: data.nickname,
      displayName: data.displayName,
      generalLevelPoints: data.points,
    },
  });
  return user;
}

describe("leaderboard (integration, real database)", () => {
  it("ranks eligible learners by points, descending", async () => {
    const stamp = Date.now();
    const low = await createRankedLearner(`lb-low-${stamp}@hango.dev`, {
      nickname: `lblow${stamp}`,
      displayName: "Low Scorer",
      points: 10,
    });
    const high = await createRankedLearner(`lb-high-${stamp}@hango.dev`, {
      nickname: `lbhigh${stamp}`,
      displayName: "High Scorer",
      points: 90,
    });
    const mid = await createRankedLearner(`lb-mid-${stamp}@hango.dev`, {
      nickname: `lbmid${stamp}`,
      displayName: "Mid Scorer",
      points: 50,
    });

    const top = await getLeaderboardTop(10_001);
    const ids = top.map((entry) => entry.userId);
    const highIndex = ids.indexOf(high.id);
    const midIndex = ids.indexOf(mid.id);
    const lowIndex = ids.indexOf(low.id);

    expect(highIndex).toBeGreaterThanOrEqual(0);
    expect(midIndex).toBeGreaterThan(highIndex);
    expect(lowIndex).toBeGreaterThan(midIndex);
    expect(top[highIndex]!.points).toBe(90);
    expect(top[highIndex]!.accountName).toBe(`lbhigh${stamp}`);
    // rank is this learner's position in the *whole* ranked table, not
    // just among these 3 seeded rows, so only the ordering/values above
    // are asserted directly - not a specific rank number.
  });

  it("excludes learners with no nickname or zero points", async () => {
    const stamp = Date.now();
    const noNickname = await createRankedLearner(
      `lb-nonick-${stamp}@hango.dev`,
      { points: 40 },
    );
    const zeroPoints = await createRankedLearner(
      `lb-zero-${stamp}@hango.dev`,
      { nickname: `lbzero${stamp}`, points: 0 },
    );
    const eligible = await createRankedLearner(
      `lb-eligible-${stamp}@hango.dev`,
      { nickname: `lbeligible${stamp}`, points: 5 },
    );

    const top = await getLeaderboardTop(10_002);
    const ids = top.map((entry) => entry.userId);

    expect(ids).not.toContain(noNickname.id);
    expect(ids).not.toContain(zeroPoints.id);
    expect(ids).toContain(eligible.id);
  });

  it("never surfaces displayName - the leaderboard is Account Name only (2026-08-29 revision)", async () => {
    const stamp = Date.now();
    const user = await createRankedLearner(`lb-nodisplay-${stamp}@hango.dev`, {
      nickname: `lbnodisplay${stamp}`,
      displayName: "Should Never Appear Here",
      points: 15,
    });

    const top = await getLeaderboardTop(10_003);
    const entry = top.find((e) => e.userId === user.id);
    expect(entry?.accountName).toBe(`lbnodisplay${stamp}`);
    expect(entry).not.toHaveProperty("displayName");
  });

  it("computes a learner's own rank and total ranked count", async () => {
    const stamp = Date.now();
    const above = await createRankedLearner(`lb-above-${stamp}@hango.dev`, {
      nickname: `lbabove${stamp}`,
      points: 200,
    });
    const me = await createRankedLearner(`lb-me-${stamp}@hango.dev`, {
      nickname: `lbme${stamp}`,
      points: 100,
    });
    await createRankedLearner(`lb-below-${stamp}@hango.dev`, {
      nickname: `lbbelow${stamp}`,
      points: 50,
    });

    const rank = await getLearnerRank(me.id);
    expect(rank).not.toBeNull();
    expect(rank!.points).toBe(100);
    expect(rank!.totalRanked).toBeGreaterThanOrEqual(3);

    const aboveRank = await getLearnerRank(above.id);
    expect(aboveRank!.rank).toBeLessThan(rank!.rank);
  });

  it("returns null rank for a learner with no points or no nickname", async () => {
    const stamp = Date.now();
    const zeroPoints = await createRankedLearner(
      `lb-rank-zero-${stamp}@hango.dev`,
      { nickname: `lbrankzero${stamp}`, points: 0 },
    );
    const noNickname = await createRankedLearner(
      `lb-rank-nonick-${stamp}@hango.dev`,
      { points: 30 },
    );

    expect(await getLearnerRank(zeroPoints.id)).toBeNull();
    expect(await getLearnerRank(noNickname.id)).toBeNull();
  });

  it("includes the learner's chosen animal and equipped accessories (2026-08-30)", async () => {
    const stamp = Date.now();
    const dressed = await createRankedLearner(`lb-avatar-${stamp}@hango.dev`, {
      nickname: `lbavatar${stamp}`,
      points: 25,
    });
    await db.learnerAvatar.create({
      data: { userId: dressed.id, animal: "RABBIT" },
    });
    await db.learnerEquippedAccessory.create({
      data: { userId: dressed.id, slot: "HEAD", accessoryKey: "cap" },
    });

    const top = await getLeaderboardTop(10_004);
    const entry = top.find((e) => e.userId === dressed.id);
    expect(entry?.animal).toBe("RABBIT");
    expect(entry?.equipped).toEqual({
      HEAD: "cap",
      FACE: null,
      TORSO: null,
    });
  });

  it("returns animal: null (not a crash) for an eligible learner who hasn't picked an avatar yet", async () => {
    const stamp = Date.now();
    const bare = await createRankedLearner(`lb-noavatar-${stamp}@hango.dev`, {
      nickname: `lbnoavatar${stamp}`,
      points: 25,
    });

    const top = await getLeaderboardTop(10_005);
    const entry = top.find((e) => e.userId === bare.id);
    expect(entry?.animal).toBeNull();
    expect(entry?.equipped).toEqual({ HEAD: null, FACE: null, TORSO: null });
  });
});
