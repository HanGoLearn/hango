import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
const m = vi.hoisted(() => ({
  admin: vi.fn(),
  list: vi.fn(),
  attempt: vi.fn(),
  usage: vi.fn(),
  claim: vi.fn(),
  summary: vi.fn(),
  response: vi.fn(),
  prepare: vi.fn(),
  inspect: vi.fn(),
  evidencePrepare: vi.fn(),
  evidenceInspect: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin-auth", () => ({ requireAdministrator: m.admin }));
vi.mock("@/lib/db", () => ({
  db: {
    journeySpeakingAttempt: { findMany: m.list },
    aiUsageLog: { findFirst: m.usage },
  },
}));
vi.mock("@/lib/journey-speaking-attempts", () => ({
  getJourneySpeakingAttempt: m.attempt,
}));
vi.mock("@/lib/journey-speaking-quality-store", () => ({
  localJourneyQualityStore: {
    readClaim: m.claim,
    readSummary: m.summary,
    readResponse: m.response,
  },
}));
vi.mock("@/lib/journey-speaking-quality-review", () => ({
  prepareJourneyQualityReview: m.prepare,
}));
vi.mock("@/lib/journey-speaking-quality-evidence-review", () => ({
  prepareJourneyQualityEvidenceReview: m.evidencePrepare,
}));
import { getLocalJourneyQualityReview } from "@/lib/journey-speaking-quality-data";
import { JOURNEY_QUALITY_CANDIDATE_VERSION } from "@/lib/journey-speaking-quality-candidate";
const input = '{"attemptId":"own"}';
const key = createHash("sha256")
  .update(JSON.stringify(["admin", "own", JOURNEY_QUALITY_CANDIDATE_VERSION]))
  .digest("hex");
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "development");
  m.admin.mockResolvedValue({ id: "admin" });
  m.list.mockResolvedValue([
    {
      id: "own",
      lessonId: "lesson",
      startedAt: new Date("2026-10-18T12:00:00Z"),
      lesson: { title: "Saludos" },
      evaluation: { score: 75 },
    },
  ]);
  m.attempt.mockResolvedValue({
    id: "own",
    lessonId: "lesson",
    locale: "es",
    closeReason: "USER_END",
    snapshot: {},
    turns: [{ id: "u1", sequence: 0, role: "USER", content: "你好。" }],
    captureQuality: null,
  });
  m.prepare.mockReturnValue({
    request: { input, promptVersion: "prompt" },
    inspectResponse: m.inspect,
  });
  m.claim.mockResolvedValue(null);
  m.summary.mockResolvedValue(null);
  m.response.mockResolvedValue(null);
  m.inspect.mockReturnValue({
    state: "VALIDATED_CANDIDATE",
    inspection: {
      ok: true,
      profile: {
        score: null,
        eligibleForRewards: false,
        dimensions: {},
        feedback: [],
      },
    },
  });
});
afterEach(() => vi.unstubAllEnvs());
function saved() {
  m.claim.mockResolvedValue({
    version: JOURNEY_QUALITY_CANDIDATE_VERSION,
    userId: "admin",
    attemptId: "own",
    requestHash: createHash("sha256").update(input).digest("hex"),
  });
  m.response.mockResolvedValue({
    request: { input, promptVersion: "prompt" },
    result: { content: "{}", outputStatus: "complete" },
  });
}
describe("private review read boundary", () => {
  it.each(["production", "test"])(
    "does not query anything in %s",
    async (env) => {
      vi.stubEnv("NODE_ENV", env);
      await expect(getLocalJourneyQualityReview()).rejects.toThrow(
        /development/,
      );
      expect(m.admin).not.toHaveBeenCalled();
      expect(m.list).not.toHaveBeenCalled();
    },
  );
  it("authenticates before any query", async () => {
    m.admin.mockRejectedValue(new Error("denied"));
    await expect(getLocalJourneyQualityReview()).rejects.toThrow();
    expect(m.list).not.toHaveBeenCalled();
  });
  it("limits the list to admin-owned sealed pilots and 20 metadata rows", async () => {
    const view = await getLocalJourneyQualityReview();
    expect(m.list).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "admin",
          status: "SEALED",
          lesson: { slug: { in: expect.any(Array) } },
        },
        take: 20,
      }),
    );
    expect(m.attempt).toHaveBeenCalledWith("admin", "own", "lesson");
    expect(view.state).toBe("NOT_RUN");
    expect(view.profile).toBeNull();
    expect(m.response).not.toHaveBeenCalled();
  });
  it("does not resolve an ID outside the owner-scoped selection", async () => {
    expect(
      (await getLocalJourneyQualityReview("another-user-attempt")).state,
    ).toBe("ATTEMPT_UNAVAILABLE");
    expect(m.attempt).not.toHaveBeenCalled();
    expect(m.claim).not.toHaveBeenCalled();
  });
  it("shows an honest empty state without inventing data", async () => {
    m.list.mockResolvedValue([]);
    expect(await getLocalJourneyQualityReview()).toMatchObject({
      state: "EMPTY",
      turns: [],
      profile: null,
    });
    expect(m.prepare).not.toHaveBeenCalled();
  });
  it("does not reveal capture content when integrity verification fails", async () => {
    m.attempt.mockRejectedValue(new Error("hash failure"));
    expect(await getLocalJourneyQualityReview()).toMatchObject({
      state: "UNAVAILABLE",
      turns: [],
      profile: null,
    });
  });
  it("validates receipt identity and frozen request before exposing a candidate", async () => {
    saved();
    m.claim.mockResolvedValueOnce({
      version: JOURNEY_QUALITY_CANDIDATE_VERSION,
      userId: "other",
      attemptId: "own",
      requestHash: "x",
    });
    expect((await getLocalJourneyQualityReview()).state).toBe("UNAVAILABLE");
    expect(m.inspect).not.toHaveBeenCalled();
    saved();
    m.response.mockResolvedValueOnce({
      request: { input: "different", promptVersion: "prompt" },
      result: { content: "{}", outputStatus: "complete" },
    });
    expect((await getLocalJourneyQualityReview()).state).toBe("UNAVAILABLE");
    expect(m.inspect).not.toHaveBeenCalled();
  });
  it("rechecks a saved candidate locally rather than trusting an inspection file", async () => {
    saved();
    const view = await getLocalJourneyQualityReview();
    expect(view.state).toBe("VALIDATED_CANDIDATE");
    expect(view.profile?.score).toBeNull();
    expect(m.inspect).toHaveBeenCalledWith({ status: "completed", text: "{}" });
    expect(view).not.toHaveProperty("request");
    expect(view).not.toHaveProperty("raw");
  });
  it("passes the recomputed pedagogical hold to the private screen, not a disk approval", async () => {
    saved();
    const result = m.inspect();
    const pedagogy = {
      decision: "HOLD",
      studentReady: false,
      score: null,
      coverage: { clearLearnerTurns: 5, citedLearnerTurns: 3 },
    };
    m.inspect.mockReturnValue({ ...result, pedagogy });
    const view = await getLocalJourneyQualityReview();
    expect(view.pedagogy).toEqual(pedagogy);
    expect(view.state).toBe("VALIDATED_CANDIDATE");
    expect(view.profile?.score).toBeNull();
  });
  it("reads the evidence transport with its own inspector, retaining the old reader for old data", async () => {
    saved();
    const evidenceInput = '{"attemptId":"own","transportVersion":"evidence"}';
    m.claim.mockResolvedValue({
      version: JOURNEY_QUALITY_CANDIDATE_VERSION,
      userId: "admin",
      attemptId: "own",
      requestHash: createHash("sha256").update(evidenceInput).digest("hex"),
    });
    m.response.mockResolvedValue({
      request: { input: evidenceInput, promptVersion: "evidence" },
      result: { content: "{}", outputStatus: "complete" },
    });
    m.evidencePrepare.mockReturnValue({
      request: { input: evidenceInput, promptVersion: "evidence" },
      inspectResponse: m.evidenceInspect,
    });
    m.evidenceInspect.mockReturnValue({
      state: "REJECTED_CANDIDATE",
      inspection: {
        ok: false,
        issues: [{ code: "WRONG_LEARNER_EVIDENCE_OWNER" }],
      },
    });
    const view = await getLocalJourneyQualityReview();
    expect(view.issues).toEqual(["WRONG_LEARNER_EVIDENCE_OWNER"]);
    expect(m.evidenceInspect).toHaveBeenCalledOnce();
    expect(m.inspect).not.toHaveBeenCalled();
  });
  it("rejects invented summaries and only reads this owner's metered usage", async () => {
    saved();
    m.summary.mockResolvedValueOnce({
      reviewKey: "wrong",
      state: "VALIDATED_CANDIDATE",
      usageLogId: "usage",
    });
    expect((await getLocalJourneyQualityReview()).state).toBe("UNAVAILABLE");
    expect(m.usage).not.toHaveBeenCalled();
    m.summary.mockResolvedValue({
      reviewKey: key,
      state: "VALIDATED_CANDIDATE",
      usageLogId: "usage",
    });
    m.usage.mockResolvedValue({
      model: "test",
      inputTokens: 100,
      outputTokens: 50,
      estimatedCostUsd: 0.001,
    });
    expect((await getLocalJourneyQualityReview()).usage?.estimatedCostUsd).toBe(
      0.001,
    );
    expect(m.usage).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "usage",
          userId: "admin",
          experience: "LESSON_REFLECTION",
        },
      }),
    );
  });
  it("does not disguise a metering failure as success", async () => {
    saved();
    m.summary.mockResolvedValue({
      reviewKey: key,
      state: "STORAGE_OR_METERING_FAILED",
      usageLogId: null,
    });
    expect((await getLocalJourneyQualityReview()).state).toBe(
      "STORAGE_OR_METERING_FAILED",
    );
  });
  it("exposes rejection codes, not unvalidated grades or provider error bodies", async () => {
    saved();
    m.inspect.mockReturnValue({
      state: "REJECTED_CANDIDATE",
      inspection: {
        ok: false,
        issues: [{ code: "MAXIMUM_WITH_UNRESOLVED_ERROR" }],
      },
    });
    const view = await getLocalJourneyQualityReview();
    expect(view.profile).toBeNull();
    expect(view.issues).toEqual(["MAXIMUM_WITH_UNRESOLVED_ERROR"]);
  });
});
