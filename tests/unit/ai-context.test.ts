import { describe, expect, it } from "vitest";
import {
  buildRealtimeSystemPrompt,
  buildMandarinStudyItemInstruction,
  buildSessionLevelInstruction,
  buildSystemPrompt,
  buildTranslationTargetInstruction,
  detectExplicitHskSessionLevel,
  detectHanResponseLanguage,
  findLatestExplicitHskSessionLevel,
} from "@/lib/ai-context";

describe("buildSystemPrompt", () => {
  it("keeps an explicitly selected HSK 5 level after a short acknowledgement", () => {
    const prompt = buildSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {},
      "PRACTICE",
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
    expect(prompt).toContain("HSK 4");
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
    expect(prompt).toContain("each relevant part on its own line");
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
    ).toContain("Mode: Practice.");
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

    expect(tutor).toContain("120 words for other explanations");
    expect(tutor).toContain(
      "Meaning and context; How to use it; Example 1; Example 2; China note",
    );
    expect(tutor).toContain(
      "Do not reduce a vocabulary or grammar request to pronunciation alone",
    );
    expect(practice).toContain(
      "Context; How to use it; Example 1; Example 2; China note; Your turn",
    );
    expect(practice).toContain(
      "Contexto; Cómo se utiliza; Ejemplo 1; Ejemplo 2; Nota de China; Tu turno",
    );
    expect(practice).toContain("Never invent trivia");
    expect(practice).toContain(
      "Default limit: 140 words for a requested usage explanation and 60 words for an ordinary practice turn",
    );
  });

  it("turns a Practice usage question into a structured guided exercise", () => {
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

    expect(prompt).toContain("Context; How to use it");
    expect(prompt).toContain("Example 1 and Example 2");
    expect(prompt).toContain("China note");
    expect(prompt).toContain("Your turn");
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

  it("keeps 吧 as a Mandarin particle instead of Spanish va", () => {
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

    expect(prompt).toContain("Mandarin item 吧");
    expect(prompt).toContain("preserve them exactly");
    expect(prompt).toContain('NEVER be interpreted as Spanish "va"');
    expect(prompt).toContain('"Él va al parque" are unrelated and forbidden');
    expect(prompt).toContain(
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
  });

  it("preserves a live-session HSK choice after a short acknowledgement", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "EN" },
      {},
      "PRACTICE",
    );

    expect(prompt).toContain("explicitly states or requests an HSK level");
    expect(prompt).toContain("Do not reset after a short acknowledgement");
    expect(prompt).toContain("Unless the learner explicitly selects");
  });

  it("waits through hesitation and keeps spoken turns natural and concise", () => {
    const prompt = buildRealtimeSystemPrompt(
      { level: "BEGINNER", explanationLanguage: "ES" },
      {},
      "PRACTICE",
    );
    expect(prompt).toContain("wait patiently");
    expect(prompt).toContain("one to four short sentences");
    expect(prompt).toContain(
      "Tutor or Practice vocabulary/grammar lesson may use up to six short sentences",
    );
    expect(prompt).toContain("Never say, spell, or output pinyin");
    expect(prompt).toContain(
      "Never add a Spanish sentence to an English reply",
    );
    expect(prompt).toContain("normally a practice attempt");
    expect(prompt).toContain("approximately 80% correct");
    expect(prompt).toContain("MUST be written with Chinese characters");
    expect(prompt).toContain("both third tone");
    expect(prompt).toContain("Mode: Practice.");
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
