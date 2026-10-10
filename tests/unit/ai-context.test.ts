import { describe, expect, it } from "vitest";
import {
  buildRealtimeSystemPrompt,
  buildMandarinStudyItemInstruction,
  buildSentenceOrderingIntegrityInstruction,
  buildSessionLevelInstruction,
  buildSystemPrompt,
  buildTranslationTargetInstruction,
  detectExplicitHskSessionLevel,
  detectHanResponseLanguage,
  findLatestExplicitHskSessionLevel,
} from "@/lib/ai-context";

describe("buildSystemPrompt", () => {
  it("treats sentence-ordering tiles as a closed set and never invents 很", () => {
    const learnerMessage =
      "¿Me ayudas a ordenar una oración? La primera palabra es di, la segunda xiaola y la tercera gaoxingdi.";
    const instruction =
      buildSentenceOrderingIntegrityInstruction(learnerMessage);
    const tutorPrompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
      learnerMessage,
    );
    const companionPrompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "PRACTICE",
      learnerMessage,
    );

    expect(instruction).toContain("fixed, CLOSED SET");
    expect(instruction).toContain("Use every supplied item exactly once");
    expect(instruction).toContain("弟弟高兴地笑了");
    expect(instruction).toContain("never insert 很");
    expect(tutorPrompt).toContain("SENTENCE-ORDERING INTEGRITY RULE");
    expect(companionPrompt).not.toContain("SENTENCE-ORDERING INTEGRITY RULE");
    expect(
      buildSentenceOrderingIntegrityInstruction("Explícame el uso de 地"),
    ).toBeNull();
  });

  it("shares temporary language and correction behavior between written and live Tutor", () => {
    const textPrompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {},
      "TUTOR",
      "¿Qué significa 从来?",
      null,
      {
        language: "auto",
        correctionStyle: "balanced",
        speechPace: "normal",
      },
      ["¿Qué significa 从来?"],
    );
    const voicePrompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
    );

    for (const prompt of [textPrompt, voicePrompt]) {
      expect(prompt).toContain("HAN TUTOR CORRECTION POLICY");
      expect(prompt).toContain("CONTINUE");
      expect(prompt).toContain("RECAST");
      expect(prompt).toContain("Never stack corrections");
    }
    expect(textPrompt).toContain("response language is Spanish");
    expect(textPrompt).toContain("TEMPORARY HAN TUTOR SESSION PREFERENCES");
    expect(textPrompt).toContain("currently open Han Tutor conversation");
  });

  it("does not add the Tutor correction contract to Han Companion", () => {
    const companionPrompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "PRACTICE",
      "你好",
    );

    expect(companionPrompt).not.toContain("HAN TUTOR CORRECTION POLICY");
    expect(companionPrompt).not.toContain(
      "TEMPORARY HAN TUTOR SESSION PREFERENCES",
    );
  });

  it("prohibits generic acknowledgement openings", () => {
    const textPrompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
      "¿Cómo uso 吧?",
    );
    const voicePrompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
    );

    for (const prompt of [textPrompt, voicePrompt]) {
      expect(prompt).toContain("Never begin a reply");
      expect(prompt).toContain("These openings are prohibited");
      expect(prompt).toContain("Begin directly with the useful answer");
    }
  });

  it("keeps one Han identity while adding explicit pronunciation teaching", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
      "¿Cómo se pronuncia 你好 con sus tonos y ritmo?",
    );

    expect(prompt).toContain("same general Han tutor");
    expect(prompt).toContain("汉字 (tone-mark pinyin)");
    expect(prompt).toContain("45 words or fewer");
    expect(prompt).toContain("Give only ONE immediately useful cue");
    expect(prompt).toContain("baja y vuelve a subir");
    expect(prompt).toContain("never insert English fragments");
    expect(prompt).toContain("你好 → ní hǎo");
    expect(prompt).toContain("surface sequence 2+3");
    expect(prompt).toContain("the result is 2+2, is incorrect");
    expect(prompt).toContain("no deliberate internal pause");
    expect(prompt).toContain(
      "the ONLY Chinese item in this initial micro-lesson",
    );
    expect(prompt).toContain("exactly one short repetition");
    expect(prompt).toContain("También puedo explicarte por qué cambia el tono");
    expect(prompt).toContain("never a button or other UI control");
    expect(prompt).toContain(
      "adaptive coaching-prose limits apply ONLY to an initial pronunciation request",
    );
    expect(prompt).toContain("occasional gentle wit");
  });

  it("keeps broad grammar teaching outside the pronunciation micro-lesson", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
      "Explícame en profundidad cómo funciona la estructura 把",
    );

    expect(prompt).toContain("explicit broad request");
    expect(prompt).toContain(
      "Meaning and context; How to use it; Example 1; Example 2 only if useful",
    );
    expect(prompt).not.toContain("45 words or fewer");
    expect(prompt).not.toContain("never a button or other UI control");
  });

  it("expands coaching prose and adds rhythm groups for a medium phrase", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
      "Ayúdame a pronunciar 我明天想去看电影",
    );

    expect(prompt).toContain("medium target of 5 to 12 Mandarin syllables");
    expect(prompt).toContain("65 words or fewer");
    expect(prompt).toContain("2 or 3 natural rhythmic groups");
    expect(prompt).toContain("complete phrase");
  });

  it("segments a long phrase before recombining it", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
      "Ayúdame a pronunciar 我明天想和朋友一起去电影院看一部新的中文电影",
    );

    expect(prompt).toContain("long target of more than 12 Mandarin syllables");
    expect(prompt).toContain("80 words or fewer");
    expect(prompt).toContain("FIRST natural group of 2 to 8 syllables");
    expect(prompt).toContain("preferring 2 to 6");
    expect(prompt).toContain("finally recombine the whole phrase");
    expect(prompt).toContain("chunk, not the whole sentence");
  });

  it("keeps live pronunciation coaching brief and offers detail conversationally", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
    );

    expect(prompt).toContain("under about 15 seconds");
    expect(prompt).toContain("offer to explain why the sound or tone changes");
    expect(prompt).toContain("never a UI button");
    expect(prompt).toContain(
      "must never shorten a requested grammar, vocabulary, usage, or in-depth explanation",
    );
  });

  it("expands the optional pronunciation explanation without restarting practice", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
      "Sí, explícame por qué cambia el tono.",
    );

    expect(prompt).toContain("accepted Han Tutor's conversational offer");
    expect(prompt).toContain("at most 80 words");
    expect(prompt).toContain("3 to 5 short prose sentences");
    expect(prompt).toContain(
      "Do not discuss chains of three or more third tones",
    );
    expect(prompt).toContain("Do not use headings, lists, a second example");
    expect(prompt).not.toContain("45 words or fewer");
    expect(prompt).not.toContain("También puedo explicarte");
  });

  it("feeds bounded audio-derived tone and rhythm evidence to Han Tutor", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {
        pronunciationAttempt: {
          targetHanzi: "你好",
          targetPinyin: "nǐ hǎo",
          attempt: 2,
          overallToneScore: 63,
          syllables: [
            { pinyin: "nǐ", toneNumber: 2, score: 82 },
            { pinyin: "hǎo", toneNumber: 3, score: 38 },
          ],
          rhythm: {
            durationSeconds: 1.4,
            syllablesPerSecond: 1.43,
            longestInternalPauseMs: 720,
            observation: "long_pause",
            confidence: "useful",
          },
        },
      },
      "TUTOR",
      "你好",
    );

    expect(prompt).toContain("actual recording");
    expect(prompt).toContain("hǎo, surface tone 3, contour match 38");
    expect(prompt).toContain("long_pause");
    expect(prompt).toContain("not forced phonetic alignment");
    expect(prompt).toContain("exactly ONE highest-confidence");
    expect(prompt).toContain("On attempt 2, isolate");
  });

  it("keeps an explicitly selected HSK 5 level in Tutor after a short acknowledgement", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {},
      "TUTOR",
      "Yeah, go ahead.",
      "HSK 5",
    );

    expect(prompt).toContain("CURRENT conversation");
    expect(prompt).toContain("HSK 5");
    expect(prompt).toContain("Do NOT teach or drill beginner greetings");
    expect(prompt).not.toContain("default to the simplest possible Chinese");
  });

  it("defaults an implicit Spanish translation request to Mandarin", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
      'Hola, ¿cómo digo "el amor es bonito"?',
    );

    expect(prompt).toContain("target language is Mandarin Chinese");
    expect(prompt).toContain("Do not translate it into English or Spanish");
  });

  it("mentions the learner's level and explanation language", () => {
    const prompt = buildSystemPrompt(
      { level: "INTERMEDIATE", explanationLanguage: "ES" },
      {},
      "TUTOR",
    );
    expect(prompt).toContain("INTERMEDIATE");
    expect(prompt).toContain("Spanish");
  });

  it("prefers the earned General Level over self-reported level when points exist", () => {
    const prompt = buildSystemPrompt(
      { level: "HSK_3", explanationLanguage: "ES", generalLevelPoints: 950 },
      {},
      "TUTOR",
    );
    expect(prompt).toContain("Easily Understood");
    expect(prompt).toContain("950/2000");
    expect(prompt).toContain("more reliable than any self-reported level");
    // The self-reported value itself should not leak into the prompt once earned data exists.
    expect(prompt).not.toContain("HSK_3");
  });

  it("falls back to self-reported level when no General Level points exist yet", () => {
    const prompt = buildSystemPrompt(
      { level: "HSK_5", explanationLanguage: "ES", generalLevelPoints: 0 },
      {},
      "TUTOR",
    );
    expect(prompt).toContain("HSK 5");
    expect(prompt).not.toContain("General Level points");
  });

  it("replies in the language of the latest message with a saved fallback", () => {
    const prompt = buildSystemPrompt(
      { level: "INTERMEDIATE", explanationLanguage: "ES" },
      {},
      "TUTOR",
      "¿Cómo digo esto?",
    );
    expect(prompt).toContain("response language is Spanish");
    expect(prompt).toContain(
      "explanatory prose and labels in your entire reply MUST",
    );
    expect(prompt).toContain("fallback explanation language is Spanish");
  });

  it("selects English or Chinese from the latest message", () => {
    expect(
      buildSystemPrompt(
        { level: null, explanationLanguage: "ES" },
        {},
        "TUTOR",
        "How do I say this?",
      ),
    ).toContain("response language is English");
    expect(
      buildSystemPrompt(
        { level: null, explanationLanguage: "ES" },
        {},
        "TUTOR",
        "这个词是什么意思？",
      ),
    ).toContain("response language is Chinese");
  });

  it("uses the saved language for short ambiguous messages", () => {
    expect(detectHanResponseLanguage("Perfecto", "ES")).toBe("Spanish");
    expect(detectHanResponseLanguage("OK", "ES")).toBe("Spanish");
  });

  it("keeps a Spanish question in Spanish when it contains Chinese", () => {
    expect(detectHanResponseLanguage("¿Qué significa 你好?", "EN")).toBe(
      "Spanish",
    );
  });

  it("detects clear English even when Spanish is the saved fallback", () => {
    expect(detectHanResponseLanguage("Tell me what this means", "ES")).toBe(
      "English",
    );
  });

  it("requires readable plain text, non-repetitive answers, and idiomatic Mandarin", () => {
    const prompt = buildSystemPrompt(
      { level: null, explanationLanguage: null },
      {},
      "TUTOR",
    );
    expect(prompt).toContain("Do not reuse or paraphrase an earlier answer");
    expect(prompt).toContain("Do not use Markdown markers");
    expect(prompt).toContain("idiomatic Mandarin");
    expect(prompt).toContain(
      "Chinese expression, accurate pinyin, and meaning in the response language on separate readable lines",
    );
    expect(prompt).toContain("silently check");
  });

  it("defaults explanation language to English when unset", () => {
    const prompt = buildSystemPrompt(
      { level: null, explanationLanguage: null },
      {},
      "TUTOR",
    );
    expect(prompt).toContain("English");
  });

  it("includes the mode-specific instruction", () => {
    expect(
      buildSystemPrompt(
        { level: null, explanationLanguage: null },
        {},
        "PRACTICE",
      ),
    ).toContain(
      "Mode: Practice — a real, warm conversation with Han as a companion, not a lesson, test, or drill.",
    );
  });

  it("gives each mode a distinct concise teaching behavior", () => {
    const tutor = buildSystemPrompt(
      { level: "HSK_3", explanationLanguage: "ES" },
      {},
      "TUTOR",
      "Explícame esto",
    );
    const practice = buildSystemPrompt(
      { level: "HSK_3", explanationLanguage: "ES" },
      {},
      "PRACTICE",
      "Practiquemos",
    );

    expect(tutor).toContain("Use progressive disclosure");
    expect(tutor).toContain("quick meaning/translation");
    expect(tutor).toContain("focused confusion/contrast");
    expect(tutor).toContain("explicit broad request");
    expect(tutor).toContain(
      "Meaning and context; How to use it; Example 1; Example 2 only if useful",
    );
    expect(tutor).toContain("70 words for other explanations");
    expect(tutor).toContain(
      "Do not reduce a vocabulary or grammar request to pronunciation alone",
    );
    expect(practice).toContain(
      "Speak and write only Standard Mainland Mandarin",
    );
    expect(practice).toContain("Talk like a real friend, not an evaluator");
    expect(practice).toContain("do not score, grade, or formally diagnose");
    expect(practice).toContain("current HanGo tier");
    expect(practice).toContain("Never call the learner's level HSK");
    expect(practice).not.toContain("Context; How to use it; Example 1");
    expect(practice).not.toContain("Your turn");
  });

  it("makes Tutor depth contingent on the learner's turn", () => {
    const prompt = buildSystemPrompt(
      { level: "HSK_3", explanationLanguage: "ES" },
      {},
      "TUTOR",
      "¿Qué significa 还是?",
    );

    expect(prompt).toContain("one natural example");
    expect(prompt).toContain(
      "Do not add headings, a second example, a China note, an exercise, or a closing invitation",
    );
    expect(prompt).toContain("single decisive distinction");
    expect(prompt).toContain("one highest-impact issue");
    expect(prompt).toContain("give exactly one short exercise or learner turn");
    expect(prompt).toContain(
      "Do not append praise, an invitation, an exercise, or a question by default",
    );
  });

  it("preserves characters, pinyin, and translation in every written Tutor example", () => {
    const prompt = buildSystemPrompt(
      { level: "HSK_3", explanationLanguage: "ES" },
      {},
      "TUTOR",
      "Explícame 还是",
    );

    expect(prompt).toContain(
      "Every written Mandarin example must include Chinese characters, accurate pinyin, and a translation",
    );
    expect(prompt).toContain(
      "For every written Mandarin example, put the Chinese expression, accurate pinyin, and meaning",
    );
    expect(prompt).not.toContain("pinyin is optional");
  });

  it("keeps progressive Tutor behavior in live voice without reading pinyin", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "HSK_3", explanationLanguage: "ES" },
      {},
      "TUTOR",
    );

    expect(prompt).toContain("Use progressive disclosure");
    expect(prompt).toContain(
      "quick questions must not expand into a full lesson",
    );
    expect(prompt).toContain("In live voice");
    expect(prompt).toContain("never read pinyin aloud");
  });

  it("keeps a Practice usage question inside Mandarin immersion", () => {
    const prompt = buildSystemPrompt(
      {
        level: "HSK_3",
        explanationLanguage: "ES",
        demonstratedBand: "Developing",
        recentAccuracy: 0.72,
      },
      {
        selectedGrammarPoint: {
          name: "把 construction",
          structure: "Subject + 把 + object + verb + result/location",
        },
      },
      "PRACTICE",
      "¿Cómo se usa 把?",
    );

    expect(prompt).toContain(
      "a real, warm conversation with Han as a companion",
    );
    expect(prompt).toContain(
      "Never switch to Spanish, English, pinyin, translations",
    );
    expect(prompt).toContain(
      "Infer intended meaning from the audio, current topic",
    );
    expect(prompt).not.toContain("Example 1 and Example 2");
    expect(prompt).not.toContain("China note");
    expect(prompt).toContain("Subject + 把 + object + verb + result/location");
  });

  it("turns the reported Tutor mai request into a full Mandarin mini-lesson", () => {
    const prompt = buildSystemPrompt(
      {
        level: "HSK_3",
        explanationLanguage: "ES",
        demonstratedBand: "Developing",
        recentAccuracy: 0.72,
      },
      {},
      "TUTOR",
      "Quiero practicar la palabra mai.",
    );

    expect(prompt).toContain("Mode: Tutor.");
    expect(prompt).toContain("Meaning and context; How to use it");
    expect(prompt).toContain("买 (mǎi, to buy)");
    expect(prompt).toContain("卖 (mài, to sell)");
    expect(prompt).toContain("complete teaching structure");
    expect(prompt).toContain("instead of stopping after pronunciation");
  });

  it("does not turn a Practice 吧 request into a Spanish explanation or lesson", () => {
    const prompt = buildSystemPrompt(
      {
        level: "HSK_3",
        explanationLanguage: "ES",
        demonstratedBand: "Developing",
        recentAccuracy: 0.72,
      },
      {},
      "PRACTICE",
      "Quiero practicar el uso del吧.",
    );

    expect(prompt).toContain("Simplified Chinese characters");
    expect(prompt).toContain("not a lesson, test, or drill");
    expect(prompt).not.toContain('Spanish "va"');
    expect(prompt).not.toContain(
      "complete vocabulary-or-grammar teaching structure",
    );
  });

  it("keeps a Latin ba request inside Mandarin in Tutor mode", () => {
    const prompt = buildSystemPrompt(
      {
        level: "HSK_3",
        explanationLanguage: "ES",
        demonstratedBand: "Developing",
        recentAccuracy: 0.72,
      },
      {},
      "TUTOR",
      "Quiero practicar el uso del ba.",
    );

    expect(prompt).toContain("The domain is ALWAYS Mandarin Chinese");
    expect(prompt).toContain("把 (bǎ)");
    expect(prompt).toContain("吧 (ba)");
    expect(prompt).toContain('Do not explain Spanish "va"');
    expect(prompt).toContain('"Él va a salir"');
  });

  it("includes demonstrated performance, strengths, and focus areas", () => {
    const prompt = buildSystemPrompt(
      {
        level: "HSK_3",
        explanationLanguage: "EN",
        demonstratedBand: "Independent",
        recentAccuracy: 0.82,
        strengths: ["Listening"],
        focusAreas: ["Speaking"],
      },
      {},
      "TUTOR",
      "Explain this",
    );

    expect(prompt).toContain("Demonstrated performance band: Independent");
    expect(prompt).toContain("Recent graded accuracy: 82%");
    expect(prompt).toContain("Demonstrated strengths: Listening");
    expect(prompt).toContain("Current focus areas: Speaking");
  });

  it("includes lesson context when provided", () => {
    const prompt = buildSystemPrompt(
      { level: null, explanationLanguage: null },
      {
        scenarioName: "Restaurant",
        lessonTitle: "Entering and Ordering",
        lessonStepType: "DIALOGUE",
      },
      "TUTOR",
    );
    expect(prompt).toContain("Restaurant");
    expect(prompt).toContain("Entering and Ordering");
    expect(prompt).toContain("DIALOGUE");
  });

  it("includes the selected vocabulary/grammar/dialogue line when present", () => {
    const prompt = buildSystemPrompt(
      { level: null, explanationLanguage: null },
      {
        selectedVocabulary: {
          chineseForm: "要",
          pinyin: "yào",
          meaning: "to want",
        },
        selectedGrammarPoint: { name: "要 + noun", structure: "S + 要 + O" },
        selectedDialogueLine: {
          chineseText: "几位？",
          pinyin: "jǐ wèi?",
          translation: "How many people?",
        },
      },
      "TUTOR",
    );
    expect(prompt).toContain("要");
    expect(prompt).toContain("to want");
    expect(prompt).toContain("S + 要 + O");
    expect(prompt).toContain("几位？");
  });

  it("includes the recent learner answer when present", () => {
    const prompt = buildSystemPrompt(
      { level: null, explanationLanguage: null },
      { recentLearnerAnswer: { prompt: "几位？", wasCorrect: false } },
      "TUTOR",
    );
    expect(prompt).toContain("incorrect");
  });

  it("says nothing lesson-specific is active when context is empty", () => {
    const prompt = buildSystemPrompt(
      { level: null, explanationLanguage: null },
      {},
      "TUTOR",
    );
    expect(prompt).toContain("No specific lesson is active");
  });

  it("includes role-play framing when active (the lesson's Speaking step)", () => {
    const prompt = buildSystemPrompt(
      { level: null, explanationLanguage: null },
      {
        rolePlay: {
          aiRole: "Waiter",
          learnerRole: "Customer",
          scenarioContext: "You've just sat down at a restaurant.",
          objective: "Order a dish and a drink.",
        },
      },
      "PRACTICE",
    );
    expect(prompt).toContain('playing the role of "Waiter"');
    expect(prompt).toContain('learner is playing "Customer"');
    expect(prompt).toContain("Order a dish and a drink.");
    expect(prompt.toLowerCase()).toContain("stay in character");
  });

  it("omits the role-play section when not active", () => {
    const prompt = buildSystemPrompt(
      { level: null, explanationLanguage: null },
      {},
      "PRACTICE",
    );
    expect(prompt).not.toContain("Role play:");
  });

  it("never includes personally identifying fields (no name/email in the input shape)", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {},
      "TUTOR",
    );
    expect(prompt).not.toMatch(/@/);
  });

  it("defines what HanGo is and gives a hard rule for its own name (2026-08-21, live report: asked what HanGo is, Han answered about Hangeul, the Korean alphabet - and separately denied having a name)", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {},
      "TUTOR",
    );
    expect(prompt).toContain("HanGo, a Mandarin Chinese learning app");
    expect(prompt).toContain('always answer "Han"');
    expect(prompt).toContain("never say you have no name");
    expect(prompt).toContain("unrelated to Hangeul");
    expect(prompt).not.toContain(
      "Prioritize conversational meaning over perfect pronunciation",
    );
    expect(prompt).not.toContain("character identity is immutable");
  });

  it("gives Han app knowledge and mentions the current page when set", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      { currentPageName: "Learning Journey" },
      "TUTOR",
    );
    expect(prompt).toContain("HanGo app knowledge:");
    expect(prompt).toContain(
      "Learning Journey is the structured Mandarin course",
    );
    expect(prompt).toContain('currently on the "Learning Journey" page');
    expect(prompt).toContain(
      "Never translate or teach the ordinary dictionary meaning",
    );
    expect(prompt).not.toContain('chapter marked "You are here"');
    expect(prompt).not.toContain("Published Learning Journey catalog");
    expect(prompt).not.toContain("order a pizza");
  });

  it("says nothing about a current page when it isn't set", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {},
      "TUTOR",
    );
    expect(prompt).not.toContain("currently on the");
  });
});

