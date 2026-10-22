import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  env: { NODE_ENV: "development", HANGO_JOURNEY_QUALITY_REVIEW: "local" },
  admin: vi.fn(),
  attempt: vi.fn(),
  provider: vi.fn(),
  complete: vi.fn(),
  track: vi.fn(),
  meter: vi.fn(),
  claim: vi.fn(),
  response: vi.fn(),
  inspection: vi.fn(),
  summary: vi.fn(),
  read: vi.fn(),
  prepare: vi.fn(),
  inspect: vi.fn(),
  substance: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/server", () => ({ serverEnv: mocks.env }));
vi.mock("@/lib/admin-auth", () => ({ requireAdministrator: mocks.admin }));
vi.mock("@/lib/journey-speaking-attempts", () => ({
  getJourneySpeakingAttempt: mocks.attempt,
}));
vi.mock("@/lib/ai", () => ({ getAiProvider: mocks.provider }));
vi.mock("@/lib/ai-usage", () => ({
  DailyUsageCapExceededError: class extends Error {},
  estimateCostUsd: () => 0.001,
  recordAiUsage: mocks.meter,
  trackAiOperation: mocks.track,
}));
vi.mock("@/lib/journey-speaking-evaluation", () => ({
  hasSubstantiveJourneyTurn: mocks.substance,
}));
vi.mock("@/lib/journey-speaking-quality-evidence-review", () => ({
  prepareJourneyQualityEvidenceReview: mocks.prepare,
}));
vi.mock("@/lib/journey-speaking-quality-store", () => ({
  localJourneyQualityStore: {
    claim: mocks.claim,
    saveResponse: mocks.response,
    saveInspection: mocks.inspection,
    saveSummary: mocks.summary,
    readSummary: mocks.read,
  },
}));
import { runLocalJourneyQualityReview } from "@/lib/journey-speaking-quality-service";
import { JOURNEY_RUBRIC_VERSION } from "@/lib/journey-speaking-attempt-contract";
import { DailyUsageCapExceededError } from "@/lib/ai-usage";
const input = {
  attemptId: "attempt",
  lessonId: "lesson",
  confirmPaidReview: true,
};
function attempt() {
  return {
    id: "attempt",
    lessonId: "lesson",
    locale: "es",
    rubricVersion: JOURNEY_RUBRIC_VERSION,
    bankVersion: "bank",
    status: "SEALED",
    closeReason: "USER_END",
    snapshot: {
      lessonId: "lesson",
      lessonSlug: "foundations-greetings-and-introductions",
      banks: { version: "bank" },
    },
    turns: [{ id: "u1", sequence: 0, role: "USER", content: "我叫小林。" }],
    captureQuality: { pendingLearnerTurn: false, interruptedAssistant: false },
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.env.NODE_ENV = "development";
  mocks.env.HANGO_JOURNEY_QUALITY_REVIEW = "local";
  mocks.admin.mockResolvedValue({ id: "admin" });
  mocks.attempt.mockResolvedValue(attempt());
  mocks.substance.mockReturnValue(true);
  mocks.prepare.mockReturnValue({
    request: {
      promptVersion: "test",
      instructions: "rubric",
      input: '{"turns":[]}',
      responseFormat: { name: "candidate", schema: { type: "object" } },
    },
    inspectResponse: mocks.inspect,
  });
  mocks.inspect.mockReturnValue({
    state: "VALIDATED_CANDIDATE",
    inspection: {
      ok: true,
      profile: { score: null, eligibleForRewards: false },
    },
  });
  mocks.provider.mockReturnValue({
    name: "openai",
    supportsStructuredOutput: true,
    complete: mocks.complete,
  });
  mocks.complete.mockResolvedValue({
    provider: "openai",
    model: "gpt-5-mini",
    content: '{"fixture":true}',
    inputTokens: 100,
    outputTokens: 50,
    outputStatus: "complete",
  });
  mocks.track.mockImplementation(async (_input, op) => op());
  mocks.meter.mockResolvedValue("usage");
  mocks.claim.mockResolvedValue(true);
  mocks.read.mockResolvedValue(null);
});
describe("manual local candidate dispatch boundary", () => {
  it.each(["production", "test"])(
    "blocks %s even with the local flag",
    async (mode) => {
      mocks.env.NODE_ENV = mode;
      await expect(runLocalJourneyQualityReview(input)).rejects.toThrow(
        /disabled/,
      );
      expect(mocks.admin).not.toHaveBeenCalled();
      expect(mocks.complete).not.toHaveBeenCalled();
    },
  );
  it("is disabled by the off switch", async () => {
    mocks.env.HANGO_JOURNEY_QUALITY_REVIEW = "off";
    await expect(runLocalJourneyQualityReview(input)).rejects.toThrow(
      /disabled/,
    );
    expect(mocks.claim).not.toHaveBeenCalled();
  });
  it("requires explicit paid confirmation", async () => {
    await expect(
      runLocalJourneyQualityReview({ ...input, confirmPaidReview: false }),
    ).rejects.toThrow();
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("denies access when administrator authorization or ownership fails", async () => {
    mocks.admin.mockRejectedValueOnce(new Error("unauthorized"));
    await expect(runLocalJourneyQualityReview(input)).rejects.toThrow();
    expect(mocks.attempt).not.toHaveBeenCalled();
    mocks.attempt.mockRejectedValueOnce(new Error("not owned"));
    await expect(runLocalJourneyQualityReview(input)).rejects.toThrow();
    expect(mocks.attempt).toHaveBeenCalledWith("admin", "attempt", "lesson");
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it.each(["ACTIVE", "CANCELLED"])(
    "never evaluates a %s capture",
    async (status) => {
      mocks.attempt.mockResolvedValue({ ...attempt(), status });
      await expect(runLocalJourneyQualityReview(input)).rejects.toThrow(
        /sealed/,
      );
      expect(mocks.claim).not.toHaveBeenCalled();
    },
  );
  it("limits review to the frozen pilot and bank version", async () => {
    const value = attempt();
    value.snapshot.lessonSlug = "other";
    mocks.attempt.mockResolvedValueOnce(value);
    await expect(runLocalJourneyQualityReview(input)).rejects.toThrow(/pilot/);
    mocks.attempt.mockResolvedValueOnce({ ...attempt(), bankVersion: "other" });
    await expect(runLocalJourneyQualityReview(input)).rejects.toThrow(/pilot/);
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("does not pay for an empty clear capture or a mock/unsupported provider", async () => {
    mocks.substance.mockReturnValueOnce(false);
    await expect(runLocalJourneyQualityReview(input)).rejects.toThrow(
      /clear speech/,
    );
    for (const provider of [
      { name: "mock", supportsStructuredOutput: true },
      { name: "openai", supportsStructuredOutput: false },
    ]) {
      mocks.provider.mockReturnValueOnce(provider);
      await expect(runLocalJourneyQualityReview(input)).rejects.toThrow(
        /provider/,
      );
    }
    expect(mocks.claim).not.toHaveBeenCalled();
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("dispatches once through existing limits, persists raw before metering and inspection", async () => {
    const result = await runLocalJourneyQualityReview(input);
    expect(result).toMatchObject({
      state: "VALIDATED_CANDIDATE",
      usageLogId: "usage",
    });
    expect(mocks.complete).toHaveBeenCalledTimes(1);
    expect(mocks.track).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "admin",
        feature: "lesson-reflection",
        experience: "LESSON_REFLECTION",
      }),
      expect.any(Function),
    );
    expect(mocks.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        retry: false,
        maxOutputTokens: 3500,
        timeoutMs: 45000,
        messages: [{ role: "user", content: '{"turns":[]}' }],
      }),
    );
    expect(mocks.response.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.meter.mock.invocationCallOrder[0]!,
    );
    expect(mocks.meter.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.inspect.mock.invocationCallOrder[0]!,
    );
    expect(mocks.meter).toHaveBeenCalledWith(
      expect.objectContaining({
        inputTokens: 100,
        outputTokens: 50,
        estimatedCostUsd: 0.001,
      }),
    );
    expect(result).not.toHaveProperty("profile");
    expect(result).not.toHaveProperty("content");
    expect(result).not.toHaveProperty("score");
  });
  it.each(["refused", "incomplete", undefined])(
    "meters %s output without silently calling it complete",
    async (outputStatus) => {
      mocks.complete.mockResolvedValue({
        ...(await mocks.complete()),
        outputStatus,
      });
      mocks.complete.mockClear();
      await runLocalJourneyQualityReview(input);
      expect(mocks.inspect).toHaveBeenCalledWith({
        status: outputStatus === "refused" ? "refused" : "incomplete",
        text: '{"fixture":true}',
      });
      expect(mocks.meter).toHaveBeenCalledTimes(1);
      expect(mocks.complete).toHaveBeenCalledTimes(1);
    },
  );
  it("does not dispatch again when a prior claim exists", async () => {
    mocks.claim.mockResolvedValue(false);
    const prior = {
      reviewKey: "a".repeat(64),
      state: "REJECTED_CANDIDATE",
      usageLogId: "usage",
    };
    mocks.read.mockResolvedValue(prior);
    expect(await runLocalJourneyQualityReview(input)).toEqual(prior);
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.meter).not.toHaveBeenCalled();
  });
  it("treats a claimed but unfinished job as ambiguous, not a retry invitation", async () => {
    mocks.claim.mockResolvedValue(false);
    expect(await runLocalJourneyQualityReview(input)).toMatchObject({
      state: "ALREADY_CLAIMED",
    });
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("honors a blocked budget without entering the provider", async () => {
    mocks.track.mockRejectedValue(new DailyUsageCapExceededError());
    expect(await runLocalJourneyQualityReview(input)).toMatchObject({
      state: "BUDGET_BLOCKED",
    });
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.meter).not.toHaveBeenCalled();
  });
  it("keeps the claim on transport failure and never exposes provider error bodies", async () => {
    mocks.complete.mockRejectedValue(new Error("SECRET BODY"));
    const result = await runLocalJourneyQualityReview(input);
    expect(result).toMatchObject({ state: "PROVIDER_FAILED" });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(mocks.complete).toHaveBeenCalledTimes(1);
  });
  it("stops before validation if private persistence or metering fails", async () => {
    mocks.response.mockRejectedValueOnce(new Error("disk"));
    expect(await runLocalJourneyQualityReview(input)).toMatchObject({
      state: "STORAGE_OR_METERING_FAILED",
    });
    expect(mocks.inspect).not.toHaveBeenCalled();
    expect(mocks.meter).not.toHaveBeenCalled();
    mocks.meter.mockRejectedValueOnce(new Error("meter"));
    expect(await runLocalJourneyQualityReview(input)).toMatchObject({
      state: "STORAGE_OR_METERING_FAILED",
    });
    expect(mocks.inspect).not.toHaveBeenCalled();
  });
});
