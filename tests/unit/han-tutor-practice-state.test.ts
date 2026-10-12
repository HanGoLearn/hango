import { describe, expect, it } from "vitest";
import {
  advancePronunciationPractice,
  buildRealtimeTurnInstructions,
  rememberTutorPronunciationResponse,
} from "@/lib/han-realtime";
import {
  deriveHanTutorSessionPreferences,
  resolveHanTutorConversationLanguage,
} from "@/lib/han-tutor-session";

describe("Han Tutor authoritative pronunciation state", () => {
  it.each(["Spanish", "English"] as const)(
    "keeps %s when repeating 吗 with question punctuation",
    (language) => {
      const state = rememberTutorPronunciationResponse(
        "Escucha 吗. Repite: 吗",
        null,
        language,
      );
      for (const attempt of ["吗", "吗?", "吗？", "ma?"]) {
        const result = advancePronunciationPractice(
          attempt,
          [],
          state,
          language,
        );
        expect(result.state).toMatchObject({
          target: "吗",
          explanationLanguage: language,
        });
        expect(result.progress).not.toBeNull();
        expect(
          resolveHanTutorConversationLanguage(
            [attempt],
            language,
            deriveHanTutorSessionPreferences([]),
            {
              latestOnly: true,
              latestIsPronunciationAttempt: Boolean(result.state),
            },
          ),
        ).toBe(language);
      }
    },
  );

  it("never replaces active 吗 with a mistaken 妈 in Han's reply", () => {
    const state = rememberTutorPronunciationResponse(
      "Repeat: 吗",
      null,
      "English",
    );
    const unchanged = rememberTutorPronunciationResponse(
      "Ahora repite: 妈",
      state,
      "English",
    );
    expect(unchanged).toEqual(state);
    const result = advancePronunciationPractice(
      "妈?",
      [{ role: "assistant", content: "Repite: 妈" }],
      unchanged,
    );
    expect(result.progress).toMatchObject({
      target: "吗",
      similarity: 0,
      status: "retry",
    });
    const instruction = buildRealtimeTurnInstructions(
      "English",
      undefined,
      result.progress,
      "妈?",
      null,
      "TUTOR",
      "direct",
      [],
      result.state,
    );
    expect(instruction).toContain('exact target = "吗"');
    expect(instruction).toContain("ma (neutral tone, question particle)");
    expect(instruction).toContain("never interchangeable");
  });

  it("records the exact learner request before Han can substitute a homophone", () => {
    const requested = advancePronunciationPractice(
      "Quiero practicar la pronunciación de 吗",
      [],
      null,
      "Spanish",
    );
    expect(requested.state).toMatchObject({
      target: "吗",
      attempts: 0,
      awaitingAttempt: false,
    });
    expect(
      rememberTutorPronunciationResponse(
        "Repite: 妈",
        requested.state,
        "Spanish",
      ),
    ).toEqual(requested.state);
  });

  it("requires a clearly announced next target after acceptance", () => {
    const state = rememberTutorPronunciationResponse(
      "Repite: 吧",
      null,
      "Spanish",
    );
    const closed = advancePronunciationPractice("吧", [], state).state;
    expect(closed?.completed).toBe(true);
    expect(
      rememberTutorPronunciationResponse("Repite: 妈", closed, "Spanish"),
    ).toEqual(closed);
    expect(
      rememberTutorPronunciationResponse(
        "Ahora tú, repite: 妈",
        closed,
        "Spanish",
      ),
    ).toEqual(closed);
    const next = rememberTutorPronunciationResponse(
      "La siguiente palabra es 吗. Repite: 吗",
      closed,
      "Spanish",
    );
    expect(next).toMatchObject({ target: "吗", attempts: 0, completed: false });
    expect(
      rememberTutorPronunciationResponse("Repite: 吗", next, "Spanish"),
    ).toMatchObject({ target: "吗" });
  });

  it("pauses a drill for a real meaning or grammar question", () => {
    const state = rememberTutorPronunciationResponse(
      "Repeat: 吗",
      null,
      "Spanish",
    );
    for (const message of [
      "¿Qué significa eso?",
      "What does that mean?",
      "什么意思？",
      "Quiero entender la estructura 被",
      "Explain this grammar structure",
      "Explícame la estructura",
    ]) {
      expect(advancePronunciationPractice(message, [], state)).toEqual({
        state: null,
        progress: null,
      });
    }
    expect(
      buildRealtimeTurnInstructions(
        "Spanish",
        undefined,
        null,
        "¿Qué significa eso?",
        null,
        "TUTOR",
        "direct",
        [],
        state,
      ),
    ).toContain('previously established study item is "吗"');
    const newMeaning = buildRealtimeTurnInstructions(
      "Spanish",
      undefined,
      null,
      "¿Qué significa 被?",
      null,
      "TUTOR",
      "direct",
      [],
      state,
    );
    expect(newMeaning).not.toContain("PAUSED TUTOR PRACTICE");
    expect(newMeaning).toContain("Exact learner-supplied Mandarin: 被");
  });

  it("keeps a long question-shaped Mandarin target as practice and accepts a first chunk", () => {
    const target = "你明天想不想和朋友一起去电影院看电影";
    const requested = advancePronunciationPractice(
      `Ayúdame a pronunciar ${target}`,
      [],
      null,
      "Spanish",
    ).state;
    const chunk = rememberTutorPronunciationResponse(
      `La frase es ${target}. Primero repite: 你明天想不想`,
      requested,
      "Spanish",
    );
    expect(chunk).toMatchObject({ target: "你明天想不想", fullTarget: target });
    expect(
      advancePronunciationPractice("你明天想不想？", [], chunk).progress
        ?.status,
    ).toBe("accepted");
    const closed = advancePronunciationPractice(
      "你明天想不想",
      [],
      chunk,
    ).state;
    const next = rememberTutorPronunciationResponse(
      "Ahora practiquemos el siguiente grupo. Repite: 和朋友一起",
      closed,
      "Spanish",
    );
    expect(next).toMatchObject({ target: "和朋友一起", fullTarget: target });
    expect(
      rememberTutorPronunciationResponse(
        "La siguiente palabra es 妈. Repite: 妈",
        closed,
        "Spanish",
      ),
    ).toEqual(closed);
    const question = rememberTutorPronunciationResponse(
      "Repite: 你明天可以和我一起去吗",
      null,
      "English",
    );
    expect(
      advancePronunciationPractice("你明天可以和我一起去吗？", [], question)
        .progress?.status,
    ).toBe("accepted");
  });

  it("clarifies untoned ba rather than selecting 吧 or asserting a tone", () => {
    const request = "Me gustaría entender cómo es la pronunciación del ba.";
    const pending = advancePronunciationPractice(request, [], null).state;
    expect(pending?.needsClarification).toBe(true);
    expect(
      rememberTutorPronunciationResponse(
        "Escucha 吧. Repite: 吧",
        pending,
        "Spanish",
      ),
    ).toEqual(pending);
    expect(
      advancePronunciationPractice("Me refiero a la partícula 吧", [], pending)
        .state?.target,
    ).toBe("吧");
    expect(
      advancePronunciationPractice("¿Qué significa 被?", [], pending).state,
    ).toBeNull();
    expect(
      advancePronunciationPractice("Explain the grammar of 被", [], pending)
        .state,
    ).toBeNull();
    expect(
      buildRealtimeTurnInstructions("Spanish", undefined, null, request),
    ).toContain("PRONUNCIATION TARGET CLARIFICATION");
    expect(
      buildRealtimeTurnInstructions("Spanish", undefined, null, request),
    ).toContain("吧, 八, or 把");
  });

  it("does not infer verified phonetic references for unknown targets", () => {
    const state = rememberTutorPronunciationResponse(
      "Repite: 重庆",
      null,
      "Spanish",
    );
    expect(state?.referencePinyin).toBeNull();
    expect(
      buildRealtimeTurnInstructions(
        "Spanish",
        undefined,
        null,
        "重庆",
        null,
        "TUTOR",
        "direct",
        [],
        state,
      ),
    ).toContain("No verified phonetic reference");
  });

  it("does not contaminate role-play or Companion with Tutor state", () => {
    const state = rememberTutorPronunciationResponse(
      "Repite: 吗",
      null,
      "Spanish",
    );
    expect(
      buildRealtimeTurnInstructions(
        "Spanish",
        undefined,
        null,
        "吗",
        null,
        "PRACTICE",
        "direct",
        [],
        state,
      ),
    ).not.toContain("AUTHORITATIVE TUTOR PRACTICE STATE");
    expect(
      buildRealtimeTurnInstructions(
        "Spanish",
        {
          aiRole: "Waiter",
          learnerRole: "Customer",
          scenarioContext: "Restaurant",
          objective: "Order tea",
        },
        null,
        "吗",
        null,
        "TUTOR",
        "direct",
        [],
        state,
      ),
    ).not.toContain("AUTHORITATIVE TUTOR PRACTICE STATE");
  });

  it("respects explicit language changes without replaying previous Chinese attempts", () => {
    const state = rememberTutorPronunciationResponse(
      "Repite: 吗",
      null,
      "Spanish",
    );
    expect(
      advancePronunciationPractice("Answer in English", [], state),
    ).toEqual({ state, progress: null });
    const messages = ["Quiero practicar 吗", "吗?", "Answer in English"];
    expect(
      resolveHanTutorConversationLanguage(
        messages,
        "Spanish",
        deriveHanTutorSessionPreferences(messages),
        { latestOnly: true, latestIsPronunciationAttempt: true },
      ),
    ).toBe("English");
    expect(
      resolveHanTutorConversationLanguage(
        [...messages, "What does it mean?"],
        "English",
        deriveHanTutorSessionPreferences(messages),
        { latestOnly: true },
      ),
    ).toBe("English");
  });

  it("lets a substantive new Chinese conversation leave a completed drill", () => {
    const state = rememberTutorPronunciationResponse(
      "Repite: 吗",
      null,
      "Spanish",
    );
    const closed = advancePronunciationPractice("吗", [], state).state;
    const next = advancePronunciationPractice("今天我想去公园", [], closed);
    expect(next.state).toBeNull();
    expect(
      resolveHanTutorConversationLanguage(
        ["今天我想去公园"],
        "Spanish",
        deriveHanTutorSessionPreferences([]),
        { latestOnly: true },
      ),
    ).toBe("Chinese");
  });
});