/**
 * `learnerName` (2026-08-29) - a deliberate exception to this file's own
 * "no PII" rule, added after the user explicitly confirmed they want Han
 * to know their name ("no que use mi nombre, pero que Han sepa mi
 * nombre" - knowledge is context, not permission to repeat it). Covers both
 * builders since the rule is symmetric
 * across them, and specifically covers the role-play exclusion - a
 * role-play scene has Han playing a different character who shouldn't
 * know the real-world learner's name unless the scene itself supplies it.
 */
describe("learnerName", () => {
  it("tells Han the learner's name outside role-play (text)", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN", learnerName: "Ana" },
      {},
      "TUTOR",
    );
    expect(prompt).toContain("The learner's name is Ana");
    expect(prompt).toContain("only in the first greeting");
    expect(prompt).toContain("in a final farewell");
    expect(prompt).toContain("explicitly asks you to use their name");
    expect(prompt).toContain("In every other reply, never address");
  });

  it("tells Han the learner's name outside role-play (voice)", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN", learnerName: "Ana" },
      {},
      "TUTOR",
    );
    expect(prompt).toContain("The learner's name is Ana");
    expect(prompt).toContain("only in the first greeting");
    expect(prompt).toContain("In every other reply, never address");
  });

  it("never mentions the name during role-play, even when supplied (text)", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN", learnerName: "Ana" },
      {
        rolePlay: {
          aiRole: "a waiter",
          learnerRole: "a customer",
          scenarioContext: "A restaurant",
          objective: "Order food",
        },
      },
      "TUTOR",
    );
    expect(prompt).not.toContain("Ana");
  });

  it("never mentions the name during role-play, even when supplied (voice)", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN", learnerName: "Ana" },
      {
        rolePlay: {
          aiRole: "a waiter",
          learnerRole: "a customer",
          scenarioContext: "A restaurant",
          objective: "Order food",
        },
      },
      "TUTOR",
    );
    expect(prompt).not.toContain("Ana");
  });

  it("says nothing about a name when none is set", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {},
      "TUTOR",
    );
    expect(prompt).not.toContain("The learner's name is");
  });
});

