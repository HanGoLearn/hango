import { describe, expect, it } from "vitest";
import {
  advancePronunciationPractice,
  allowsRealtimeBargeIn,
  applyPlacementSpeakingTurnWindow,
  buildConversationCompletionTool,
  buildRealtimeAssessmentTurnGuard,
  buildRealtimeAssessmentFallbackGuard,
  buildRealtimeCompletionAssessmentInstructions,
  buildRealtimeClosingInstructions,
  buildRealtimeOpeningInstructions,
  buildRealtimeOpeningTurnGuard,
  buildRealtimeSessionUpdateEvent,
  buildSessionPreservingRealtimeTurnEvents,
  buildRealtimeTurnInstructions,
  buildTextConversationAssessmentPrompt,
  ensurePendingLearnerQuestionIsAnswered,
  findAcceptedMandarinTarget,
  findConversationCompletionToolCall,
  hasRepeatedRealtimeQuestionIntent,
  isLikelyRealtimeLearnerQuestion,
  isNonSpeechNoiseTranscript,
  keepSingleRealtimeRolePlayMove,
  keepTimedSpeakingAssessmentOpen,
  nextHanExplanationLanguage,
  realtimeRolePlayOutputTokenLimit,
  resolveRealtimePracticeLevel,
  parseTextConversationAssessment,
  realtimeSpeechSpeed,
  shouldHoldRealtimeLearnerAction,
  shouldBlockForRolePlayAssessment,
  stabilizeConversationPracticeTargets,
} from "@/lib/han-realtime";

describe("nextHanExplanationLanguage", () => {
  it.each(["nihao", "nǐ hǎo", "你好"])(
    "keeps Spanish for the Mandarin practice attempt %s",
    (transcript) => {
      expect(nextHanExplanationLanguage(transcript, "Spanish")).toBe("Spanish");
    },
  );

  it("switches only for a substantive English or Spanish utterance", () => {
    expect(
      nextHanExplanationLanguage("I want to learn this again", "Spanish"),
    ).toBe("English");
    expect(
      nextHanExplanationLanguage("Quiero practicar otra vez", "English"),
    ).toBe("Spanish");
  });
});

describe("isNonSpeechNoiseTranscript", () => {
  it.each([
    "[cough]",
    "(coughing)",
    "Background noise.",
    "[breathing]",
    "throat clearing",
  ])("ignores the non-speech marker %s", (transcript) =>
    expect(isNonSpeechNoiseTranscript(transcript)).toBe(true),
  );

  it.each(["你好", "嗯", "两位", "I need a table"])(
    "keeps real learner speech %s",
    (transcript) => expect(isNonSpeechNoiseTranscript(transcript)).toBe(false),
  );
});

describe("placement role-play controls", () => {
  it("uses an authored opening verbatim", () => {
    const rolePlay = {
      aiRole: "your friend",
      learnerRole: "yourself",
      scenarioContext: "Weekend plans.",
      objective: "State a preference and a reason.",
      openingLine: "这个周末你想做什么？",
    };
    expect(buildRealtimeOpeningTurnGuard(rolePlay)).toContain(
      '"这个周末你想做什么？"',
    );
    expect(buildRealtimeOpeningInstructions(rolePlay)).toContain(
      '"这个周末你想做什么？"',
    );
  });

  it("uses an authored placement closing verbatim", () => {
    expect(
      buildRealtimeClosingInstructions({
        aiRole: "a debate partner",
        learnerRole: "yourself",
        scenarioContext: "A debate.",
        objective: "Exchange views.",
        closingLine: "我明白你的观点了，谢谢这次讨论。",
      }),
    ).toContain('"我明白你的观点了，谢谢这次讨论。"');
  });

  it("requires the minimum learner turns and closes after the maximum", () => {
    const assessment = {
      decision: "end" as const,
      objectiveComplete: true,
      reason: "complete",
      pendingLearnerAction: "none" as const,
      remainingPracticeTargets: [],
      nextCharacterUtterance: "",
      closeAfterReply: false,
    };
    expect(
      applyPlacementSpeakingTurnWindow(
        assessment,
        [{ role: "user", content: "第一轮" }],
        3,
        5,
      ).decision,
    ).toBe("continue");
    const capped = applyPlacementSpeakingTurnWindow(
      { ...assessment, decision: "continue", objectiveComplete: false },
      Array.from({ length: 5 }, (_, index) => ({
        role: "user" as const,
        content: `回答${index}`,
      })),
      3,
      5,
    );
    expect(capped.closeAfterReply).toBe(true);
    expect(capped.nextCharacterUtterance).not.toBe("");
  });
});

