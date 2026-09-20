import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  achievementUpdateMany: vi.fn(),
  coinUpdateMany: vi.fn(),
  acknowledgeAnnouncementForUser: vi.fn(),
  getPendingAnnouncementsForUser: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: {
    achievement: { updateMany: mocks.achievementUpdateMany },
    coinLedgerEntry: { updateMany: mocks.coinUpdateMany },
  },
}));
vi.mock("@/lib/learner-notices", () => ({
  acknowledgeAnnouncementForUser: mocks.acknowledgeAnnouncementForUser,
  getPendingAnnouncementsForUser: mocks.getPendingAnnouncementsForUser,
}));

const { markAchievementsSeenAction } =
  await import("@/lib/actions/achievements");
const { markCoinGainsSeenAction } = await import("@/lib/actions/coins");
const { acknowledgeAnnouncementAction } =
  await import("@/lib/actions/learner-notices");

describe("learner action ID isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "current-user" } });
  });

  it("scopes achievement keys to the authenticated learner", async () => {
    await markAchievementsSeenAction(["first-week"]);

    expect(mocks.achievementUpdateMany).toHaveBeenCalledWith({
      where: {
        userId: "current-user",
        key: { in: ["first-week"] },
        seenAt: null,
      },
      data: { seenAt: expect.any(Date) },
    });
  });

  it("scopes coin-ledger IDs to the authenticated learner", async () => {
    await markCoinGainsSeenAction(["entry-owned-by-someone-else"]);

    expect(mocks.coinUpdateMany).toHaveBeenCalledWith({
      where: {
        userId: "current-user",
        id: { in: ["entry-owned-by-someone-else"] },
        seenAt: null,
      },
      data: { seenAt: expect.any(Date) },
    });
  });

  it("passes the authenticated learner to announcement acknowledgement", async () => {
    await acknowledgeAnnouncementAction("announcement-id");

    expect(mocks.acknowledgeAnnouncementForUser).toHaveBeenCalledWith(
      "current-user",
      "announcement-id",
    );
  });
});
