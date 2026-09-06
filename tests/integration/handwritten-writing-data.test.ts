import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import type { HandwrittenSubmissionResult } from "@/lib/handwritten-writing";

// evaluateHandwrittenWriting talks to OpenAI's Responses API directly (not
// through getAiProvider()/MockAiProvider), so it's mocked at that boundary
// instead - this file's own job (dedupe, rate limiting, persistence) is what
// these tests exercise, not the vision call itself (see
// tests/unit/handwritten-writing-evaluator.test.ts for that).
const { evaluateHandwrittenWritingMock } = vi.hoisted(() => ({
  evaluateHandwrittenWritingMock: vi.fn(),
}));
vi.mock("@/lib/handwritten-writing-evaluator", () => ({
  evaluateHandwrittenWriting: evaluateHandwrittenWritingMock,
}));

const { submitHandwrittenWriting, HandwrittenRateLimitError } = await import(
  "@/lib/handwritten-writing-data"
);

const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  evaluateHandwrittenWritingMock.mockReset();
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  await db.learnerProfile.create({ data: { userId: user.id } });
  return user;
}

function image(byte: number): { mimeType: string; bytes: ArrayBuffer } {
  return { mimeType: "image/jpeg", bytes: new Uint8Array([byte]).buffer };
}

function readableEvaluation(
  transcription = "我家有四口人。",
): { result: HandwrittenSubmissionResult; transcription: string } {
  return {
    transcription,
    result: {
      readable: true,
      evaluation: {
        overallScore: 83,
        characterCount: 6,
        targetRange: "About 60–90 Chinese characters",
        dimensions: [],
        problemCharacters: [],
        cohesionNotes: null,
        correctedVersion: "我家有四口人。",
        errors: [],
        overallNotes: "Clear basic writing.",
        strokeOrderDisclaimer:
          "Stroke order cannot be verified from a static photo; this score assesses only the final visible result.",
      },
    },
  };
}

function unreadableEvaluation(
  reason = "The photo is too blurry to read.",
): { result: HandwrittenSubmissionResult; transcription: null } {
  return { transcription: null, result: { readable: false, reason } };
}

describe("Handwritten writing submission (2026-09-05, integration, real database, mocked vision evaluator)", () => {
  it("persists a writing attempt and grades it when the photos are readable", async () => {
    const user = await createTestUser(
      `handwritten-readable-${Date.now()}@hango.dev`,
    );
    evaluateHandwrittenWritingMock.mockResolvedValueOnce(
      readableEvaluation(),
    );

    const result = await submitHandwrittenWriting(user.id, "BASIC", "FAMILY", [
      image(1),
    ]);

    expect(result.readable).toBe(true);
    const attempts = await db.writingAttempt.findMany({
      where: { userId: user.id },
    });
    expect(attempts).toHaveLength(1);
    expect(attempts[0]!.submittedResponse).toBe("我家有四口人。");
    expect(attempts[0]!.submittedAt).not.toBeNull();
    expect(attempts[0]!.correctedVersion).toBe("我家有四口人。");
  });

  it("does not persist anything when the photos aren't readable", async () => {
    const user = await createTestUser(
      `handwritten-unreadable-${Date.now()}@hango.dev`,
    );
    evaluateHandwrittenWritingMock.mockResolvedValueOnce(
      unreadableEvaluation(),
    );

    const result = await submitHandwrittenWriting(user.id, "BASIC", "FAMILY", [
      image(1),
    ]);

    expect(result).toEqual({
      readable: false,
      reason: "The photo is too blurry to read.",
    });
    expect(
      await db.writingAttempt.count({ where: { userId: user.id } }),
    ).toBe(0);
  });

  it("shares one in-flight evaluation across identical accidental duplicate submissions", async () => {
    const user = await createTestUser(
      `handwritten-inflight-${Date.now()}@hango.dev`,
    );
    evaluateHandwrittenWritingMock.mockResolvedValueOnce(
      readableEvaluation(),
    );
    const images = [image(2)];

    const [first, second] = await Promise.all([
      submitHandwrittenWriting(user.id, "BASIC", "FAMILY", images),
      submitHandwrittenWriting(user.id, "BASIC", "FAMILY", images),
    ]);

    expect(first).toBe(second);
    expect(evaluateHandwrittenWritingMock).toHaveBeenCalledTimes(1);
    expect(
      await db.writingAttempt.count({ where: { userId: user.id } }),
    ).toBe(1);
  });

  it("reuses a just-finished result for an identical submission instead of calling the evaluator again", async () => {
    const user = await createTestUser(
      `handwritten-dedupe-${Date.now()}@hango.dev`,
    );
    evaluateHandwrittenWritingMock.mockResolvedValueOnce(
      readableEvaluation(),
    );
    const images = [image(3)];

    const first = await submitHandwrittenWriting(
      user.id,
      "BASIC",
      "FAMILY",
      images,
    );
    const second = await submitHandwrittenWriting(
      user.id,
      "BASIC",
      "FAMILY",
      images,
    );

    expect(second).toEqual(first);
    expect(evaluateHandwrittenWritingMock).toHaveBeenCalledTimes(1);
  });

  it("rate-limits submissions after 4 in the window", async () => {
    const user = await createTestUser(
      `handwritten-ratelimit-${Date.now()}@hango.dev`,
    );

    for (let i = 0; i < 4; i++) {
      evaluateHandwrittenWritingMock.mockResolvedValueOnce(
        unreadableEvaluation(`attempt ${i}`),
      );
      await submitHandwrittenWriting(user.id, "BASIC", "FAMILY", [
        image(10 + i),
      ]);
    }

    await expect(
      submitHandwrittenWriting(user.id, "BASIC", "FAMILY", [image(99)]),
    ).rejects.toBeInstanceOf(HandwrittenRateLimitError);
  });
});
