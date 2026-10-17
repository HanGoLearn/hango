import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  userCap: vi.fn(),
  cap: vi.fn(),
  usage: vi.fn(),
  policy: vi.fn(),
  reserve: vi.fn(),
  operation: vi.fn(),
  migration: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    aiUsageUserCap: { findUnique: mocks.userCap },
    aiUsageCap: { findUnique: mocks.cap },
    aiUsageLog: { aggregate: mocks.usage },
    aiBudgetPolicy: { findUnique: mocks.policy },
    $executeRaw: mocks.reserve,
    $queryRaw: mocks.migration,
    aiOperationLog: { create: mocks.operation },
  },
}));
import { checkDailyUsageCap, DailyUsageCapExceededError } from "@/lib/ai-usage";
beforeEach(() => {
  vi.clearAllMocks();
  process.env.HANGO_ENFORCE_GLOBAL_AI_BUDGET_IN_TESTS = "true";
  mocks.userCap.mockResolvedValue(null);
  mocks.migration.mockResolvedValue([{ applied: true }]);
  mocks.cap.mockResolvedValue({ dailyLimitUsd: 0.05 });
  mocks.usage.mockResolvedValue({ _sum: { estimatedCostUsd: 0 } });
  mocks.policy.mockResolvedValue({
    dailyLimitMicrousd: 5_000_000,
    textEnabled: true,
    sttEnabled: true,
    ttsEnabled: true,
    realtimeEnabled: true,
  });
  mocks.reserve.mockResolvedValue(1);
});
afterEach(() => {
  delete process.env.HANGO_ENFORCE_GLOBAL_AI_BUDGET_IN_TESTS;
});
describe("separate Realtime limits", () => {
  it("checks the same budget for all Tutor operations and excludes Companion", async () => {
    mocks.cap.mockResolvedValue({ dailyLimitUsd: 2 });
    await checkDailyUsageCap("learner", "han-tutor-chat");
    await checkDailyUsageCap("learner", "han-speech", {
      experience: "HAN_TUTOR",
    });
    await checkDailyUsageCap("learner", "han-teacher-transcribe", {
      experience: "HAN_TUTOR",
    });
    await checkDailyUsageCap("learner", "han-tutor-realtime-session");
    for (const call of mocks.cap.mock.calls)
      expect(call[0]).toEqual({ where: { feature: "experience:HAN_TUTOR" } });
    for (const call of mocks.usage.mock.calls)
      expect(call[0].where.OR[0]).toEqual({ experience: "HAN_TUTOR" });
    await checkDailyUsageCap("learner", "han-companion-chat");
    expect(mocks.cap).toHaveBeenLastCalledWith({
      where: { feature: "experience:HAN_COMPANION" },
    });
  });
  it("also fails closed for the new text categories before their policy copy", async () => {
    mocks.migration.mockResolvedValueOnce([{ applied: false }]);
    await expect(
      checkDailyUsageCap("learner", "han-companion-chat"),
    ).rejects.toBeInstanceOf(DailyUsageCapExceededError);
    expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it("fails closed when the existing policies have not been transferred", async () => {
    mocks.migration.mockResolvedValueOnce([{ applied: false }]);
    await expect(
      checkDailyUsageCap("learner", "han-tutor-realtime-session"),
    ).rejects.toBeInstanceOf(DailyUsageCapExceededError);
    expect(mocks.userCap).not.toHaveBeenCalled();
    expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it("allows exactly US$0.05 and reserves 50000 microdollars", async () => {
    await checkDailyUsageCap("learner", "han-tutor-realtime-session");
    expect(mocks.usage).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([{ experience: "HAN_TUTOR" }]),
        }),
      }),
    );
    expect(mocks.reserve.mock.calls[0]!.slice(1)).toEqual([
      expect.any(String),
      50_000,
      50_000,
      4_950_000,
    ]);
  });
  it("blocks the next US$0.05 when only US$0.04 remains", async () => {
    mocks.usage.mockResolvedValue({ _sum: { estimatedCostUsd: 0.01 } });
    await expect(
      checkDailyUsageCap("learner", "han-tutor-realtime-session"),
    ).rejects.toBeInstanceOf(DailyUsageCapExceededError);
    expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it("uses the user exception instead of the general limit", async () => {
    mocks.userCap.mockResolvedValue({ dailyLimitUsd: 0.1 });
    mocks.usage.mockResolvedValue({ _sum: { estimatedCostUsd: 0.05 } });
    await expect(
      checkDailyUsageCap("learner", "speaking-lab-realtime-session"),
    ).resolves.toBeUndefined();
    expect(mocks.userCap).toHaveBeenCalledWith({
      where: {
        userId_feature: {
          userId: "learner",
          feature: "experience:SPEAKING_LAB",
        },
      },
    });
  });
  it("preserves a user block independently of other voice surfaces", async () => {
    mocks.userCap.mockResolvedValueOnce({ dailyLimitUsd: 0 });
    await expect(
      checkDailyUsageCap("learner", "han-companion-realtime-session"),
    ).rejects.toBeInstanceOf(DailyUsageCapExceededError);
    await expect(
      checkDailyUsageCap("learner", "han-tutor-realtime-session"),
    ).resolves.toBeUndefined();
    expect(mocks.reserve).toHaveBeenCalledTimes(1);
  });
});
