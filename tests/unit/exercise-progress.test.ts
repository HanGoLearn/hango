import { describe, expect, it } from "vitest";
import {
  evaluateAnswer,
  findCorrectOptionId,
  parseMatchingPairs,
  toClientExercise,
  type OptionForEvaluation,
} from "@/lib/exercise-progress";

const mcOptions: OptionForEvaluation[] = [
  { id: "o1", content: "Correct", isCorrect: true },
  { id: "o2", content: "Wrong", isCorrect: false },
];

describe("evaluateAnswer", () => {
  it("grades MULTIPLE_CHOICE from the option's isCorrect flag", () => {
    expect(
      evaluateAnswer(null, mcOptions, {
        type: "MULTIPLE_CHOICE",
        optionId: "o1",
      }),
    ).toBe(true);
    expect(
      evaluateAnswer(null, mcOptions, {
        type: "MULTIPLE_CHOICE",
        optionId: "o2",
      }),
    ).toBe(false);
  });

  it("grades TRUE_FALSE the same way as MULTIPLE_CHOICE", () => {
    expect(
      evaluateAnswer(null, mcOptions, { type: "TRUE_FALSE", optionId: "o1" }),
    ).toBe(true);
  });

  it("grades FILL_IN_BLANK against the accepted list, case/whitespace-insensitive", () => {
    const correctAnswer = { accepted: ["要", " Yao "] };
    expect(
      evaluateAnswer(correctAnswer, [], { type: "FILL_IN_BLANK", text: "要" }),
    ).toBe(true);
    expect(
      evaluateAnswer(correctAnswer, [], { type: "FILL_IN_BLANK", text: "yao" }),
    ).toBe(true);
    expect(
      evaluateAnswer(correctAnswer, [], {
        type: "FILL_IN_BLANK",
        text: "不要",
      }),
    ).toBe(false);
  });

  it("grades SENTENCE_ORDERING by exact order match", () => {
    const correctAnswer = { order: ["我", "要", "宫保鸡丁"] };
    expect(
      evaluateAnswer(correctAnswer, [], {
        type: "SENTENCE_ORDERING",
        order: ["我", "要", "宫保鸡丁"],
      }),
    ).toBe(true);
    expect(
      evaluateAnswer(correctAnswer, [], {
        type: "SENTENCE_ORDERING",
        order: ["要", "我", "宫保鸡丁"],
      }),
    ).toBe(false);
  });

  it("grades MATCHING by comparing the pair sets", () => {
    const options: OptionForEvaluation[] = [
      { id: "p1", content: "我 :: I", isCorrect: true },
      { id: "p2", content: "你 :: you", isCorrect: true },
    ];
    expect(
      evaluateAnswer(null, options, {
        type: "MATCHING",
        pairs: [
          ["我", "I"],
          ["你", "you"],
        ],
      }),
    ).toBe(true);
    expect(
      evaluateAnswer(null, options, {
        type: "MATCHING",
        pairs: [
          ["我", "you"],
          ["你", "I"],
        ],
      }),
    ).toBe(false);
  });

  it("SHORT_RESPONSE is always ungraded (null)", () => {
    expect(
      evaluateAnswer(null, [], { type: "SHORT_RESPONSE", text: "anything" }),
    ).toBeNull();
  });
});

describe("findCorrectOptionId", () => {
  it("returns the id of the correct option", () => {
    expect(findCorrectOptionId(mcOptions)).toBe("o1");
  });

  it("returns null when nothing is marked correct", () => {
    expect(
      findCorrectOptionId([{ id: "o1", content: "x", isCorrect: false }]),
    ).toBeNull();
  });
});

describe("parseMatchingPairs", () => {
  it("splits ' :: '-delimited option content into left/right pairs", () => {
    const options: OptionForEvaluation[] = [
      { id: "p1", content: "我 :: I", isCorrect: true },
      { id: "p2", content: "not a pair", isCorrect: true },
    ];
    expect(parseMatchingPairs(options)).toEqual([["我", "I"]]);
  });
});

describe("toClientExercise", () => {
  const identity = <T>(items: T[]): T[] => items;

  it("strips isCorrect from MULTIPLE_CHOICE options", () => {
    const client = toClientExercise(
      {
        id: "e1",
        type: "MULTIPLE_CHOICE",
        prompt: "Pick one",
        correctAnswer: { optionIndex: 0 },
        options: mcOptions,
      },
      identity,
    );
    expect(client.options).toEqual([
      { id: "o1", content: "Correct" },
      { id: "o2", content: "Wrong" },
    ]);
    expect(client).not.toHaveProperty("correctAnswer");
  });

  it("exposes SENTENCE_ORDERING tokens without revealing the correct order via shuffle", () => {
    const client = toClientExercise(
      {
        id: "e2",
        type: "SENTENCE_ORDERING",
        prompt: "Order it",
        correctAnswer: { order: ["我", "要", "茶"] },
        options: [],
      },
      identity,
    );
    expect(client.tokens).toEqual(["我", "要", "茶"]);
  });

  it("exposes MATCHING left/right terms derived from options", () => {
    const client = toClientExercise(
      {
        id: "e3",
        type: "MATCHING",
        prompt: "Match it",
        correctAnswer: null,
        options: [
          { id: "p1", content: "我 :: I", isCorrect: true },
          { id: "p2", content: "你 :: you", isCorrect: true },
        ],
      },
      identity,
    );
    expect(client.leftTerms).toEqual(["我", "你"]);
    expect(client.rightTerms).toEqual(["I", "you"]);
  });

  it("carries hints through unchanged", () => {
    const client = toClientExercise(
      {
        id: "e4",
        type: "FILL_IN_BLANK",
        prompt: "Fill it",
        correctAnswer: { accepted: ["要"] },
        options: [],
        hints: [{ level: 1, text: "hint" }],
      },
      identity,
    );
    expect(client.hints).toEqual([{ level: 1, text: "hint" }]);
  });
});
