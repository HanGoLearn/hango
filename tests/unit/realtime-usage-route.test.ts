import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  check: vi.fn(),
  record: vi.fn(),
  fetch: vi.fn(),
  banks: vi.fn(),
  binding: vi.fn(),
}));
vi.mock("@/lib/journey-speaking-realtime-binding", () => ({
  getJourneyRealtimeBinding: mocks.binding,
}));
vi.mock("@/lib/content/journey-speaking-bank-data", () => ({
  getJourneySpeakingBanks: mocks.banks,
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/env/server", () => ({
  serverEnv: {
    NODE_ENV: "test",
    OPENAI_API_KEY: "test-placeholder-no-real-key",
  },
}));
vi.mock("@/lib/db", () => ({
  db: {
    learnerProfile: { findUnique: vi.fn().mockResolvedValue(null) },
    progressEvidence: { findMany: vi.fn().mockResolvedValue([]) },
    learnerFact: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));
vi.mock("@/lib/progress-data", () => ({
  getCompetencyProgress: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/ai-usage", () => ({
  checkDailyUsageCap: mocks.check,
  recordAiUsage: mocks.record,
  DailyUsageCapExceededError: class extends Error {},
}));
const { POST } = await import("../../app/api/han/realtime/route");
const { DailyUsageCapExceededError } = await import("@/lib/ai-usage");
const rolePlay = {
  aiRole: "Friend",
  learnerRole: "You",
  scenarioContext: "Meet",
  objective: "Introduce yourself",
};
let userCounter = 0;

function request(mode: string, context = {}, surface?: string) {
  return new Request(
    `http://localhost/api/han/realtime?mode=${mode}${surface ? `&surface=${surface}` : ""}`,
    {
      method: "POST",
      body: "mock-sdp",
      headers: { "x-han-context": encodeURIComponent(JSON.stringify(context)) },
    },
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    user: { id: `mock-learner-${++userCounter}` },
  });
  mocks.check.mockResolvedValue(undefined);
  mocks.banks.mockResolvedValue(null);
  mocks.fetch.mockResolvedValue(new Response("mock-answer", { status: 200 }));
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => vi.unstubAllGlobals());

describe("Realtime session accounting route (mock provider)", () => {
  it("checks a bound attempt before budget/provider calls and never silently falls back", async () => {
    mocks.binding.mockRejectedValueOnce(new Error("wrong owner"));
    const input = request(
      "PRACTICE",
      { rolePlay, lessonId: "lesson" },
      "JOURNEY",
    );
    input.headers.set("x-hango-journey-attempt-id", "foreign");
    expect((await POST(input)).status).toBe(403);
    expect(mocks.check).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.banks).not.toHaveBeenCalled();
    mocks.binding.mockRejectedValueOnce(new Error("empty ID"));
    const empty = request(
      "PRACTICE",
      { rolePlay, lessonId: "lesson" },
      "JOURNEY",
    );
    empty.headers.set("x-hango-journey-attempt-id", "");
    expect((await POST(empty)).status).toBe(403);
    expect(mocks.fetch).not.toHaveBeenCalled();
    const tutor = request("TUTOR");
    tutor.headers.set("x-hango-journey-attempt-id", "foreign");
    expect((await POST(tutor)).status).toBe(400);
  });
  it("uses the frozen server role and bank for a bound Journey handshake", async () => {
    const banks = {
      version: "test-version",
      lessonId: "lesson",
      core: { vocabulary: [], grammar: [] },
      support: { vocabulary: [], grammar: [] },
      extension: { vocabulary: [], grammar: [] },
      openingLine: "你好",
      phraseBank: [],
      rationale: "snapshot",
      reviewIssues: [],
    };
    mocks.binding.mockResolvedValueOnce({
      attemptId: "owned",
      rolePlay: {
        ...rolePlay,
        aiRole: "New classmate",
        objective: "Give your name",
      },
      banks,
    });
    const input = request(
      "PRACTICE",
      { rolePlay: { ...rolePlay, aiRole: "FORGED_ROLE" }, lessonId: "lesson" },
      "JOURNEY",
    );
    input.headers.set("x-hango-journey-attempt-id", "owned");
    const response = await POST(input);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.journeyAttemptId).toBe("owned");
    expect(payload.journeySpeakingBanks).toEqual(banks);
    expect(payload.instructions).not.toContain("FORGED_ROLE");
    expect(mocks.banks).not.toHaveBeenCalled();
  });
  it("resolves Journey exposure from the authenticated user and discards a forged bank", async () => {
    const response = await POST(
      request(
        "PRACTICE",
        {
          rolePlay,
          lessonId: "real-lesson",
          journeySpeakingBanks: { core: "FORGED_USER_MASTERY" },
        },
        "JOURNEY",
      ),
    );
    expect(response.status).toBe(200);
    expect(mocks.banks).toHaveBeenCalledWith(
      `mock-learner-${userCounter}`,
      "real-lesson",
    );
    const body = mocks.fetch.mock.calls[0]?.[1]?.body as FormData;
    expect(body.get("session")).not.toContain("FORGED_USER_MASTERY");
    expect((await response.json()).journeySpeakingBanks).toBeNull();
  });
  it.each(["SPEAKING_LAB", "PLACEMENT"] as const)(
    "never reads Journey exposure for %s",
    async (surface) => {
      const response = await POST(
        request(
          "PRACTICE",
          {
            rolePlay,
            lessonId: "real-lesson",
            journeySpeakingBanks: { core: "FORGED_USER_MASTERY" },
          },
          surface,
        ),
      );
      expect(response.status).toBe(200);
      expect(mocks.banks).not.toHaveBeenCalled();
      expect((await response.json()).journeySpeakingBanks).toBeUndefined();
    },
  );
  it.each(["JOURNEY", "SPEAKING_LAB", "PLACEMENT"] as const)(
    "permits multilingual help only on the Journey scene (%s)",
    async (surface) => {
      expect(
        (
          await POST(
            request(
              "PRACTICE",
              { rolePlay, speakingSurface: surface },
              surface,
            ),
          )
        ).status,
      ).toBe(200);
      const body = mocks.fetch.mock.calls[0]?.[1]?.body as FormData;
      const session = JSON.parse(body.get("session") as string);
      if (surface === "JOURNEY") {
        expect(session.audio.input.transcription.language).toBeUndefined();
        expect(session.instructions).toContain("JOURNEY LEARNING CONTRACT");
      } else {
        expect(session.audio.input.transcription.language).toBe("zh");
        expect(session.instructions).not.toContain("JOURNEY LEARNING CONTRACT");
      }
    },
  );
  it.each([
    ["TUTOR", {}, undefined, "han-tutor-realtime-session"],
    ["PRACTICE", {}, undefined, "han-companion-realtime-session"],
    ["PRACTICE", { rolePlay }, "JOURNEY", "journey-speaking-realtime-session"],
    ["PRACTICE", { rolePlay }, "SPEAKING_LAB", "speaking-lab-realtime-session"],
    ["PRACTICE", { rolePlay }, "PLACEMENT", "placement-realtime-session"],
  ] as const)(
    "checks and logs %s / %s in %s",
    async (mode, context, surface, feature) => {
      const response = await POST(request(mode, context, surface));
      expect(response.status).toBe(200);
      expect(mocks.check).toHaveBeenCalledWith(
        expect.any(String),
        feature,
        expect.objectContaining({ provider: "openai" }),
        expect.any(Object),
      );
      expect(mocks.record).toHaveBeenCalledWith(
        expect.objectContaining({ feature, estimatedCostUsd: 0.05 }),
      );
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
    },
  );
  it("does not record an unsuccessful provider handshake", async () => {
    mocks.fetch.mockResolvedValueOnce(
      new Response("mock-failure", { status: 503 }),
    );
    expect((await POST(request("TUTOR"))).status).toBe(503);
    expect(mocks.record).not.toHaveBeenCalled();
  });
  it("rejects mismatched surfaces before budgets or the provider", async () => {
    expect((await POST(request("TUTOR", {}, "SPEAKING_LAB"))).status).toBe(400);
    expect(mocks.check).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("blocks at the selected feature's cap before opening paid audio", async () => {
    mocks.check.mockRejectedValueOnce(
      new DailyUsageCapExceededError("limit reached"),
    );
    expect(
      (await POST(request("PRACTICE", { rolePlay }, "SPEAKING_LAB"))).status,
    ).toBe(429);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.record).not.toHaveBeenCalled();
  });
  it("requires authentication before any paid work", async () => {
    mocks.auth.mockResolvedValueOnce(null);
    expect((await POST(request("TUTOR"))).status).toBe(401);
    expect(mocks.check).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
