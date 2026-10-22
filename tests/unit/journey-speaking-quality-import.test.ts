import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { prepareImportedJourneyQualityReview } from "@/lib/journey-speaking-quality-import";
import { JOURNEY_BANK_VERSION } from "@/lib/content/journey-speaking-bank-contract";
import { JOURNEY_RUBRIC_VERSION } from "@/lib/journey-speaking-attempt-contract";
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}
const hash = (value: unknown) =>
  createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
function fixture() {
  const word = {
    id: "word",
    lessonId: "lesson",
    lessonSlug: "greetings",
    text: "叫",
    meaning: "llamarse",
    evidence: "not-observed",
  };
  const snapshot = {
    lessonId: "lesson",
    lessonSlug: "greetings",
    lessonTitle: "Saludos",
    difficulty: "BEGINNER",
    hskReference: 1,
    aiRole: "Compañero",
    learnerRole: "Tú",
    objective: "Presentarse",
    successConditions: [{ id: "name", text: "Presentarse" }],
    banks: {
      version: JOURNEY_BANK_VERSION,
      lessonId: "lesson",
      lessonSlug: "greetings",
      openingLine: "你好",
      rationale: "Saludos",
      core: { vocabulary: [word], grammar: [] },
      support: { vocabulary: [], grammar: [] },
      extension: { vocabulary: [], grammar: [] },
      phraseBank: [],
      reviewIssues: [],
    },
    assessment: { privateExerciseData: "DO_NOT_SEND" },
  };
  const turns = [
    {
      id: "a1",
      sequence: 0,
      role: "ASSISTANT",
      content: "你叫什么名字？",
      recognition: null,
    },
    {
      id: "u1",
      sequence: 1,
      role: "USER",
      content: "我叫小林。",
      recognition: null,
    },
  ];
  const quality = { pendingLearnerTurn: false, interruptedAssistant: false };
  const capture = {
    closeReason: "USER_END",
    turns: turns.map((turn) => ({
      role: turn.role === "USER" ? "user" : "assistant",
      content: turn.content,
    })),
    quality,
  };
  const pins = {
    attemptId: "attempt",
    snapshotHash: hash(snapshot),
    captureHash: hash(capture),
  };
  const data = {
    source: "HanGo Producción / Prisma Studio / read-only",
    attempt: {
      id: "attempt",
      userId: "production-owner",
      lessonId: "lesson",
      rubricVersion: JOURNEY_RUBRIC_VERSION,
      bankVersion: JOURNEY_BANK_VERSION,
      locale: "es",
      status: "SEALED",
      closeReason: "USER_END",
      snapshot,
      snapshotHash: pins.snapshotHash,
      captureHash: pins.captureHash,
      captureQuality: quality,
      turns,
    },
    originalEvaluation: {
      score: 100,
      requestCount: 4,
      status: "COMPLETE",
      usageLogId: "old-usage",
    },
  };
  return { data, pins };
}
describe("offline authorized export preparation", () => {
  it("prepares the real contract without dispatch, DB import or a new grade", () => {
    const { data, pins } = fixture();
    const result = prepareImportedJourneyQualityReview(data, pins);
    expect(result.receipt).toMatchObject({
      snapshotVerified: true,
      captureVerified: true,
      turnCount: 2,
      originalScore: 100,
      originalRequestCount: 4,
      paidRequestsExecuted: 0,
      databaseWritesExecuted: 0,
      readyForPaidDispatch: false,
    });
    expect(result.request.input).not.toContain("DO_NOT_SEND");
    expect(result.request.input).not.toContain("production-owner");
    expect(result).not.toHaveProperty("score");
  });
  it.each(["id", "snapshot", "capture"])(
    "rejects a mismatched independent %s pin",
    (key) => {
      const { data, pins } = fixture();
      if (key === "id") pins.attemptId = "other";
      if (key === "snapshot") pins.snapshotHash = "0".repeat(64);
      if (key === "capture") pins.captureHash = "0".repeat(64);
      expect(() => prepareImportedJourneyQualityReview(data, pins)).toThrow();
    },
  );
  it("rejects a modified original snapshot despite unchanged claimed hash", () => {
    const { data, pins } = fixture();
    data.attempt.snapshot.objective = "different";
    expect(() => prepareImportedJourneyQualityReview(data, pins)).toThrow(
      /snapshot integrity/,
    );
  });
  it("rejects modified original speech despite unchanged claimed hash", () => {
    const { data, pins } = fixture();
    data.attempt.turns[1]!.content = "我叫小明。";
    expect(() => prepareImportedJourneyQualityReview(data, pins)).toThrow(
      /capture integrity/,
    );
  });
  it("rejects incorrect sequence, unsealed status and incompatible version", () => {
    const { data, pins } = fixture();
    data.attempt.turns[1]!.sequence = 5;
    expect(() => prepareImportedJourneyQualityReview(data, pins)).toThrow(
      /sequence/,
    );
    const other = fixture();
    other.data.attempt.status = "ACTIVE";
    expect(() =>
      prepareImportedJourneyQualityReview(other.data, other.pins),
    ).toThrow();
    const version = fixture();
    version.data.attempt.rubricVersion = "unknown";
    expect(() =>
      prepareImportedJourneyQualityReview(version.data, version.pins),
    ).toThrow();
  });
  it("does not let the old grade condition the new judgment", () => {
    const { data, pins } = fixture();
    const first = prepareImportedJourneyQualityReview(data, pins);
    data.originalEvaluation.score = 25;
    data.originalEvaluation.requestCount = 9;
    expect(prepareImportedJourneyQualityReview(data, pins).request).toEqual(
      first.request,
    );
  });
  it("accepts JSONB key reordering without altering transcript or mutating input", () => {
    const { data, pins } = fixture();
    const reordered = JSON.parse(
      JSON.stringify(data, (key, value) =>
        key === "snapshot"
          ? Object.fromEntries(Object.entries(value).reverse())
          : value,
      ),
    );
    const before = structuredClone(reordered);
    expect(
      prepareImportedJourneyQualityReview(reordered, pins).receipt
        .snapshotVerified,
    ).toBe(true);
    expect(reordered).toEqual(before);
  });
  it("prepares evidence selection only when explicitly selected, preserving frozen legacy requests", () => {
    const { data, pins } = fixture();
    const old = prepareImportedJourneyQualityReview(data, pins);
    const current = prepareImportedJourneyQualityReview(data, pins, "evidence");
    expect(current.request.promptVersion).toBe(
      "journey-quality-evidence-review-2026-10-18-v1",
    );
    expect(current.receipt.readyForPaidDispatch).toBe(false);
    expect(
      JSON.parse(current.request.input).turns.every(
        (turn: { role: string }) => turn.role === "user",
      ),
    ).toBe(true);
    expect(prepareImportedJourneyQualityReview(data, pins).request).toEqual(
      old.request,
    );
  });
});