describe("buildRealtimeTurnInstructions", () => {
  it("resolves profile-level free practice to Pre-HSK and clamps its audio length", () => {
    expect(
      resolveRealtimePracticeLevel({ isFreeTopic: true, level: undefined }, 0),
    ).toBe("Pre-HSK");
    expect(
      realtimeRolePlayOutputTokenLimit(
        { isFreeTopic: true, level: "Pre-HSK" },
        "turn",
      ),
    ).toBe(100);
    expect(
      realtimeRolePlayOutputTokenLimit(
        { isFreeTopic: false, level: "Pre-HSK" },
        "turn",
      ),
    ).toBe(260);
  });

  it("gives Pre-HSK free practice one tiny phrase per turn", () => {
    const rolePlay = {
      aiRole: "a friend",
      learnerRole: "the learner",
      scenarioContext: "Say hello",
      objective: "Have a tiny greeting exchange",
      level: "Pre-HSK",
      isFreeTopic: true,
    };
    expect(
      buildRealtimeTurnInstructions(
        "English",
        rolePlay,
        null,
        undefined,
        null,
        "PRACTICE",
        "direct",
      ),
    ).toContain("no more than 8 Chinese characters");
    expect(
      buildRealtimeTurnInstructions(
        "English",
        rolePlay,
        null,
        undefined,
        null,
        "PRACTICE",
        "direct",
      ),
    ).toContain("spontaneous everyday Mandarin between real people");
    expect(buildRealtimeOpeningInstructions(rolePlay)).toContain(
      "no more than 8 Chinese characters",
    );
  });

  it("keeps a free-topic character's established identity instead of mirroring the learner", () => {
    const instructions = buildRealtimeTurnInstructions(
      "English",
      {
        aiRole: "a teacher speaking with a student",
        learnerRole: "yourself",
        scenarioContext: "A teacher meets a new student.",
        objective: "Have a natural classroom introduction.",
        level: "HSK 1",
        isFreeTopic: true,
      },
      null,
      "我是学生。",
      null,
      "PRACTICE",
      "direct",
      [
        { role: "assistant", content: "你好，我是老师。" },
        { role: "user", content: "我是学生。" },
      ],
    );

    expect(instructions).toContain("character identity is immutable");
    expect(instructions).toContain("你好，我是老师。");
    expect(instructions).toContain("learner's facts, never yours");
    expect(instructions).toContain("never say 我也是学生 or 我也是新生");
  });

  it("marks the learner's name as known and forbids asking for it again", () => {
    const instructions = buildRealtimeTurnInstructions(
      "Spanish",
      {
        aiRole: "a teacher speaking with a student",
        learnerRole: "yourself",
        scenarioContext: "A teacher welcomes a new student.",
        objective: "Have a natural classroom introduction.",
        level: "HSK 1",
        isFreeTopic: true,
      },
      null,
      "我喜欢中文。",
      null,
      "PRACTICE",
      "direct",
      [
        { role: "assistant", content: "你叫什么名字？" },
        { role: "user", content: "马丁。" },
        { role: "assistant", content: "马丁，你好。" },
        { role: "user", content: "我喜欢中文。" },
      ],
    );

    expect(instructions).toContain("COMPACT DIALOGUE MEMORY");
    expect(instructions).toContain("learner: 马丁。");
    expect(instructions).toContain("LEARNER NAME STATUS: already answered");
    expect(instructions).toContain("Never ask their name again");
    expect(instructions).toContain(
      "continue with a different relevant question",
    );
  });

  it("applies the same known-name memory to timed Learning Journey Speaking", () => {
    const transcript = [
      { role: "assistant" as const, content: "你叫什么名字？" },
      { role: "user" as const, content: "我叫安娜。" },
      { role: "assistant" as const, content: "安娜，你好。" },
      { role: "user" as const, content: "我是秘鲁人。" },
    ];
    const lessonRolePlay = {
      aiRole: "new classmate",
      learnerRole: "new student",
      scenarioContext: "Two classmates meet at school.",
      objective: "Exchange names and nationalities.",
      lessonHskLevel: 1,
    };

    const timedInstructions = buildRealtimeTurnInstructions(
      "English",
      lessonRolePlay,
      null,
      "我是秘鲁人。",
      null,
      "PRACTICE",
      "direct",
      transcript,
    );
    expect(timedInstructions).toContain(
      "LEARNER NAME STATUS: already answered",
    );
    expect(timedInstructions).toContain("我叫安娜。");
    expect(timedInstructions).toContain("Never ask their name again");

    const placementInstructions = buildRealtimeTurnInstructions(
      "English",
      lessonRolePlay,
      null,
      "我是秘鲁人。",
      null,
      "PRACTICE",
      "assessed",
      transcript,
    );
    expect(placementInstructions).not.toContain("LEARNER NAME STATUS");
    expect(placementInstructions).not.toContain("COMPACT DIALOGUE MEMORY");
  });

  it("allows barge-in only for free-topic Practice with Han", () => {
    expect(allowsRealtimeBargeIn({ isFreeTopic: true })).toBe(true);
    expect(allowsRealtimeBargeIn({ isFreeTopic: false })).toBe(false);
    expect(allowsRealtimeBargeIn()).toBe(false);
  });

  it("reasserts Han's complete prompt after the live WebRTC channel opens", () => {
    expect(buildRealtimeSessionUpdateEvent("You are Han.")).toEqual({
      type: "session.update",
      session: {
        type: "realtime",
        instructions: "You are Han.",
        audio: { output: { speed: 1 } },
      },
    });
  });

  it("sets a genuinely slower audio pace for early Speaking levels", () => {
    expect(realtimeSpeechSpeed({ lessonHskLevel: 1 })).toBe(0.82);
    expect(realtimeSpeechSpeed({ lessonHskLevel: 2 })).toBe(0.9);
    expect(realtimeSpeechSpeed({ lessonHskLevel: 4 })).toBe(1);
    expect(realtimeSpeechSpeed({ level: "HSK 1" })).toBe(0.82);
  });

  it("keeps Han's session identity active when applying a general-voice turn guard", () => {
    const { guardEvent, responseEvent } =
      buildSessionPreservingRealtimeTurnEvents(
        "Use Spanish for this turn.",
        "item_guard_identity",
      );

    expect(guardEvent.item.role).toBe("system");
    expect(guardEvent.item.content[0].text).toContain(
      "Use Spanish for this turn.",
    );
    expect(responseEvent).toEqual({
      type: "response.create",
      response: {},
    });
    expect(responseEvent.response).not.toHaveProperty("instructions");
  });

  it("keeps 吧 as the Mandarin study item in a Spanish voice turn", () => {
    const instructions = buildRealtimeTurnInstructions(
      "Spanish",
      undefined,
      null,
      "Quiero practicar el uso del吧.",
      null,
      "PRACTICE",
    );

    expect(instructions).toContain("Mandarin item 吧");
    expect(instructions).toContain('NEVER be interpreted as Spanish "va"');
    expect(instructions).toContain("every practice example must be a Mandarin");
    expect(instructions).toContain(
      "complete vocabulary-or-grammar teaching structure",
    );
    expect(instructions).not.toContain(
      "Prioritize conversational meaning over perfect pronunciation",
    );
  });

  it("treats spoken ba as ambiguous Mandarin in Tutor voice instead of Spanish va", () => {
    const instructions = buildRealtimeTurnInstructions(
      "Spanish",
      undefined,
      null,
      "Quiero practicar el uso del ba.",
    );

    expect(instructions).toContain("ALWAYS Mandarin Chinese");
    expect(instructions).toContain("把 (bǎ)");
    expect(instructions).toContain("吧 (ba)");
    expect(instructions).toContain('Do not explain Spanish "va"');
    expect(instructions).toContain('"Él va a salir"');
  });

  it("teaches spoken mai fully in Tutor voice instead of giving pronunciation only", () => {
    const instructions = buildRealtimeTurnInstructions(
      "Spanish",
      undefined,
      null,
      "Quiero practicar la palabra mai.",
      null,
      "TUTOR",
    );

    expect(instructions).toContain("买 (mǎi, to buy)");
    expect(instructions).toContain("卖 (mài, to sell)");
    expect(instructions).toContain("meaning and context");
    expect(instructions).toContain("two natural examples");
    expect(instructions).toContain("Do not answer with pronunciation alone");
  });

  it("keeps HSK 5 active after the learner says go ahead", () => {
    const instructions = buildRealtimeTurnInstructions(
      "English",
      undefined,
      null,
      "Yeah, go ahead.",
      "HSK 5",
    );

    expect(instructions).toContain("CURRENT conversation");
    expect(instructions).toContain("natural Mandarin");
    expect(instructions).toContain("Do NOT teach or drill beginner greetings");
    expect(instructions).toContain("Keep this turn genuinely at HSK 5");
    expect(instructions).not.toContain("never jump to advanced Chinese");
  });

  it("forces Han to move on after a recognized pronunciation", () => {
    const instructions = buildRealtimeTurnInstructions("Spanish", undefined, {
      target: "爱情",
      attempts: 1,
      similarity: 1,
      status: "accepted",
    });

    expect(instructions).toContain(
      "latest pronunciation of 爱情 was recognized",
    );
    expect(instructions).toContain("do not ask them to repeat it");
    expect(instructions).toContain("introduce a different word");
  });

  it("caps an unclear pronunciation drill at two attempts", () => {
    const instructions = buildRealtimeTurnInstructions("Spanish");

    expect(instructions).toContain(
      "Never drill the same pronunciation for more than two learner attempts",
    );
    expect(instructions).toContain("do not chase perfect tones");
  });

  it("forces an implicit cómo digo request to target Mandarin", () => {
    const instructions = buildRealtimeTurnInstructions(
      "Spanish",
      undefined,
      null,
      'Hola, ¿cómo digo "el amor es bonito"?',
    );

    expect(instructions).toContain("target language is Mandarin Chinese");
    expect(instructions).toContain("Do not translate it into English");
  });

  it("treats nihao as the opening of the active lesson scene", () => {
    const instructions = buildRealtimeTurnInstructions("Spanish", {
      aiRole: "Waiter",
      learnerRole: "Customer",
      scenarioContext: "At a restaurant entrance.",
      objective: "Ask for a table and order a dish.",
    });

    expect(instructions).toContain("currently playing Waiter");
    expect(instructions).toContain("Mandarin Chinese only");
    expect(instructions).toContain("Do not greet as Han");
    expect(instructions).toContain("corrections");
    expect(instructions).not.toContain(
      "required explanation language is Spanish",
    );
  });

  it("makes the scenario character open with one short Mandarin turn", () => {
    const instructions = buildRealtimeOpeningInstructions({
      aiRole: "Waiter",
      learnerRole: "Customer",
      scenarioContext: "At a restaurant entrance.",
      objective: "Ask for a table and order a dish.",
    });

    expect(instructions).toContain("You speak first");
    expect(instructions).toContain("Mandarin Chinese only");
    expect(instructions).toContain(
      "exactly ONE category for your entire opening turn",
    );
    expect(instructions).toContain(
      "one short fact OR one short functional cue/question at beginner level",
    );
    expect(instructions).toContain("one new thing at a time");
    expect(instructions).toContain("Never end the scene during the opening");
    expect(instructions).toContain(
      "no English, Spanish, pinyin, translation, correction, or explanation",
    );
  });

  it("requires a direct answer when the learner asks the character a question", () => {
    const instructions = buildRealtimeTurnInstructions(
      "Spanish",
      {
        aiRole: "Waiter",
        learnerRole: "Customer",
        scenarioContext: "At a restaurant.",
        objective: "The learner asks where the bathroom is.",
      },
      null,
      "洗手间在哪儿？",
    );

    expect(instructions).toContain("Answer it directly in-character now");
    expect(instructions).toContain("do not ask a question back");
  });

  it("keeps authored openings exact and gives normal lessons a short contextual cue", () => {
    expect(
      buildRealtimeOpeningTurnGuard({
        objective: "The learner asks where the bathroom is.",
      }),
    ).toContain('Output exactly "请说。"');
    const classmateOpening = buildRealtimeOpeningTurnGuard({
      aiRole: "a new classmate",
      scenarioContext: "Two classmates meet.",
      objective: "Exchange names.",
    });
    expect(classmateOpening).toContain('Output exactly "你好，你叫什么名字？"');

    const directionsOpening = buildRealtimeOpeningTurnGuard({
      aiRole: "Passerby",
      scenarioContext: "A tourist needs directions.",
      objective: "The learner asks where the library is.",
    });
    expect(directionsOpening).toContain('Output exactly "请说。"');

    const instructions = buildRealtimeOpeningInstructions({
      aiRole: "Passerby",
      learnerRole: "Tourist",
      scenarioContext: "The tourist needs directions.",
      objective: "The learner asks where the library is.",
      lessonHskLevel: 1,
    });
    expect(instructions).toContain("Do not output only 你好 or 您好");
    expect(instructions).toContain("no more than 12 Chinese characters");
  });

  it("lets free-topic practice create a contextual emotional opening instead of a generic fixed line", () => {
    const rolePlay = {
      aiRole: "an annoyed supermarket customer",
      learnerRole: "yourself",
      scenarioContext: "An argument in a supermarket.",
      objective: "Have a natural disagreement.",
      isFreeTopic: true as const,
    };

    expect(buildRealtimeOpeningTurnGuard(rolePlay)).toBeNull();
    const instructions = buildRealtimeOpeningInstructions(rolePlay);
    expect(instructions).toContain("emotional energy");
    expect(instructions).toContain("annoyance");
  });

  it("restricts the role-play to language taught in the lesson", () => {
    const instructions = buildRealtimeTurnInstructions("Spanish", {
      aiRole: "Waiter",
      learnerRole: "Customer",
      scenarioContext: "At a restaurant.",
      objective: "Order noodles.",
      lessonVocabulary: ["你好", "面", "谢谢"],
      lessonGrammar: ["我想要 + object"],
    });

    expect(instructions).toContain("你好, 面, 谢谢");
    expect(instructions).toContain("我想要 + object");
    expect(instructions).toContain("within HSK 3–4");
    expect(instructions).toContain("Never speak or imitate Korean");
  });

  it("closes the scene naturally without asking another question", () => {
    const instructions = buildRealtimeClosingInstructions({
      aiRole: "Waiter",
      learnerRole: "Customer",
      scenarioContext: "At a restaurant.",
      objective: "Order noodles.",
    });

    expect(instructions).toContain("End the scene now naturally as Waiter");
    expect(instructions).toContain(
      "one very short sentence at the session's level",
    );
    expect(instructions).toContain("Do not ask another question");
  });

  it("continues with one goal-directed step only after a separate incomplete decision", () => {
    const instructions = buildRealtimeTurnInstructions("Spanish", {
      aiRole: "Waiter",
      learnerRole: "Customer",
      scenarioContext: "At a restaurant.",
      objective: "Order noodles and ask for the bill.",
    });

    expect(instructions).toContain("separate completion check already found");
    expect(instructions).toContain("Order noodles and ask for the bill.");
    expect(instructions).toContain("never a filler question");
  });

  it("gives timed Speaking a direct natural Realtime turn without a blocking assessment", () => {
    const instructions = buildRealtimeTurnInstructions(
      "Spanish",
      {
        aiRole: "New classmate",
        learnerRole: "Student",
        scenarioContext: "Two classmates meet.",
        objective:
          "Greet them, introduce yourself, and ask their name and where they're from.",
        lessonHskLevel: 1,
        lessonVocabulary: ["你好", "叫", "名字", "哪", "国"],
      },
      null,
      "我叫阿亮。",
      null,
      "PRACTICE",
      "direct",
    );

    expect(instructions).toContain("shared session history");
    expect(instructions).toContain("你呢？");
    expect(instructions).toContain("application timer");
    expect(instructions).not.toContain(
      "separate completion check already found",
    );
    expect(shouldBlockForRolePlayAssessment("timer")).toBe(false);
    expect(shouldBlockForRolePlayAssessment("objective")).toBe(true);
  });

  it("uses an explicit level override instead of the default HSK 3-4 range (Speaking Lab free-topic practice)", () => {
    const instructions = buildRealtimeTurnInstructions("English", {
      aiRole: "conversation partner",
      learnerRole: "yourself",
      scenarioContext: "Talk about travel plans.",
      objective: "Have a natural spoken conversation about travel.",
      level: "HSK 5",
    });

    expect(instructions).toContain("practice at this level: HSK 5");
    expect(instructions).not.toContain("within HSK 3–4");
  });

  it("scales per-turn difficulty to the lesson's own HSK level, not a fixed HSK 3-4 default", () => {
    const instructions = buildRealtimeTurnInstructions("Spanish", {
      aiRole: "Waiter",
      learnerRole: "Customer",
      scenarioContext: "At a restaurant.",
      objective: "Order noodles.",
      lessonVocabulary: ["你好", "面", "谢谢"],
      lessonGrammar: ["我想要 + object"],
      lessonHskLevel: 1,
    });

    expect(instructions).toContain(
      "This lesson's speaking difficulty is HSK 1",
    );
    expect(instructions.toLowerCase()).toContain("speak slowly");
    expect(instructions).not.toContain("within HSK 3–4");
  });

  it("restricts a true beginner (HSK1-2) to only the lesson's own vocabulary, not just a preference", () => {
    const instructions = buildRealtimeTurnInstructions("Spanish", {
      aiRole: "Waiter",
      learnerRole: "Customer",
      scenarioContext: "At a restaurant.",
      objective: "Order noodles.",
      lessonVocabulary: ["你好", "面", "谢谢"],
      lessonGrammar: ["我想要 + object"],
      lessonHskLevel: 1,
    });

    expect(instructions).toContain(
      "Use ONLY words and grammar already studied in this lesson",
    );
  });

  it("still just prefers (not strictly requires) lesson vocabulary once past early-beginner level", () => {
    const instructions = buildRealtimeTurnInstructions("Spanish", {
      aiRole: "Waiter",
      learnerRole: "Customer",
      scenarioContext: "At a restaurant.",
      objective: "Order noodles.",
      lessonVocabulary: ["你好", "面", "谢谢"],
      lessonHskLevel: 4,
    });

    expect(instructions).toContain("Prefer only this lesson vocabulary");
    expect(instructions).not.toContain("Use ONLY this lesson's vocabulary");
  });

  it("lets an explicit level override win over the lesson's own HSK level", () => {
    const instructions = buildRealtimeTurnInstructions("Spanish", {
      aiRole: "Waiter",
      learnerRole: "Customer",
      scenarioContext: "At a restaurant.",
      objective: "Order noodles.",
      lessonHskLevel: 1,
      level: "HSK 5",
    });

    expect(instructions).toContain("practice at this level: HSK 5");
    expect(instructions).not.toContain(
      "This lesson's speaking difficulty is HSK 1",
    );
  });

  it("adds a slow-pace instruction only when pace is slow", () => {
    const slow = buildRealtimeTurnInstructions("English", {
      aiRole: "conversation partner",
      learnerRole: "yourself",
      scenarioContext: "Talk about food.",
      objective: "Practice ordering food.",
      pace: "slow",
    });
    const normal = buildRealtimeTurnInstructions("English", {
      aiRole: "conversation partner",
      learnerRole: "yourself",
      scenarioContext: "Talk about food.",
      objective: "Practice ordering food.",
      pace: "normal",
    });

    expect(slow).toContain("Speak slowly and clearly");
    expect(normal).not.toContain("Speak slowly and clearly");
  });
});

