import { describe, expect, it } from "vitest";
import {
  assessHanTranscript,
  assessMandarinRolePlayTranscript,
  buildHanSttPrompt,
  buildRealtimeSttConfig,
  confidenceFromLogprobs,
  normalizeHanTranscript,
  transcriptHintsFromContext,
} from "@/lib/speech/transcript-quality";

describe("Han STT language constraints", () => {
  it("shows the bare ai regression as a Chinese character", () => {
    expect(normalizeHanTranscript("ai")).toBe("爱");
    expect(normalizeHanTranscript("Ay.")).toBe("爱");
    expect(assessHanTranscript("Ahí")).toEqual({
      ok: true,
      transcript: "爱",
    });
  });

  it("repairs the reported 爱情 homophones inside a Spanish sentence", () => {
    expect(
      normalizeHanTranscript(
        "¿Cómo se pronuncia la palabra IT? No, me refiero a ahí, chin.",
      ),
    ).toBe("¿Cómo se pronuncia la palabra 爱情? No, me refiero a 爱情.");
    expect(normalizeHanTranscript("ài qíng")).toBe("爱情");
  });

  it("uses the selected lesson vocabulary to display pinyin as hanzi", () => {
    const hints = transcriptHintsFromContext({
      selectedVocabulary: {
        chineseForm: "商店",
        pinyin: "shāng diàn",
        meaning: "shop",
      },
    });

    expect(normalizeHanTranscript("Quiero decir shang dian", hints)).toBe(
      "Quiero decir 商店",
    );
  });

  it("accepts a full Spanish sentence outside role-play", () => {
    expect(
      assessHanTranscript("Quiero practicar una frase en mandarín."),
    ).toEqual({
      ok: true,
      transcript: "Quiero practicar una frase en mandarín.",
    });
  });

  it("accepts spoken Mandarin characters outside role-play", () => {
    expect(assessHanTranscript("我想学习中文")).toEqual({
      ok: true,
      transcript: "我想学习中文",
    });
  });

  it("accepts only sinogram transcriptions inside Speaking role-play", () => {
    expect(assessMandarinRolePlayTranscript("我想学习中文")).toEqual({
      ok: true,
      transcript: "我想学习中文",
    });
    expect(assessMandarinRolePlayTranscript("ni hao")).toEqual({
      ok: true,
      transcript: "你好",
    });
    expect(
      assessMandarinRolePlayTranscript("Quiero practicar mandarín"),
    ).toEqual({
      ok: false,
      reason: "unsupported_language",
    });
    expect(assessMandarinRolePlayTranscript("你好 hola")).toEqual({
      ok: false,
      reason: "unsupported_language",
    });
  });

  it.each(["ฉันอยากเรียนภาษาจีน", "중국어를 배우고 싶어요"])(
    "rejects an implausible unsupported-language transcript: %s",
    (transcript) => {
      expect(assessHanTranscript(transcript)).toEqual({
        ok: false,
        reason: "unsupported_language",
      });
    },
  );

  it("rejects low-confidence text even when its alphabet is plausible", () => {
    expect(assessHanTranscript("unreliable words", 0.05)).toEqual({
      ok: false,
      reason: "low_confidence",
    });
  });

  it("converts token log probabilities into a bounded confidence", () => {
    expect(
      confidenceFromLogprobs([
        { logprob: Math.log(0.8) },
        { logprob: Math.log(0.2) },
      ]),
    ).toBeCloseTo(0.4);
    expect(confidenceFromLogprobs(undefined)).toBeNull();
  });

  it("configures every realtime mode with a language-aware prompt", () => {
    const chat = buildRealtimeSttConfig("han-multilingual");
    const rolePlay = buildRealtimeSttConfig("mandarin", ["你好", "谢谢"]);

    expect(chat).not.toHaveProperty("language");
    expect(chat.prompt).toContain("Spanish");
    expect(chat.prompt).toContain("English");
    expect(chat.prompt).toContain("Mandarin Chinese");
    expect(chat.prompt).not.toContain("爱情");
    expect(chat.prompt).toContain("Simplified Chinese characters");
    expect(rolePlay.language).toBe("zh");
    expect(rolePlay.prompt).toContain("普通话");
    expect(rolePlay.prompt).toContain("你好、谢谢");
    expect(chat.prompt).toContain("never infer a common beginner phrase");
    expect(chat.prompt).not.toContain("ni hao → 你好");
    expect(rolePlay.prompt).toContain("不能作为音频中出现了该词的证据");
  });

  it("gives recorded Mandarin a dedicated Mandarin-only hint", () => {
    const prompt = buildHanSttPrompt("mandarin");
    expect(prompt).toContain("普通话");
    expect(prompt).not.toContain("常见初学者表达包括");
    expect(prompt).toContain("韩语");
    expect(prompt).toContain("泰语");
  });
});