describe("buildRealtimeSystemPrompt", () => {
  it("keeps side-panel voice app knowledge compact until a relevant turn adds ephemeral context", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {
        currentPageName: "Learning Journey",
      },
      "PRACTICE",
    );
    expect(prompt).toContain("HanGo app knowledge:");
    expect(prompt).toContain(
      "Learning Journey is the structured Mandarin course",
    );
    expect(prompt).toContain('currently on the "Learning Journey" page');
    expect(prompt).toContain(
      "Never translate or teach the ordinary dictionary meaning",
    );
    expect(prompt).not.toContain('chapter marked "You are here"');
    expect(prompt).not.toContain("Published Learning Journey catalog");
  });

  it("includes server-resolved app context only when supplied for the current Han turn", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {
        currentPageName: "Progress",
        onDemandAppContext: "EPHEMERAL_PROGRESS_CONTEXT_123",
      },
      "TUTOR",
    );
    expect(prompt).toContain("EPHEMERAL_PROGRESS_CONTEXT_123");
  });

  it("identifies as Han and defines HanGo when there is no active role-play - this is Han's own side panel in voice mode, not Speaking Lab (2026-08-21 live report: asked 'who are you' via the Han panel's voice mode, got a generic 'I'm an AI assistant' with no mention of Han or HanGo, confirmed via the dev server log this call never went through buildSystemPrompt at all - user confirmed this exact case (voice from Han's own panel, no character) should identify as Han)", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {},
      "TUTOR",
    );
    expect(prompt).toContain("HanGo, a Mandarin Chinese learning app");
    expect(prompt).toContain('always answer "Han"');
    expect(prompt).toContain("never say you have no name");
    expect(prompt).toContain("unrelated to Hangeul");
  });

  it("gives the existing live Han Tutor a youthful expressive delivery without leaking it into Companion", () => {
    const tutorPrompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "TUTOR",
    );
    const companionPrompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "PRACTICE",
    );

    expect(tutorPrompt).toContain("charismatic young-adult tutor");
    expect(tutorPrompt).toContain(
      "Accent-neutral never means emotionally flat",
    );
    expect(tutorPrompt).toContain("Vary pitch, emphasis, cadence");
    expect(tutorPrompt).toContain("never become childish, theatrical");
    expect(companionPrompt).not.toContain("VOICE PERSONALITY FOR HAN TUTOR");
  });

  it("never adds the Han identity/HanGo reinforcement when a role-play character is active - Speaking Lab and lesson Speaking steps stay a deliberately unnamed persona (project_han_persona_scope memory, confirmed twice)", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {
        onDemandAppContext: "MUST_NOT_REACH_SPEAKING",
        rolePlay: {
          aiRole: "a friend",
          learnerRole: "yourself",
          scenarioContext: "catching up",
          objective: "Have a natural spoken conversation",
        },
      },
      "PRACTICE",
    );
    expect(prompt).not.toContain("HanGo, a Mandarin Chinese learning app");
    expect(prompt).not.toContain('always answer "Han"');
    expect(prompt).not.toContain("unrelated to Hangeul");
    expect(prompt).not.toContain("HanGo app knowledge:");
    expect(prompt).not.toContain('chapter marked "You are here"');
    expect(prompt).not.toContain("MUST_NOT_REACH_SPEAKING");
    expect(prompt).toContain(
      "takes precedence over the general Han tutor persona",
    );
    expect(prompt).toContain(
      "Prioritize conversational meaning over perfect pronunciation",
    );
  });

  it("uses HanGo tiers rather than HSK labels in live Practice", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {},
      "PRACTICE",
    );

    expect(prompt).toContain("current HanGo tier");
    expect(prompt).toContain(
      "Never describe or label the learner with an HSK level",
    );
    expect(prompt).toContain("Just Starting Out");
    expect(prompt).not.toContain("explicitly states or requests an HSK level");
  });

  it("waits through hesitation and keeps spoken turns natural and concise", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "PRACTICE",
    );
    expect(prompt).toContain("wait patiently");
    expect(prompt).toContain("one or two short, natural Mandarin sentences");
    expect(prompt).toContain("Never say, spell, or output pinyin");
    expect(prompt).toContain("every turn is Simplified Chinese only");
    expect(prompt).toContain("understand a contextually recognizable attempt");
    expect(prompt).not.toContain("approximately 80% correct");
    expect(prompt).toContain("both third tone");
    expect(prompt).toContain(
      "Mode: Practice — a real, warm conversation with Han as a companion, not a lesson, test, or drill.",
    );
  });

  it("answers a complete Mandarin question in Mandarin instead of the saved fallback", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {},
      "TUTOR",
    );

    expect(prompt).toContain(
      'a complete Mandarin question such as "你好，你叫什么名字？"',
    );
    expect(prompt).toContain("answer it naturally in Mandarin");
  });

  it("keeps lesson role-play grounded and appropriate for the learner level", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {
        lessonTitle: "Entering and Ordering",
        rolePlay: {
          aiRole: "Waiter",
          learnerRole: "Customer",
          scenarioContext: "At a restaurant, a customer and a waiter.",
          objective: "Ask for a table and order one dish.",
        },
      },
      "PRACTICE",
    );

    expect(prompt).toContain("You are Waiter; the learner is Customer");
    expect(prompt).toContain("At a restaurant, a customer and a waiter");
    expect(prompt).toContain("Ask for a table and order one dish");
    expect(prompt).toContain("very common words");
    expect(prompt).toContain("one manageable thing per turn");
    expect(prompt).toContain("Do not introduce advanced vocabulary");
  });

  it("scales speaking pace/vocabulary to the lesson's own HSK level when given", () => {
    const beginnerPrompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {
        rolePlay: {
          aiRole: "Classmate",
          learnerRole: "Student",
          scenarioContext: "Two students meet at school.",
          objective: "Introduce yourself.",
          lessonHskLevel: 1,
        },
      },
      "PRACTICE",
    );
    expect(beginnerPrompt).toContain("speaking difficulty is HSK 1");
    expect(beginnerPrompt.toLowerCase()).toContain("speak slowly");

    const advancedPrompt = buildRealtimeSystemPrompt(
      { level: "ADVANCED", explanationLanguage: "EN" },
      {
        rolePlay: {
          aiRole: "Manager",
          learnerRole: "Employee",
          scenarioContext: "A workplace meeting.",
          objective: "Discuss a project update.",
          lessonHskLevel: 4,
        },
      },
      "PRACTICE",
    );
    expect(advancedPrompt).toContain("speaking difficulty is HSK 4");
    expect(advancedPrompt.toLowerCase()).toContain("slightly faster");
  });

  it("prefers an explicit level override over the lesson's HSK level", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "ADVANCED", explanationLanguage: "EN" },
      {
        rolePlay: {
          aiRole: "Classmate",
          learnerRole: "Student",
          scenarioContext: "Two students meet at school.",
          objective: "Introduce yourself.",
          lessonHskLevel: 1,
          level: "HSK 6",
        },
      },
      "PRACTICE",
    );
    expect(prompt).toContain(
      "explicitly asked to practice at this level: HSK 6",
    );
    expect(prompt).not.toContain("speaking difficulty is HSK 1");
  });

  it("allows Han to correct mistakes mid-conversation in tutor mode (Speaking Lab free-topic practice)", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {
        rolePlay: {
          aiRole: "a friend",
          learnerRole: "yourself",
          scenarioContext: "Talk about weekend plans.",
          objective: "Have a natural spoken conversation about weekend plans.",
          level: "HSK 2",
          isFreeTopic: true,
          correctionMode: "tutor",
        },
      },
      "PRACTICE",
    );

    expect(prompt).toContain(
      "tutoring conversation, not a strict immersion scene",
    );
    expect(prompt).toContain("practice at this level: HSK 2");
    expect(prompt).not.toContain("within HSK 3–4");
    expect(prompt).not.toContain(
      "Speak Mandarin Chinese only for the entire live role-play",
    );
    expect(prompt).toContain("timed open practice");
    expect(prompt).toContain("application asks for the closing line");
    expect(prompt).toContain("emotional energy requested");
    expect(prompt).toContain("firm, terse, impatient, or annoyed");
    expect(prompt).toContain("real person sharing this moment");
    expect(prompt).toContain("not a vocabulary drill");
    expect(prompt).toContain("Natural does not mean longer");
    expect(prompt).toContain("character identity is immutable");
    expect(prompt).toContain("never answer 我也是学生 or 我也是新生");
    expect(prompt).toContain(
      "Once the learner supplies their name or any other requested personal fact",
    );
    expect(prompt).toContain("Never ask for it again");
    expect(prompt).toContain("binding scene contract");
    expect(prompt).toContain("you', 'eres', or 你");
    expect(prompt).toContain(
      "one location, relationship, and current activity",
    );
    expect(prompt).toContain("never reset the scene");
  });

  it("defaults to the strict in-character rule when correctionMode is unset (existing lesson behavior)", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {
        rolePlay: {
          aiRole: "Waiter",
          learnerRole: "Customer",
          scenarioContext: "At a restaurant.",
          objective: "Order a dish.",
        },
      },
      "PRACTICE",
    );

    expect(prompt).toContain(
      "Speak Mandarin Chinese only for the entire live role-play",
    );
    expect(prompt).not.toContain("tutoring conversation");
    expect(prompt).toContain("timed lesson must feel reciprocal");
    expect(prompt).toContain(
      "only when a genuinely relevant character-side question remains",
    );
    expect(prompt).toContain("Never force a question");
    expect(prompt).toContain("This is not an introduction exercise");
    expect(prompt).toContain("Never ask the learner's name");
  });
});

