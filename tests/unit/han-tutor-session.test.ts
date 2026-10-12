import { describe, expect, it } from "vitest";
import {
  buildHanTutorControlCommandInstruction,
  buildHanTutorTaskGroundingInstruction,
  deriveHanTutorSessionPreferences,
  detectHanTutorResponseLanguage,
  resolveHanTutorConversationLanguage,
} from "@/lib/han-tutor-session";

describe("Han Tutor temporary session behavior", () => {
  it("protects an uncertain word in a meaning question and pauses the drill", () => {
    const instruction =
      buildHanTutorTaskGroundingInstruction("明纲, qué es eso?");
    expect(instruction).toContain("MEANING REQUEST");
    expect(instruction).toContain("明纲");
    expect(instruction).toContain("do not silently replace");
    expect(instruction).toContain("Do not give a pronunciation-only answer");
    expect(
      buildHanTutorTaskGroundingInstruction("Pero ¿qué significa eso?"),
    ).toContain("MEANING REQUEST");
    expect(
      buildHanTutorTaskGroundingInstruction("What does that mean?"),
    ).toContain("MEANING REQUEST");
    expect(
      buildHanTutorTaskGroundingInstruction("What is your name?"),
    ).toBeNull();
  });
  it("answers types of Han as Tutor capabilities rather than inventing a tone question", () => {
    for (const question of [
      "What type of Han we can check?",
      "¿Qué tipos de Han podemos practicar?",
      "What can Han Tutor help me with?",
    ]) {
      const instruction = buildHanTutorTaskGroundingInstruction(question);
      expect(instruction).toContain("HAN TUTOR CAPABILITIES");
      expect(instruction).toContain("vocabulary");
      expect(instruction).toContain("grammar");
      expect(instruction).toContain("Do not reinterpret");
    }
    expect(
      buildHanTutorTaskGroundingInstruction(
        "What types of tones can we check?",
      ),
    ).toBeNull();
    expect(
      buildHanTutorTaskGroundingInstruction("What does 汉 mean?"),
    ).toContain("Exact learner-supplied Mandarin: 汉");
    expect(
      buildHanTutorTaskGroundingInstruction(
        "Han Tutor, explain how to pronounce nihao",
      ),
    ).toBeNull();
  });
  it("keeps Spanish across historical Mandarin repetitions in a pronunciation drill", () => {
    const messages = [
      "Quiero practicar la pronunciación de 被",
      "蛋糕",
      "蛋糕被我的小吃了。",
      "蛋糕被我的猫吃了。",
    ];
    expect(
      resolveHanTutorConversationLanguage(
        messages,
        "English",
        deriveHanTutorSessionPreferences(messages),
        { latestIsPronunciationAttempt: true },
      ),
    ).toBe("Spanish");
    expect(
      resolveHanTutorConversationLanguage(
        [...messages, "Answer in Chinese"],
        "Spanish",
        deriveHanTutorSessionPreferences(messages),
        { latestIsPronunciationAttempt: true },
      ),
    ).toBe("Chinese");
  });
  it("prioritizes a new 被 grammar request over previous answer options", () => {
    const instruction = buildHanTutorTaskGroundingInstruction(
      "Quisiera entender cómo se utiliza el 被, la estructura 被.",
      ["Las respuestas son A, 要努力工作, B, 明天会能好"],
    );
    expect(instruction).toContain("TOPIC RESET");
    expect(instruction).toContain("passive marker");
    expect(instruction).not.toContain("MULTIPLE-CHOICE EVIDENCE");
  });

  it("grounds exam follow-ups without inventing repaired options", () => {
    const instruction = buildHanTutorTaskGroundingInstruction(
      "¿Y por qué no sería la A?",
      ["Las respuestas son A, 要努力工作, B, 明天会能好"],
    );
    expect(instruction).toContain("MULTIPLE-CHOICE EVIDENCE");
    expect(instruction).toContain("Never silently repair");
    expect(instruction).toContain("Keep the answer stable");
    expect(buildHanTutorTaskGroundingInstruction("Hola")).toBeNull();
  });
  it("keeps the carrier language when a Spanish or English sentence contains Mandarin", () => {
    expect(
      detectHanTutorResponseLanguage(
        "¿Qué significa 从来 y cómo se usa?",
        "English",
      ),
    ).toBe("Spanish");
    expect(
      detectHanTutorResponseLanguage(
        "How do I use 从来 in a sentence?",
        "Spanish",
      ),
    ).toBe("English");
    expect(detectHanTutorResponseLanguage("y el Zhou Enlai", "English")).toBe(
      "Spanish",
    );
  });

  it("treats short Mandarin as practice and substantive Mandarin as conversation", () => {
    expect(detectHanTutorResponseLanguage("你好", "Spanish")).toBe("Spanish");
    expect(
      detectHanTutorResponseLanguage("你好，你叫什么名字？", "Spanish"),
    ).toBe("Chinese");
    expect(
      detectHanTutorResponseLanguage("学习汉语对我来说是很有趣的。", "English"),
    ).toBe("Chinese");
    expect(
      detectHanTutorResponseLanguage("我想喝水", "Spanish", {
        pronunciationAttempt: true,
      }),
    ).toBe("Spanish");
  });

  it("keeps language, correction, and pace preferences only in supplied session messages", () => {
    const preferences = deriveHanTutorSessionPreferences([
      "A partir de ahora háblame solo en español",
      "Corrígeme todo",
      "Habla más despacio",
    ]);

    expect(preferences).toEqual({
      language: "Spanish",
      correctionStyle: "strict",
      speechPace: "slow",
    });
    expect(deriveHanTutorSessionPreferences([])).toEqual({
      language: "auto",
      correctionStyle: "balanced",
      speechPace: "normal",
    });
  });

  it("uses the latest session preference and allows a one-turn language override", () => {
    const messages = [
      "Only speak English from now on",
      "A partir de ahora háblame solo en español",
      "Explícame 从来",
    ];
    const preferences = deriveHanTutorSessionPreferences(messages);

    expect(
      resolveHanTutorConversationLanguage(messages, "English", preferences),
    ).toBe("Spanish");
    expect(
      resolveHanTutorConversationLanguage(
        [...messages, "Answer in English: what does 从来 mean?"],
        "English",
        preferences,
      ),
    ).toBe("English");
    expect(
      resolveHanTutorConversationLanguage(
        [...messages, "Respóndeme en inglés: ¿qué significa 从来?"],
        "English",
        preferences,
      ),
    ).toBe("English");
  });

  it("turns short learner controls into narrow, non-lecture instructions", () => {
    expect(buildHanTutorControlCommandInstruction("Repítelo")).toContain(
      "exactly once",
    );
    expect(buildHanTutorControlCommandInstruction("Divide la frase")).toContain(
      "2 to 4 natural prosodic groups",
    );
    expect(
      buildHanTutorControlCommandInstruction("Compara cómo lo dije"),
    ).toContain("at most one high-confidence difference");
    expect(
      buildHanTutorControlCommandInstruction("Habla más despacio"),
    ).toContain("through behavior, not commentary");
  });
});
