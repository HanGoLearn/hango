import { describe, expect, it } from "vitest";
import {
  buildSpeakingLearnerIdentityMemory,
  isIntroductionSpeakingScene,
} from "@/lib/speaking-scene";
import {
  buildRealtimeOpeningInstructions,
  buildRealtimeOpeningTurnGuard,
  buildRealtimeTurnInstructions,
} from "@/lib/han-realtime";
import { buildRealtimeSystemPrompt } from "@/lib/ai-context";

const spanishScene = {
  aiRole: "Nuevo compañero de clase",
  learnerRole: "Estudiante",
  scenarioContext: "Conoces a un compañero por primera vez.",
  objective: "Saludar y presentarte con tu nombre.",
  lessonHskLevel: 1,
  lessonVocabulary: ["你好", "我", "叫", "老师", "学生"],
};

describe("localized Speaking introductions and session identity", () => {
  it.each([
    spanishScene,
    { aiRole: "new classmate", objective: "Exchange names." },
    { aiRole: "新同学", objective: "自我介绍" },
  ])("opens an introduction with only a greeting: $aiRole", (scene) => {
    expect(isIntroductionSpeakingScene(scene)).toBe(true);
    const guard = buildRealtimeOpeningTurnGuard(scene);
    expect(guard).toContain('Output exactly "你好。"');
    expect(guard).not.toContain("我们开始吧");
    expect(guard).not.toContain("你叫什么名字");
  });

  it("keeps the opening and session baseline consistent in Spanish", () => {
    const opening = buildRealtimeOpeningInstructions(spanishScene);
    expect(opening).toContain('Output exactly "你好。"');
    expect(opening).not.toContain("Do not output only 你好");
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      { rolePlay: spanishScene },
      "PRACTICE",
    );
    expect(prompt).toContain("genuinely a mutual introduction");
    expect(prompt).not.toContain("This is not an introduction exercise");
    expect(prompt).toContain("starting scenario frame, not evidence");
    expect(prompt).toContain("at most one short relevant question");
    expect(prompt).not.toContain("return one short relevant question");
  });

  it("does not turn other lessons or free-topic practice into a fixed introduction", () => {
    const restaurant = { aiRole: "waiter", objective: "Order noodles." };
    expect(isIntroductionSpeakingScene(restaurant)).toBe(false);
    expect(
      isIntroductionSpeakingScene({
        objective: "Debatir una presentación académica.",
      }),
    ).toBe(false);
    expect(buildRealtimeOpeningTurnGuard(restaurant)).toContain("欢迎光临");
    expect(
      buildRealtimeOpeningTurnGuard({ ...spanishScene, isFreeTopic: true }),
    ).toBeNull();
    expect(
      buildRealtimeOpeningTurnGuard({
        ...spanishScene,
        openingLine: "请介绍自己。",
      }),
    ).toContain('Output exactly "请介绍自己。"');
  });

  it.each([
    "我是老师。",
    "我不是学生。",
    "Soy laoshi.",
    "I am a teacher.",
    "wǒ shì lǎoshī.",
  ])(
    "retains the learner's exact occupation/status evidence: %s",
    (content) => {
      const memory = buildSpeakingLearnerIdentityMemory([
        { role: "user", content },
      ]);
      expect(memory).toContain(content.replace(/[。.]$/u, ""));
      expect(memory).toContain("not a question about your character");
      expect(memory).toContain("exact affirmative or negative meaning");
      expect(memory).toContain("never changes your own character identity");
    },
  );

  it.each([
    "你是老师吗？",
    "我是老师吗？",
    "Are you a teacher?",
    "How do I say 我是老师?",
    "我叫老师。",
    "我是老师的学生。",
    "我的朋友是老师。",
  ])(
    "does not infer a learner occupation from a question or a quoted name: %s",
    (content) => {
      expect(
        buildSpeakingLearnerIdentityMemory([{ role: "user", content }]),
      ).toBeNull();
    },
  );

  it("never borrows the character's self-description and carries no evidence into a fresh session", () => {
    expect(
      buildSpeakingLearnerIdentityMemory([
        { role: "assistant", content: "我是老师。" },
      ]),
    ).toBeNull();
    expect(buildSpeakingLearnerIdentityMemory([])).toBeNull();
  });

  it("keeps occupation evidence beyond the compact recent dialogue and prioritizes the new question", () => {
    const transcript = [
      { role: "user" as const, content: "我是老师。" },
      ...Array.from({ length: 10 }, () => ({
        role: "assistant" as const,
        content: "你好。",
      })),
      { role: "user" as const, content: "你叫什么名字？" },
    ];
    const instructions = buildRealtimeTurnInstructions(
      "Spanish",
      spanishScene,
      null,
      "你叫什么名字？",
      null,
      "PRACTICE",
      "direct",
      transcript,
    );
    expect(instructions).toContain(
      'LEARNER OCCUPATION/STATUS EVIDENCE: "我是老师"',
    );
    expect(instructions).toContain(
      "do not answer as if they asked whether YOU are a teacher",
    );
    expect(instructions).toContain("or ask 你是学生吗");
    expect(instructions).toContain('LATEST LEARNER TURN — "你叫什么名字？"');
    expect(instructions).toContain("The lesson objective is not a script");
    expect(instructions).toContain("never on behalf of the learner");
    expect(instructions).not.toContain("not Estudiante");
    expect(instructions).toContain("genuinely a mutual introduction");
  });

  it("does not inject role-play learner facts into Han Tutor", () => {
    const instructions = buildRealtimeTurnInstructions(
      "Spanish",
      undefined,
      null,
      "我是老师。",
      null,
      "TUTOR",
      "direct",
      [{ role: "user", content: "我是老师。" }],
    );
    expect(instructions).not.toContain("LEARNER OCCUPATION/STATUS EVIDENCE");
    expect(instructions).not.toContain("LATEST LEARNER TURN —");
  });
});