describe("forced Realtime conversation completion assessment", () => {
  it("builds and parses the server-side text assessment contract", () => {
    const prompt = buildTextConversationAssessmentPrompt(
      {
        aiRole: "hotel receptionist",
        learnerRole: "guest",
        scenarioContext: "A guest requests a quieter room.",
        objective:
          "The learner asks about two alternatives and negotiates a room change.",
        lessonVocabulary: ["换房", "差价"],
        lessonGrammar: ["如果……，需要……吗？"],
      },
      "如果换房，需要补差价吗？",
      "before_reply",
      [{ role: "user", content: "如果换房，需要补差价吗？" }],
    );
    expect(prompt).toContain("Exact finite objective");
    expect(prompt).toContain("Never invent names, subtypes");
    expect(prompt).toContain("如果换房，需要补差价吗？");
    expect(prompt).toContain("Mandatory learner practice targets");
    expect(prompt).toContain("vocabulary: 换房");
    expect(prompt).toContain("grammar: 如果……，需要……吗？");
    expect(prompt).toContain("character/assistant use never counts");
    expect(prompt).toContain("directly supply that value now");
    expect(prompt).toContain("direct question and is still unanswered");
    expect(prompt).toContain("never skip straight to the closing line");

    expect(
      parseTextConversationAssessment(
        '```json\n{"decision":"continue","objective_complete":false,"reason":"One request remains.","pending_learner_action":"request","remaining_practice_targets":["grammar: 如果……，需要……吗？"],"next_character_utterance":"可以，我来帮您安排。","close_after_reply":false}\n```',
      ),
    ).toEqual({
      decision: "continue",
      objectiveComplete: false,
      reason: "One request remains.",
      pendingLearnerAction: "request",
      remainingPracticeTargets: ["grammar: 如果……，需要……吗？"],
      nextCharacterUtterance: "可以，我来帮您安排。",
      closeAfterReply: false,
    });
  });

  it("keeps timed Speaking open after every objective is complete", () => {
    const prompt = buildTextConversationAssessmentPrompt(
      {
        aiRole: "new classmate",
        learnerRole: "new student",
        scenarioContext: "Two classmates meet.",
        objective: "Exchange names and nationalities.",
        lessonVocabulary: ["你好", "叫", "名字", "哪", "国", "学生"],
        lessonGrammar: ["Subject + 叫 + Name"],
        lessonHskLevel: 1,
      },
      "我是秘鲁人。",
      "before_reply",
      [
        { role: "user", content: "我叫安娜。" },
        { role: "assistant", content: "我叫小明。" },
        { role: "user", content: "我是秘鲁人。" },
      ],
      [],
      true,
    );
    expect(prompt).toContain("MUST NOT end the conversation");
    expect(prompt).toContain('Always choose decision "continue"');
    expect(prompt).toContain("Always provide a non-empty");
    expect(prompt).toContain("application timer");
    expect(prompt).toContain(
      "must use only words and grammar the learner has already studied in this lesson",
    );

    expect(
      keepTimedSpeakingAssessmentOpen({
        decision: "end",
        objectiveComplete: true,
        reason: "Everything is complete.",
        pendingLearnerAction: "none",
        remainingPracticeTargets: [],
        nextCharacterUtterance: "",
        closeAfterReply: true,
      }),
    ).toMatchObject({
      decision: "continue",
      objectiveComplete: true,
      closeAfterReply: false,
    });
  });

  it("refuses an early end while learner practice targets remain", () => {
    expect(
      parseTextConversationAssessment(
        '{"decision":"end","objective_complete":true,"reason":"The scene objective is met.","pending_learner_action":"none","remaining_practice_targets":["vocabulary: 名字"],"next_character_utterance":"","close_after_reply":true}',
      ),
    ).toMatchObject({
      decision: "continue",
      remainingPracticeTargets: ["vocabulary: 名字"],
      closeAfterReply: false,
    });
  });

  it("never reintroduces a practice target already credited on a prior turn", () => {
    expect(
      stabilizeConversationPracticeTargets(
        {
          decision: "continue",
          objectiveComplete: true,
          reason: "Keep practicing.",
          pendingLearnerAction: "ask",
          remainingPracticeTargets: [
            "vocabulary: 再见",
            "grammar: Statement + 吗？",
          ],
          nextCharacterUtterance: "你可以再问一个问题吗？",
          closeAfterReply: false,
        },
        ["vocabulary: 再见"],
      ),
    ).toMatchObject({
      decision: "continue",
      remainingPracticeTargets: ["vocabulary: 再见"],
    });

    expect(
      stabilizeConversationPracticeTargets(
        {
          decision: "continue",
          objectiveComplete: true,
          reason: "The scene and lesson practice are complete.",
          pendingLearnerAction: "none",
          remainingPracticeTargets: [],
          nextCharacterUtterance: "",
          closeAfterReply: false,
        },
        ["vocabulary: 再见"],
      ),
    ).toMatchObject({ decision: "end", remainingPracticeTargets: [] });
  });

  it("keeps a completed scene open until the character answers the learner's question", () => {
    const assessment = ensurePendingLearnerQuestionIsAnswered(
      {
        decision: "end",
        objectiveComplete: true,
        reason: "The learner asked for the location.",
        pendingLearnerAction: "none",
        remainingPracticeTargets: [],
        nextCharacterUtterance: "洗手间在右边。",
        closeAfterReply: false,
      },
      "洗手间在哪儿？",
      "before_reply",
    );

    expect(assessment).toMatchObject({
      decision: "continue",
      closeAfterReply: true,
      nextCharacterUtterance: "洗手间在右边。",
    });
    expect(isLikelyRealtimeLearnerQuestion("洗手间在哪儿")).toBe(true);
    expect(isLikelyRealtimeLearnerQuestion("我要一杯茶。")).toBe(false);
  });

  it("does not credit authored practice targets without learner evidence", () => {
    const assessment = stabilizeConversationPracticeTargets(
      {
        decision: "end",
        objectiveComplete: true,
        reason: "The evaluator dropped every target too early.",
        pendingLearnerAction: "none",
        remainingPracticeTargets: [],
        nextCharacterUtterance: "",
        closeAfterReply: true,
      },
      null,
      {
        lessonVocabulary: ["请问", "洗手间", "左边", "右边"],
        lessonGrammar: ["请问 + place + 在哪儿？", "是在 + direction + 吗？"],
      },
      [{ role: "user", content: "请问，洗手间在哪儿？" }],
    );

    expect(assessment.decision).toBe("continue");
    expect(assessment.remainingPracticeTargets).toEqual([
      "vocabulary: 左边",
      "vocabulary: 右边",
      "grammar: 是在 + direction + 吗？",
    ]);
    expect(assessment.closeAfterReply).toBe(false);
  });

  it("exposes the lesson objective as the completion criterion", () => {
    const tool = buildConversationCompletionTool({
      objective: "Buy a train ticket to Shanghai.",
    });

    expect(tool.name).toBe("assess_conversation_completion");
    expect(tool.description).toContain("Buy a train ticket to Shanghai.");
    expect(tool.description).toContain("Partial progress is not completion");
    expect(tool.description).toContain('Return "end" promptly');
    expect(tool.parameters.required).toEqual([
      "decision",
      "objective_complete",
      "reason",
      "pending_learner_action",
      "remaining_practice_targets",
      "next_character_utterance",
      "close_after_reply",
    ]);
  });

  it("uses a natural endpoint instead of a fabricated objective for free-topic practice", () => {
    const tool = buildConversationCompletionTool({
      objective: "Talk naturally about travel.",
      isFreeTopic: true,
    });

    expect(tool.description).toContain("learner clearly signals");
    expect(tool.description).not.toContain(
      "substantively completed this objective",
    );
  });

  it("builds a silent check tied to the exact objective", () => {
    const instructions = buildRealtimeCompletionAssessmentInstructions(
      {
        aiRole: "ticket clerk",
        learnerRole: "traveler",
        scenarioContext: "At a train station.",
        objective: "Buy a train ticket to Shanghai.",
      },
      "我想买一张去上海的票。",
      "after_reply",
      [
        { role: "assistant", content: "您好。" },
        { role: "user", content: "我想买一张去上海的票。" },
      ],
    );

    expect(instructions).toContain("Silently assess");
    expect(instructions).toContain("Buy a train ticket to Shanghai.");
    expect(instructions).toContain('Choose "end" only if every essential part');
    expect(instructions).toContain("assess_conversation_completion");
    expect(instructions).toContain('"我想买一张去上海的票。"');
    expect(instructions).toContain("direct role=user evidence");
    expect(instructions).toContain("Authoritative visible transcript");
    expect(instructions).toContain(
      "every question the character already asked",
    );
    expect(instructions).toContain(
      "That new assistant line may complete only the character's side",
    );
  });

  it("extracts only a valid structured completion decision", () => {
    expect(
      findConversationCompletionToolCall([
        { type: "message", role: "assistant" },
        {
          type: "function_call",
          name: "assess_conversation_completion",
          call_id: "call_123",
          arguments:
            '{"decision":"end","objective_complete":true,"reason":"The order is complete.","pending_learner_action":"none","remaining_practice_targets":[],"next_character_utterance":"","close_after_reply":false}',
        },
      ]),
    ).toEqual({
      callId: "call_123",
      decision: "end",
      objectiveComplete: true,
      reason: "The order is complete.",
      pendingLearnerAction: "none",
      remainingPracticeTargets: [],
      nextCharacterUtterance: "",
      closeAfterReply: false,
    });
    expect(
      findConversationCompletionToolCall([
        { type: "function_call", name: "another_tool", call_id: "call_9" },
      ]),
    ).toBeNull();
    expect(
      findConversationCompletionToolCall([
        {
          type: "function_call",
          name: "assess_conversation_completion",
          call_id: "call_10",
          arguments: '{"decision":"maybe","reason":"unclear"}',
        },
      ]),
    ).toBeNull();
  });

  it("turns structured scene memory into a hard audible-turn guard", () => {
    const guard = buildRealtimeAssessmentTurnGuard(
      {
        decision: "continue",
        objectiveComplete: false,
        reason: "The learner has not asked yet.",
        pendingLearnerAction: "ask",
        remainingPracticeTargets: [],
        nextCharacterUtterance: "请问。",
        closeAfterReply: false,
      },
      [
        { role: "assistant", content: "您几点回家？" },
        { role: "user", content: "我下午四点回家。" },
      ],
      { objective: "The learner asks where the bathroom is." },
    );

    expect(guard).toContain('Output exactly "请说。"');
    expect(guard).toContain("and nothing else");

    const memoryGuard = buildRealtimeAssessmentTurnGuard(
      {
        decision: "continue",
        objectiveComplete: false,
        reason: "Keep planning.",
        pendingLearnerAction: "none",
        remainingPracticeTargets: [],
        nextCharacterUtterance: "",
        closeAfterReply: false,
      },
      [
        { role: "assistant", content: "您几点回家？" },
        { role: "user", content: "我下午四点回家。" },
      ],
      { objective: "Discuss weekend plans." },
    );
    expect(memoryGuard).toContain("Do not ask any of them again");
    expect(memoryGuard).toContain("您几点回家？");
    expect(memoryGuard).toContain("我下午四点回家。");
    expect(memoryGuard).toContain('Output exactly "好的，请继续。"');
  });

  it("answers the learner's latest question instead of asking another one", () => {
    const guard = buildRealtimeAssessmentTurnGuard(
      {
        decision: "continue",
        objectiveComplete: true,
        reason: "Answer before closing.",
        pendingLearnerAction: "none",
        remainingPracticeTargets: [],
        nextCharacterUtterance: "洗手间在右边吗？",
        closeAfterReply: true,
      },
      [
        { role: "assistant", content: "您好。" },
        { role: "user", content: "洗手间在哪儿？" },
      ],
      { objective: "The learner asks where the bathroom is." },
    );

    expect(guard).toContain("Answer that exact question immediately");
    expect(guard).toContain("洗手间在哪儿？");
    expect(guard).not.toContain("洗手间在右边吗？");
  });

  it("keeps a planned role-play reply to one new conversational move", () => {
    expect(keepSingleRealtimeRolePlayMove("我叫李雷，我是中国人。你呢？")).toBe(
      "我叫李雷。",
    );
    expect(keepSingleRealtimeRolePlayMove("好的，我们去上课吧。")).toBe(
      "我们去上课吧。",
    );
    expect(
      keepSingleRealtimeRolePlayMove(
        "不过如果渐进式改进错过重大突破，我们就会失去机会。",
      ),
    ).toBe("不过如果渐进式改进错过重大突破，我们就会失去机会。");
  });

  it("holds only an action verb genuinely assigned by the objective", () => {
    const base = {
      callId: "call_2",
      decision: "continue" as const,
      objectiveComplete: false,
      reason: "A direction still needs confirmation.",
      remainingPracticeTargets: [],
      nextCharacterUtterance: "请继续。",
      closeAfterReply: false,
    };
    expect(
      shouldHoldRealtimeLearnerAction(
        { ...base, pendingLearnerAction: "ask" },
        { objective: "The learner asks where the bathroom is." },
      ),
    ).toBe(true);
    expect(
      shouldHoldRealtimeLearnerAction(
        { ...base, pendingLearnerAction: "request" },
        {
          objective: "The learner asks where the bathroom is and confirms it.",
        },
      ),
    ).toBe(false);
    expect(
      shouldHoldRealtimeLearnerAction(
        { ...base, pendingLearnerAction: "ask" },
        { objective: "The learner asks about two room alternatives." },
        [{ role: "user", content: "有安静一点的房间吗？" }],
      ),
    ).toBe(false);
  });

  it("detects a reworded question about an already-asked topic", () => {
    const transcript = [
      { role: "assistant" as const, content: "你想吃什么类型的食物？" },
      { role: "user" as const, content: "我想吃面条。" },
    ];
    expect(
      hasRepeatedRealtimeQuestionIntent("你想吃哪种面条？", transcript),
    ).toBe(true);
    expect(
      hasRepeatedRealtimeQuestionIntent("你希望散步多久？", [
        { role: "assistant", content: "你想先散步多长时间？" },
      ]),
    ).toBe(true);
    expect(
      hasRepeatedRealtimeQuestionIntent("你愿意比较两个房间的区别吗？", [
        { role: "assistant", content: "你想对比一下两个房间吗？" },
      ]),
    ).toBe(true);
    expect(
      hasRepeatedRealtimeQuestionIntent("我们坐地铁去吧。", transcript),
    ).toBe(false);

    const guard = buildRealtimeAssessmentTurnGuard(
      {
        decision: "continue",
        objectiveComplete: false,
        reason: "Continue planning.",
        pendingLearnerAction: "none",
        remainingPracticeTargets: [],
        nextCharacterUtterance: "你想吃哪种面条？",
        closeAfterReply: false,
      },
      transcript,
      { objective: "Discuss weekend plans." },
    );
    expect(guard).toContain("好的，我知道了。");
    expect(guard).not.toContain("你想吃哪种面条？");
  });

  it("detects repeated requests for the learner's reason", () => {
    expect(
      hasRepeatedRealtimeQuestionIntent("能说出具体原因吗？", [
        { role: "assistant", content: "既然你觉得不好，能说说具体原因吗？" },
        { role: "user", content: "我不知道。" },
      ]),
    ).toBe(true);
  });

  it("does not ask for a name the learner already volunteered", () => {
    const transcript = [
      { role: "assistant" as const, content: "你好。" },
      { role: "user" as const, content: "你好，我叫安娜。" },
    ];

    expect(
      hasRepeatedRealtimeQuestionIntent("我是学生。你叫什么名字？", transcript),
    ).toBe(true);

    const guard = buildRealtimeAssessmentTurnGuard(
      {
        decision: "continue",
        objectiveComplete: false,
        reason: "Continue with the introduction.",
        pendingLearnerAction: "none",
        remainingPracticeTargets: ["grammar: 我是 + nationality"],
        nextCharacterUtterance: "我是学生。你叫什么名字？",
        closeAfterReply: false,
      },
      transcript,
      { objective: "Exchange names and nationalities." },
    );
    expect(guard).toContain("好的，我知道了。");
    expect(guard).not.toContain("你叫什么名字？");

    const fallbackGuard = buildRealtimeAssessmentFallbackGuard([
      ...transcript,
      { role: "assistant", content: "我是学生。" },
      { role: "user", content: "我是秘鲁人。" },
    ]);
    expect(fallbackGuard).toContain('Output exactly "好的，我记住了。"');
    expect(fallbackGuard).toContain("and nothing else");
    expect(fallbackGuard).not.toContain("你叫什么名字？");
  });

  it("still answers a direct learner question when the planner is unavailable", () => {
    const guard = buildRealtimeAssessmentFallbackGuard([
      { role: "assistant", content: "你好。" },
      { role: "user", content: "你叫什么名字？" },
    ]);

    expect(guard).toContain("Answer that exact question immediately");
    expect(guard).toContain("你叫什么名字？");
    expect(guard).toContain("Do not ask any question");
  });

  it("uses the beginner planner's grounded answer instead of letting Realtime improvise", () => {
    const guard = buildRealtimeAssessmentTurnGuard(
      {
        decision: "continue",
        objectiveComplete: false,
        reason: "The learner still needs to confirm distance.",
        pendingLearnerAction: "none",
        remainingPracticeTargets: ["vocabulary: 远"],
        nextCharacterUtterance: "图书馆在银行的旁边。",
        closeAfterReply: false,
      },
      [
        { role: "assistant", content: "请说。" },
        { role: "user", content: "请问，图书馆在哪儿？" },
      ],
      { objective: "The learner asks for directions." },
    );

    expect(guard).toContain('Output exactly "图书馆在银行的旁边。"');
    expect(guard).not.toContain("Answer that exact question immediately");
  });

  it("replaces an HSK 1 planner line containing unstudied words with a relevant studied phrase", () => {
    const guard = buildRealtimeAssessmentTurnGuard(
      {
        decision: "continue",
        objectiveComplete: false,
        reason: "Answer the directions question.",
        pendingLearnerAction: "none",
        remainingPracticeTargets: ["vocabulary: 远"],
        nextCharacterUtterance:
          "图书馆在前面路的右侧，不远处。你穿过那个小广场就能看到了。",
        closeAfterReply: false,
      },
      [{ role: "user", content: "您好，请问图书馆在哪儿？" }],
      {
        objective: "Ask for directions and confirm if it is far.",
        lessonHskLevel: 1,
        lessonVocabulary: ["图书馆", "银行", "旁边", "远"],
        lessonGrammar: ["Subject + 在 + Location"],
        lessonPhrases: [
          "图书馆在银行的旁边。",
          "一直往前走，然后往右转。",
          "不远，走五分钟就到了。",
        ],
      },
    );

    expect(guard).toContain('Output exactly "图书馆在银行的旁边。"');
    expect(guard).not.toContain("小广场");
  });

  it("recognizes reworded nationality questions and volunteered nationality", () => {
    expect(
      hasRepeatedRealtimeQuestionIntent("你的国籍是什么？", [
        { role: "assistant", content: "你是哪国人？" },
      ]),
    ).toBe(true);
    expect(
      hasRepeatedRealtimeQuestionIntent("你来自哪个国家？", [
        { role: "user", content: "我是秘鲁人。" },
      ]),
    ).toBe(true);
  });
});

