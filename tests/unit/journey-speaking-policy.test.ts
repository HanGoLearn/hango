import { describe, expect, it } from "vitest";
import {
  buildJourneySpeakingPolicy,
  buildJourneyLanguageHelpInstruction,
  explicitlyEndsJourneySpeaking,
  journeySpeakingPhase,
} from "@/lib/journey-speaking-policy";
import { buildRealtimeSystemPrompt } from "@/lib/ai-context";
import {
  buildRealtimeClosingInstructions,
  buildRealtimeTurnInstructions,
} from "@/lib/han-realtime";
import {
  JOURNEY_BANK_VERSION,
  type JourneySpeakingBanks,
} from "@/lib/content/journey-speaking-bank-contract";

const rolePlay = {
  aiRole: "classmate",
  learnerRole: "student",
  scenarioContext: "First day at school",
  objective: "Introduce yourself",
  lessonHskLevel: 1,
  lessonVocabulary: ["你好", "叫", "名字"],
  lessonGrammar: ["Subject + 叫 + Name"],
};

describe("Journey Speaking policy", () => {
  it.each([
    ["No entendí lo que dijiste, explícamelo", "English", "Spanish"],
    ["I don't understand what you said", "Spanish", "English"],
    ["这句话什么意思？", "Spanish", "Spanish"],
    ["¿Puedes decirlo en español?", "English", "Spanish"],
    ["Please explain in English", "Spanish", "English"],
  ] as const)("pauses immersion for %s", (latest, fallback, language) => {
    const instruction = buildJourneyLanguageHelpInstruction(latest, fallback);
    expect(instruction).toContain(`Answer in ${language}`);
    expect(instruction).toContain("Do NOT");
    expect(instruction).toContain("append a Mandarin question");
  });
  it("does not treat an ordinary Mandarin practice reply as a help request", () => {
    expect(
      buildJourneyLanguageHelpInstruction("我叫Ana。我喜欢猫。", "Spanish"),
    ).toBeNull();
  });
  it("keeps a pending comprehension request in Spanish at closing", () => {
    const prompt = buildRealtimeClosingInstructions(
      rolePlay,
      [{ role: "user", content: "这句话什么意思？" }],
      undefined,
      "Spanish",
    );
    expect(prompt).toContain("Answer in Spanish");
    expect(prompt).toContain("HSK 1");
  });
  it("keeps lesson difficulty and grammar constraints even with resolved banks", () => {
    const banks: JourneySpeakingBanks = {
      version: JOURNEY_BANK_VERSION,
      lessonId: "lesson",
      lessonSlug: "first",
      openingLine: "你好",
      rationale: "Meet a classmate",
      phraseBank: [],
      reviewIssues: [],
      core: { vocabulary: [], grammar: [] },
      support: { vocabulary: [], grammar: [] },
      extension: { vocabulary: [], grammar: [] },
    };
    const prompt = buildRealtimeTurnInstructions(
      "English",
      rolePlay,
      null,
      "No entiendo",
      null,
      "PRACTICE",
      "direct",
      [],
      null,
      "practice",
      banks,
    );
    expect(prompt).toContain("HSK 1");
    expect(prompt).toContain("Subject + 叫 + Name");
    expect(prompt).toContain("SERVER-RESOLVED JOURNEY BANKS");
    expect(prompt).toContain("Answer in Spanish");
    expect(prompt).toContain("THEMATIC ANCHOR");
    expect(prompt).toContain("not a compulsory production checklist");
  });
  it.each([75_000, 115_000, 195_000, 255_000])(
    "prepares inside the %s window",
    (duration) => {
      expect(journeySpeakingPhase(duration - 20_001, duration)).toBe(
        "practice",
      );
      expect(journeySpeakingPhase(duration - 20_000, duration)).toBe(
        "preparing-close",
      );
      expect(journeySpeakingPhase(duration, duration)).toBe("preparing-close");
    },
  );
  it.each([
    "Quiero terminar la conversación.",
    "Terminemos aquí",
    "I want to end this session.",
    "Let's stop here",
    "我想结束聊天。",
    "今天就聊到这里吧。",
  ])("respects an unambiguous exit: %s", (text) => {
    expect(explicitlyEndsJourneySpeaking(text)).toBe(true);
  });
  it.each([
    "再见",
    "再见是什么意思？",
    "Quiero pronunciar ‘quiero terminar’",
    "¿Cómo digo terminar la conversación?",
    "I don't want to end this session",
    "我不想结束聊天。",
    "Hola",
  ])(
    "does not mistake practice, a question or negation for exit: %s",
    (text) => {
      expect(explicitlyEndsJourneySpeaking(text)).toBe(false);
    },
  );
  it("uses the same learning contract in the session and every direct Journey turn", () => {
    const learner = {
      level: "BEGINNER" as const,
      explanationLanguage: "ES" as const,
    };
    const session = buildRealtimeSystemPrompt(
      learner,
      { rolePlay, speakingSurface: "JOURNEY" },
      "PRACTICE",
    );
    const turn = buildRealtimeTurnInstructions(
      "Spanish",
      rolePlay,
      null,
      "我是老师。",
      null,
      "PRACTICE",
      "direct",
      [],
      null,
      "practice",
    );
    for (const prompt of [session, turn]) {
      expect(prompt).toContain(buildJourneySpeakingPolicy());
      expect(prompt).not.toContain("Use ONLY words and grammar already");
      expect(prompt).not.toContain("unused lesson vocabulary or grammar");
      expect(prompt).not.toContain("they have not yet attempted");
      expect(prompt).toContain("not compulsory repetition");
      expect(prompt).not.toContain("in this exact order: Context");
      expect(prompt).not.toContain(
        "Stay strictly on the topic of learning Mandarin Chinese and this lesson",
      );
    }
    const closingPhase = buildRealtimeTurnInstructions(
      "Spanish",
      rolePlay,
      null,
      "你叫什么名字？",
      null,
      "PRACTICE",
      "direct",
      [],
      null,
      "preparing-close",
    );
    expect(closingPhase).toContain(
      "Introduce NO new topic, vocabulary, practice target or question",
    );
    expect(closingPhase).toContain("takes precedence");
  });
  it("leaves non-Journey products on their separate contracts", () => {
    for (const speakingSurface of ["SPEAKING_LAB", "PLACEMENT"] as const) {
      const session = buildRealtimeSystemPrompt(
        { level: "BEGINNER", explanationLanguage: "ES" },
        { rolePlay, speakingSurface },
        "PRACTICE",
      );
      expect(session).not.toContain("JOURNEY LEARNING CONTRACT");
      expect(session).toContain("Use ONLY words and grammar already");
    }
    expect(buildRealtimeTurnInstructions("Spanish", rolePlay)).not.toContain(
      "JOURNEY LEARNING CONTRACT",
    );
    expect(
      buildRealtimeSystemPrompt(
        { level: "BEGINNER", explanationLanguage: "ES" },
        {},
        "TUTOR",
      ),
    ).not.toContain("JOURNEY LEARNING CONTRACT");
  });
  it("bases the goodbye on real dialogue rather than presumed success", () => {
    const closing = buildRealtimeClosingInstructions(rolePlay, [
      { role: "user", content: "你叫什么名字？" },
    ]);
    expect(closing).toContain("你叫什么名字");
    expect(closing).toContain("answer it briefly first");
    expect(closing).toContain("not proof that the objective was achieved");
    expect(closing).toContain("Never confirm an order, agreement, identity");
    expect(closing).toContain("no final question");
    expect(
      buildRealtimeClosingInstructions({
        ...rolePlay,
        closingLine: "谢谢，再见。",
      }),
    ).toContain('Output exactly "谢谢，再见。"');
  });
});
