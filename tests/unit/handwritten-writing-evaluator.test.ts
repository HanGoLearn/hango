import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  serverEnv: { OPENAI_API_KEY: "test-key" },
}));

import { evaluateHandwrittenWriting } from "@/lib/handwritten-writing-evaluator";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("evaluateHandwrittenWriting", () => {
  it("uses one structured vision call and keeps the internal transcription out of feedback", async () => {
    const rawEvaluation = {
      readable: true,
      reason: null,
      transcription: "我家有[?]口人。",
      legibilityScore: 80,
      problemCharacters: [
        { character: "四", issue: "The inner strokes are unclear." },
      ],
      cohesionNotes: null,
      scores: {
        topicFulfillment: 90,
        sentenceConstruction: 70,
        grammar: 80,
        vocabulary: 90,
        clarity: 100,
        cohesion: null,
        naturalness: null,
        contentDepth: null,
        lexicalPrecision: null,
        organization: null,
        style: null,
      },
      correctedVersion: "我家有四口人。",
      errors: [],
      overallNotes: "Clear basic writing.",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ output_text: JSON.stringify(rawEvaluation) }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const evaluated = await evaluateHandwrittenWriting(
      "user-1",
      "BASIC",
      "FAMILY",
      [{ mimeType: "image/jpeg", bytes: new Uint8Array([1, 2, 3]).buffer }],
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestBody = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(requestBody.model).toBe("gpt-5-mini");
    expect(requestBody.store).toBe(false);
    expect(requestBody.input[0].content).toHaveLength(2);
    expect(requestBody.input[0].content[1].detail).toBe("high");
    expect(evaluated.transcription).toBe("我家有[?]口人。");
    expect(evaluated.result.readable).toBe(true);
    if (evaluated.result.readable) {
      expect(evaluated.result.evaluation.overallScore).toBe(83);
      expect(evaluated.result.evaluation.characterCount).toBe(6);
      expect(evaluated.result.evaluation).not.toHaveProperty("transcription");
    }
  });

  it("returns a retake reason without scores when the photos are unreadable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            readable: false,
            reason: "The second page is blurred.",
            transcription: null,
            legibilityScore: null,
            problemCharacters: [],
            cohesionNotes: null,
            scores: Object.fromEntries(
              [
                "topicFulfillment",
                "sentenceConstruction",
                "grammar",
                "vocabulary",
                "clarity",
                "cohesion",
                "naturalness",
                "contentDepth",
                "lexicalPrecision",
                "organization",
                "style",
              ].map((key) => [key, null]),
            ),
            correctedVersion: null,
            errors: [],
            overallNotes: null,
          }),
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const evaluated = await evaluateHandwrittenWriting(
      "user-1",
      "ADVANCED",
      "ROUTINE",
      [{ mimeType: "image/jpeg", bytes: new Uint8Array([1]).buffer }],
    );

    expect(evaluated.result).toEqual({
      readable: false,
      reason: "The second page is blurred.",
    });
    expect(evaluated.transcription).toBeNull();
  });
});
