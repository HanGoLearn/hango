import { describe, expect, it } from "vitest";
import { buildSpeakingHelp } from "@/lib/speaking-help";

describe("buildSpeakingHelp", () => {
  it("uses lesson-authored Chinese, pinyin, and English for the learner's role", () => {
    const help = buildSpeakingHelp({
      learnerRole: "Customer",
      vocabulary: [{ chineseForm: "菜单", pinyin: "càidān", meaning: "menu" }],
      grammar: [
        {
          name: "A-not-A questions",
          structure: "adjective + 不 + adjective",
          communicationPurpose: "Ask a yes-or-no question.",
          examples: [
            {
              chineseText: "这个辣不辣？",
              pinyin: "Zhège là bu là?",
              translation: "Is this spicy?",
            },
          ],
        },
      ],
      dialogues: [
        {
          lines: [
            {
              chineseText: "请问，有菜单吗？",
              pinyin: "Qǐngwèn, yǒu càidān ma?",
              translation: "Excuse me, do you have a menu?",
              speaker: { name: "Li Ming", role: "Customer" },
            },
            {
              chineseText: "有，请看。",
              pinyin: "Yǒu, qǐng kàn.",
              translation: "Yes, here you are.",
              speaker: { name: "Waiter", role: "Waiter" },
            },
          ],
        },
      ],
    });

    expect(help.vocabulary[0]).toEqual({
      chineseForm: "菜单",
      pinyin: "càidān",
      meaning: "menu",
    });
    expect(help.questions[0]).toEqual({
      chinese: "请问，有菜单吗？",
      pinyin: "Qǐngwèn, yǒu càidān ma?",
      english: "Excuse me, do you have a menu?",
    });
    expect(help.grammar[0]!.example?.pinyin).toBe("Zhège là bu là?");
  });

  it("falls back to authored grammar and dialogue questions when needed", () => {
    const help = buildSpeakingHelp({
      learnerRole: "Guest",
      vocabulary: [],
      grammar: [],
      dialogues: [
        {
          lines: [
            {
              chineseText: "您有预订吗？",
              pinyin: "Nín yǒu yùdìng ma?",
              translation: "Do you have a reservation?",
              speaker: { name: "Receptionist", role: "Receptionist" },
            },
          ],
        },
      ],
    });

    expect(help.questions).toHaveLength(1);
    expect(help.questions[0]!.chinese).toBe("您有预订吗？");
  });
});