describe("findAcceptedMandarinTarget", () => {
  it("recognizes when the learner repeats the Chinese target Han just taught", () => {
    expect(
      findAcceptedMandarinTarget("Sí, 爱情", [
        {
          role: "assistant",
          content: "La palabra es 爱情. Inténtalo una vez.",
        },
      ]),
    ).toBe("爱情");
  });

  it("does not accept an unrelated Chinese word", () => {
    expect(
      findAcceptedMandarinTarget("你好", [
        {
          role: "assistant",
          content: "La palabra es 爱情. Inténtalo una vez.",
        },
      ]),
    ).toBeNull();
  });
});

describe("advancePronunciationPractice", () => {
  const history = [
    {
      role: "assistant" as const,
      content: "La palabra es 爱情. Inténtalo una vez.",
    },
  ];

  it("accepts a recognized target on the first attempt and moves on", () => {
    const result = advancePronunciationPractice("爱情", history, null);

    expect(result.progress).toMatchObject({
      target: "爱情",
      attempts: 1,
      status: "accepted",
    });
    expect(result.state?.completed).toBe(true);
  });

  it("allows one retry, then forces the exercise to move on", () => {
    const first = advancePronunciationPractice("爱", history, null);
    const second = advancePronunciationPractice("爱", history, first.state);

    expect(first.progress?.status).toBe("retry");
    expect(second.progress).toMatchObject({
      attempts: 2,
      status: "max_attempts",
    });
    expect(second.state?.completed).toBe(true);
  });

  it("does not count an ordinary role-play reply as a pronunciation drill", () => {
    expect(
      advancePronunciationPractice(
        "你好",
        [{ role: "assistant", content: "你好，欢迎光临！" }],
        null,
      ),
    ).toEqual({ state: null, progress: null });
  });
});