describe("buildTranslationTargetInstruction", () => {
  it("detects the exact reported implicit translation request", () => {
    expect(
      buildTranslationTargetInstruction(
        'Hola, ¿cómo digo "el amor es bonito"?',
      ),
    ).toContain("target language is Mandarin Chinese");
  });

  it("does not override an explicitly requested target language", () => {
    expect(
      buildTranslationTargetInstruction(
        '¿Cómo digo "el amor es bonito" en inglés?',
      ),
    ).toBeNull();
  });
});

describe("buildMandarinStudyItemInstruction", () => {
  it("anchors the exact reported mixed Spanish and Hanzi request", () => {
    const instruction = buildMandarinStudyItemInstruction(
      "Quiero practicar el uso del吧.",
    );

    expect(instruction).toContain("Mandarin item 吧");
    expect(instruction).toContain("every practice example must be a Mandarin");
    expect(instruction).toContain('NEVER be interpreted as Spanish "va"');
  });

  it("does not treat an ordinary Mandarin sentence as a usage request", () => {
    expect(buildMandarinStudyItemInstruction("我们去公园吧。")).toBeNull();
  });

  it.each(["ba", "va"])(
    "treats Latin %s as ambiguous Mandarin instead of Spanish grammar",
    (transcript) => {
      const instruction = buildMandarinStudyItemInstruction(
        `Quiero practicar el uso del ${transcript}.`,
      );

      expect(instruction).toContain("ALWAYS Mandarin Chinese");
      expect(instruction).toContain("把 (bǎ)");
      expect(instruction).toContain("吧 (ba)");
      expect(instruction).toContain("ask exactly one brief");
      expect(instruction).toContain('Do not explain Spanish "va"');
    },
  );

  it("recognizes the reported Latin mai word request and keeps teaching beyond pronunciation", () => {
    const instruction = buildMandarinStudyItemInstruction(
      "Quiero practicar la palabra mai.",
    );

    expect(instruction).toContain("Mandarin pinyin item");
    expect(instruction).toContain("买 (mǎi, to buy)");
    expect(instruction).toContain("卖 (mài, to sell)");
    expect(instruction).toContain("complete teaching structure");
    expect(instruction).toContain("instead of stopping after pronunciation");
  });
});

describe("session HSK level detection", () => {
  it("detects the reported HSK 5 self-assessment", () => {
    expect(
      detectExplicitHskSessionLevel(
        "Actually, I felt comfortable, so I think I have a level of HSK5.",
      ),
    ).toBe("HSK 5");
  });

  it("does not treat a general question about HSK 5 as a level change", () => {
    expect(detectExplicitHskSessionLevel("What is HSK5?")).toBeNull();
  });

  it("keeps the latest selected level through a short acknowledgement", () => {
    expect(
      findLatestExplicitHskSessionLevel([
        "Actually, I felt comfortable, so I think I have a level of HSK5.",
        "Yeah, go ahead.",
      ]),
    ).toBe("HSK 5");
  });

  it("gives HSK 5 a concrete non-beginner practice contract", () => {
    const instruction = buildSessionLevelInstruction("HSK 5");

    expect(instruction).toContain("natural Mandarin");
    expect(instruction).toContain("Do NOT teach or drill beginner greetings");
    expect(instruction).toContain('"go ahead"');
  });
});
