import {
  buildMandarinStudyItemInstruction,
  buildSentenceOrderingIntegrityInstruction,
  buildSessionLevelInstruction,
  buildTranslationTargetInstruction,
  describeSpeakingDifficulty,
  type AiTeacherMode,
} from "@/lib/ai-context";
import { hskNumberForPoints } from "@/lib/points-system";
import {
  renderJourneySpeakingBanks,
  type JourneySpeakingBanks,
} from "@/lib/content/journey-speaking-bank-contract";
import {
  buildJourneySpeakingPolicy,
  buildJourneyLanguageHelpInstruction,
  type JourneySpeakingPhase,
} from "@/lib/journey-speaking-policy";
import {
  buildSpeakingLearnerIdentityMemory,
  isIntroductionSpeakingScene,
} from "@/lib/speaking-scene";
import {
  classifyHanPronunciationRequestLength,
  isExplicitPronunciationRequest,
  isPronunciationDetailRequest,
} from "@/lib/speech/han-pronunciation";
import {
  buildHanTutorControlCommandInstruction,
  buildHanTutorSessionInstruction,
  buildHanTutorTaskGroundingInstruction,
  deriveHanTutorSessionPreferences,
  detectExplicitHanTutorLanguageRequest,
  detectHanTutorResponseLanguage,
  HAN_TUTOR_INTELLIGENT_CORRECTION_POLICY,
  isHanTutorMeaningRequest,
} from "@/lib/han-tutor-session";

export type HanExplanationLanguage = "English" | "Spanish" | "Chinese";

export const PRONUNCIATION_ACCEPTANCE_THRESHOLD = 0.8;

export type PronunciationPracticeProgress = {
  target: string;
  attempts: number;
  similarity: number;
  status: "accepted" | "retry" | "max_attempts";
};

export type PronunciationPracticeState = {
  target: string;
  attempts: number;
  completed: boolean;
  /** Tutor-only, ephemeral: never reconstructed from a later mistaken reply. */
  explanationLanguage?: HanExplanationLanguage;
  referencePinyin?: string | null;
  fullTarget?: string;
  awaitingAttempt?: boolean;
  needsClarification?: boolean;
} | null;

const TUTOR_NEW_STUDY_REQUEST =
  /\b(?:explain|meaning|means|structure|grammar|use|using|think|understand|difference|explica|explícame|significa|estructura|gramática|utiliza|utilizar|quiero|quisiera|entiendo|diferencia)\b|(?:什么意思|语法|结构|怎么用|如何用)/iu;

export function isNonSpeechNoiseTranscript(transcript: string): boolean {
  const normalized = transcript.trim().toLowerCase();
  return /^(?:\[|\()?\s*(?:cough(?:ing)?|noise|background noise|music|silence|breath(?:ing)?|clears? throat|throat clearing)\s*(?:\]|\))?[.!]?$/u.test(
    normalized,
  );
}

export function userFacingRealtimeVoiceError(message?: string): string {
  if (!message?.trim()) return "The live voice session had a problem.";
  if (
    /conversation already has an active response in progress/iu.test(message)
  ) {
    return "Han received two voice turns at once. Please continue speaking.";
  }
  if (
    /\b\d+(?:\.\d+)?\s*ms\b/iu.test(message) &&
    /\b(?:audio|buffer|duration|speech)\b/iu.test(message)
  ) {
    return "That audio turn could not be processed cleanly. Please try again.";
  }
  return message;
}

export function realtimeSessionStartErrorMessage(
  responseBody: string,
  status: number,
): string {
  let message = responseBody.trim();
  try {
    const parsed = JSON.parse(message) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      message = parsed.error.trim();
    }
  } catch {
    // Plain-text route and provider errors are already suitable fallbacks.
  }
  if (!message) return "Han couldn't start the live voice session.";
  if (status === 429 && /today's usage limit/iu.test(message)) {
    return "You've reached today's live voice limit. An administrator can raise this account's Han Realtime limit, or you can try again tomorrow.";
  }
  return message;
}

function isMutualIntroductionRolePlay(
  rolePlay: Pick<RealtimeRolePlay, "objective"> &
    Partial<Pick<RealtimeRolePlay, "aiRole" | "scenarioContext">>,
): boolean {
  return isIntroductionSpeakingScene(rolePlay);
}

type RealtimeRolePlay = {
  aiRole: string;
  learnerRole: string;
  scenarioContext: string;
  objective: string;
  openingLine?: string;
  successCriteria?: string[];
  characterChallenge?: string;
  closingLine?: string;
  lessonVocabulary?: string[];
  lessonGrammar?: string[];
  lessonPhrases?: string[];
  /** Explicit per-session override (Speaking Lab free-topic practice) - takes precedence over the default HSK 3-4 lesson range when set. */
  level?: string;
  /** The lesson's own HSK reference (1-9). Drives per-turn pace/vocabulary scaling; ignored when `level` is set. Mirrors RolePlayContext.lessonHskLevel in ai-context.ts, which only reaches the realtime session's *initial* instructions - this field is what actually reaches every per-turn response.create call. */
  lessonHskLevel?: number;
  journeyLevel?: import("./journey-speaking-level").JourneySpeakingLevel;
  pace?: "slow" | "normal" | "fast";
  isFreeTopic?: boolean;
  /** "tutor": briefly correct clear mistakes in the explanation language right after the in-character Mandarin reply. Unset/"scene": stay fully in character, no corrections mid-conversation (existing behavior). */
  correctionMode?: "scene" | "tutor";
};

export const CONVERSATION_COMPLETION_TOOL_NAME =
  "assess_conversation_completion";

export type ConversationCompletionAssessment = {
  decision: "continue" | "end";
  objectiveComplete: boolean;
  reason: string;
  pendingLearnerAction:
    | "none"
    | "ask"
    | "order"
    | "request"
    | "explain"
    | "compare"
    | "negotiate"
    | "other";
  remainingPracticeTargets: string[];
  nextCharacterUtterance: string;
  closeAfterReply: boolean;
};

export type ConversationCompletionToolCall =
  ConversationCompletionAssessment & { callId: string };

type RealtimeTranscriptMessage = {
  role: "user" | "assistant";
  content: string;
};

function compactRecentDialogue(
  transcript: readonly RealtimeTranscriptMessage[],
): string {
  const lines = transcript
    .slice(-8)
    .map(
      (message) =>
        `${message.role === "assistant" ? "character" : "learner"}: ${message.content.trim()}`,
    )
    .filter((line) => !line.endsWith(": "));
  while (lines.join(" | ").length > 480 && lines.length > 1) lines.shift();
  return lines.join(" | ").slice(0, 480);
}

function findLearnerNameEvidence(
  transcript: readonly RealtimeTranscriptMessage[],
): string | null {
  let nameQuestionPending = false;
  for (const message of transcript) {
    const content = message.content.trim();
    if (message.role === "assistant") {
      if (/叫什么名字|你的名字|您的名字|你姓什么|您贵姓/u.test(content))
        nameQuestionPending = true;
      continue;
    }
    if (
      /(?:我叫|我的名字(?:是|叫)|请叫我|叫我)[\p{Letter}\p{Number}·•\s]{1,30}/u.test(
        content,
      )
    )
      return content.slice(0, 80);
    if (
      nameQuestionPending &&
      content.length <= 80 &&
      !/^(?:你好|您好)[。.!！]?$/u.test(content) &&
      !/不知道|不懂|没听懂|听不清|再说|请重复|什么/u.test(content)
    )
      return content;
  }
  return null;
}

export const REALTIME_ROLE_PLAY_OUTPUT_TOKEN_LIMIT = {
  opening: 200,
  turn: 260,
  closing: 240,
} as const;

const REALTIME_PRE_HSK_OUTPUT_TOKEN_LIMIT = {
  opening: 90,
  turn: 100,
  closing: 80,
} as const;

/**
 * "Use my profile level" has no browser-side level value. Resolve it on the
 * authenticated server and return the concrete label to the live client so
 * every later response.create keeps the same difficulty as the session
 * prompt. Deliberately builds its own "HSK N"/"Pre-HSK" string from
 * hskNumberForPoints() rather than points-system.ts's hskLevelForPoints() -
 * the latter now returns a friendly display name (e.g. "Easily
 * Understood"), which realtimeRolePlayCharacterLimit/realtimeSpeechSpeed
 * below and freeTopicUnclosedTurnTimeoutMs (realtime-turn-guard.ts) parse
 * back out with an "HSK N" regex to set character limits, pace, and turn
 * timeouts - feeding them a friendly name would silently fall through to
 * their generic defaults instead of the learner's real level.
 */
export function resolveRealtimePracticeLevel(
  rolePlay: Pick<RealtimeRolePlay, "isFreeTopic" | "level"> | null | undefined,
  generalLevelPoints: number | null | undefined,
): string | undefined {
  if (!rolePlay?.isFreeTopic || rolePlay.level) return rolePlay?.level;
  const level = hskNumberForPoints(generalLevelPoints ?? 0);
  return level === 0 ? "Pre-HSK" : `HSK ${level}`;
}

export function realtimeRolePlayOutputTokenLimit(
  rolePlay: Pick<RealtimeRolePlay, "isFreeTopic" | "level"> | undefined,
  phase: keyof typeof REALTIME_ROLE_PLAY_OUTPUT_TOKEN_LIMIT,
): number {
  if (rolePlay?.isFreeTopic && rolePlay.level === "Pre-HSK")
    return REALTIME_PRE_HSK_OUTPUT_TOKEN_LIMIT[phase];
  return REALTIME_ROLE_PLAY_OUTPUT_TOKEN_LIMIT[phase];
}

/**
 * Pronunciation practice should feel like a rapid coach exchange, not a
 * lecture. Audio tokens are denser than text tokens, so these limits leave
 * enough room for one cue and one demonstration while bounding digressions.
 */
export function realtimeTutorPronunciationOutputTokenLimit(
  learnerTranscript: string,
  progress?: PronunciationPracticeProgress | null,
): number | undefined {
  // Brevity belongs in the coaching instructions. Audio also consumes this
  // budget; a text-sized ceiling can cut off an otherwise short spoken reply.
  if (progress?.status === "accepted") return 600;
  if (progress || isExplicitPronunciationRequest(learnerTranscript))
    return 1000;
  return undefined;
}

function realtimeRolePlayCharacterLimit(rolePlay: RealtimeRolePlay): number {
  if (rolePlay.level === "Pre-HSK") return 8;
  const explicitLevel = rolePlay.level?.match(/HSK\s*([1-9])/iu)?.[1];
  const hskLevel = explicitLevel
    ? Number(explicitLevel)
    : rolePlay.lessonHskLevel;
  if (hskLevel === 1) return 12;
  if (hskLevel === 2) return 18;
  return 32;
}

/** A deterministic audio pace baseline; prompt wording alone is not enough. */
export function realtimeSpeechSpeed(
  rolePlay?: Pick<RealtimeRolePlay, "lessonHskLevel" | "level" | "pace">,
): number {
  if (!rolePlay) return 1;
  if (rolePlay.pace === "slow") return 0.82;
  if (rolePlay.pace === "fast") return 1.05;
  if (rolePlay.pace === "normal") return 1;
  const explicitLevel = rolePlay.level?.match(/HSK\s*([1-9])/iu)?.[1];
  const hskLevel = explicitLevel
    ? Number(explicitLevel)
    : rolePlay.lessonHskLevel;
  if (hskLevel === 1) return 0.82;
  if (hskLevel === 2) return 0.9;
  if (hskLevel === 3) return 0.96;
  return 1;
}

/** Free-topic Speaking Lab deliberately behaves like Han's fluid live chat. */
export function allowsRealtimeBargeIn(
  rolePlay?: Pick<RealtimeRolePlay, "isFreeTopic">,
): boolean {
  return rolePlay?.isFreeTopic === true;
}

export type RealtimePushToTalkState =
  "idle" | "connecting" | "listening" | "thinking" | "speaking";

/**
 * A physical hold gesture is explicit learner intent, so it may start while
 * the session is waiting or while the current answer is still being spoken.
 * Thinking stays gated because there may not yet be cancellable output and a
 * second committed turn could race the first one.
 */
export function canBeginRealtimePushToTalk(
  state: RealtimePushToTalkState,
  hasActiveResponse: boolean,
  hasOngoingPlayback: boolean,
): boolean {
  return (
    state === "listening" ||
    (state === "speaking" && (hasActiveResponse || hasOngoingPlayback))
  );
}

/**
 * WebRTC push-to-talk control sequence from the Realtime API guide. Clearing
 * input first gives the new press a clean recording boundary. If Han is
 * answering, cancellation must precede clearing queued output audio.
 */
export function buildRealtimePushToTalkStartEvents(
  hasActiveResponse: boolean,
  hasOngoingPlayback: boolean,
) {
  const events: Array<{ type: string }> = [
    { type: "input_audio_buffer.clear" },
  ];
  if (hasActiveResponse) events.push({ type: "response.cancel" });
  if (hasOngoingPlayback) events.push({ type: "output_audio_buffer.clear" });
  return events;
}

/**
 * A forced, silent Realtime tool check used before each role-play reply. A
 * required structured decision is more reliable than hoping a small voice
 * model voluntarily calls an optional end tool at the right moment.
 */
export function buildConversationCompletionTool(
  rolePlay: Pick<
    RealtimeRolePlay,
    "objective" | "isFreeTopic" | "successCriteria"
  >,
) {
  const completionRule = rolePlay.isFreeTopic
    ? "Call only when the learner clearly signals they are finished or the conversation has reached a mutually natural conclusion."
    : `Call only when the learner has substantively completed this objective: ${rolePlay.objective}. Partial progress is not completion.`;

  return {
    type: "function" as const,
    name: CONVERSATION_COMPLETION_TOOL_NAME,
    description: [
      "Assess whether the role-play should continue or receive one final in-character closing line.",
      completionRule,
      'Return "end" promptly once the endpoint is truly reached; otherwise return "continue".',
      "Use only requirements explicitly named in the objective. Never invent extra required specificity, names, subtypes, addresses, confirmations, or logistics.",
      rolePlay.successCriteria?.length
        ? `Treat these observable criteria as the complete checklist: ${rolePlay.successCriteria.join("; ")}. Every criterion must have direct transcript evidence before objective_complete can be true.`
        : "Treat the objective itself as the complete checklist.",
      "Never use silence, elapsed time, or turn count as evidence of completion.",
    ].join(" "),
    parameters: {
      type: "object" as const,
      properties: {
        decision: {
          type: "string" as const,
          enum: ["continue", "end"] as const,
          description:
            'Use "end" only when the exact objective or natural endpoint is complete; otherwise use "continue".',
        },
        reason: {
          type: "string" as const,
          description:
            "A short private explanation of what in the conversation shows that the objective or natural endpoint was reached.",
        },
        objective_complete: {
          type: "boolean" as const,
          description:
            "True only when every finite scene-objective part is already evidenced, independent of lesson practice coverage.",
        },
        pending_learner_action: {
          type: "string" as const,
          enum: [
            "none",
            "ask",
            "order",
            "request",
            "explain",
            "compare",
            "negotiate",
            "other",
          ] as const,
          description:
            "The next objective action still owned by the learner, or none when no learner-owned action remains. Never count an action performed by the character.",
        },
        next_character_utterance: {
          type: "string" as const,
          description:
            'When decision is "continue", the exact next short Mandarin utterance for the character to say. It must add one new move, preserve established facts, never repeat the meaning of an earlier character question, and never perform the pending learner-owned action. Empty when decision is "end".',
        },
        remaining_practice_targets: {
          type: "array" as const,
          items: { type: "string" as const },
          description:
            "Lesson vocabulary or grammar targets the learner has not yet personally attempted. Assistant use never counts. Empty only when all authored targets were attempted or no targets were supplied.",
        },
        close_after_reply: {
          type: "boolean" as const,
          description:
            "True only when the planned character utterance will complete the last remaining character-side part and the scene should close immediately after that audio finishes.",
        },
      },
      required: [
        "decision",
        "objective_complete",
        "reason",
        "pending_learner_action",
        "remaining_practice_targets",
        "next_character_utterance",
        "close_after_reply",
      ],
      additionalProperties: false,
    },
  };
}

export function findConversationCompletionToolCall(
  output: readonly unknown[] | null | undefined,
): ConversationCompletionToolCall | null {
  if (!output) return null;
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Record<string, unknown>;
    if (
      candidate.type === "function_call" &&
      candidate.name === CONVERSATION_COMPLETION_TOOL_NAME &&
      typeof candidate.call_id === "string"
    ) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(
          typeof candidate.arguments === "string" ? candidate.arguments : "{}",
        );
      } catch {
        return null;
      }
      if (!parsed || typeof parsed !== "object") return null;
      const assessment = parsed as Record<string, unknown>;
      if (assessment.decision !== "continue" && assessment.decision !== "end")
        return null;
      const pendingLearnerAction = assessment.pending_learner_action;
      return {
        callId: candidate.call_id,
        decision: assessment.decision,
        objectiveComplete: assessment.objective_complete === true,
        reason: typeof assessment.reason === "string" ? assessment.reason : "",
        pendingLearnerAction: isPendingLearnerAction(pendingLearnerAction)
          ? pendingLearnerAction
          : "other",
        remainingPracticeTargets: parseRemainingPracticeTargets(
          assessment.remaining_practice_targets,
        ),
        nextCharacterUtterance:
          typeof assessment.next_character_utterance === "string"
            ? assessment.next_character_utterance.trim()
            : "",
        closeAfterReply: assessment.close_after_reply === true,
      };
    }
  }
  return null;
}

function isPendingLearnerAction(
  value: unknown,
): value is ConversationCompletionToolCall["pendingLearnerAction"] {
  return (
    typeof value === "string" &&
    [
      "none",
      "ask",
      "order",
      "request",
      "explain",
      "compare",
      "negotiate",
      "other",
    ].includes(value)
  );
}

function parseRemainingPracticeTargets(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((target): target is string => typeof target === "string")
    .map((target) => target.trim())
    .filter(Boolean);
}

export function buildRealtimeCompletionAssessmentInstructions(
  rolePlay: RealtimeRolePlay,
  latestLearnerTranscript?: string,
  phase: "before_reply" | "after_reply" = "before_reply",
  transcript: readonly RealtimeTranscriptMessage[] = [],
): string {
  return [
    "Silently assess the role-play after the learner's latest turn. Do not speak and do not continue the scene in this response.",
    `Scenario: ${rolePlay.scenarioContext}.`,
    `Exact objective: ${rolePlay.objective}.`,
    rolePlay.isFreeTopic
      ? 'Choose "end" only if the learner clearly wants to finish or both sides reached a mutually natural conclusion.'
      : 'Choose "end" only if every essential part of the exact objective has been substantively achieved in the conversation. Choose "continue" for partial progress.',
    "Judge communicative completion, not perfect grammar or pronunciation. Do not require the learner to repeat information the character already supplied naturally.",
    "Use the objective literally as a finite checklist. A brief learner-provided value satisfies an objective part unless the objective itself demands more detail. Never require a person's name, exact venue, subtype, address, second confirmation, or extra logistics when the objective does not explicitly name it.",
    "Once every explicitly named objective part has a value in the transcript, the learner agrees to the outcome, and no learner question is awaiting the character's answer, choose end. Do not keep the scene alive to make it richer or more specific.",
    "For objective actions assigned to the learner - such as ask, order, request, explain, compare, or negotiate - count them only when the learner actually performs them. The character prompting, suggesting, or doing that action cannot complete it on the learner's behalf. The character's contribution counts only for genuinely mutual parts such as exchanging names or nationalities.",
    latestLearnerTranscript
      ? `The learner's latest message is exactly: ${JSON.stringify(latestLearnerTranscript)}. Do not attribute any assistant/character sentence to the learner.`
      : null,
    transcript.length > 0
      ? `Authoritative visible transcript, in order: ${JSON.stringify(transcript)}. Use this transcript to identify learner-owned actions, every question the character already asked (answered or unanswered), and facts already established.`
      : null,
    phase === "after_reply"
      ? "This check follows the character's reply. That new assistant line may complete only the character's side of a genuinely mutual exchange. It is never evidence that the learner asked, ordered, requested, explained, compared, or negotiated something."
      : "This check occurs before the character's next reply.",
    'Before choosing "end", find direct role=user evidence for every essential action assigned to the learner. If even one required learner action lacks direct evidence, choose "continue" and name the missing part in the reason.',
    'Return pending_learner_action as the next still-unperformed learner-owned action category. Use "none" only when no such action remains, and "other" for learner-owned actions outside ask/order/request/explain/compare/negotiate.',
    "When continuing, plan next_character_utterance as the exact short Simplified Chinese Mandarin line the character should say next. Review the full authoritative transcript first. It may address only an explicitly named objective part that is still missing; never deepen a completed part with optional detail. It must preserve every established fact, must not repeat or paraphrase any earlier character question (answered or unanswered), and must not perform, word, demonstrate, or ask the pending learner-owned action. If the learner ignored an earlier question, move to a different missing objective part instead of asking it again. Return an empty string when ending.",
    "A direct learner question is an unresolved conversational obligation until the character answers it after that learner turn. Never choose end before that answer. When the latest learner turn is a question, choose continue and plan a direct in-character answer; do not redirect, ignore it, or ask a different question.",
    "Do not choose end because of silence, elapsed time, turn count, or a desire to change topics.",
    `Call ${CONVERSATION_COMPLETION_TOOL_NAME} now with the decision and a short private reason.`,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildTextConversationAssessmentPrompt(
  rolePlay: RealtimeRolePlay,
  latestLearnerTranscript: string,
  phase: "before_reply" | "after_reply",
  transcript: readonly RealtimeTranscriptMessage[],
  previouslyRemainingPracticeTargets: readonly string[] | null = null,
  continueUntilTimeLimit = false,
  learnerTurnWindow?: { minimum: number; maximum: number },
): string {
  const latestTurnNeedsAnswer =
    phase === "before_reply" &&
    isLikelyRealtimeLearnerQuestion(latestLearnerTranscript);
  const lessonPracticeTargets = [
    ...(rolePlay.lessonVocabulary ?? []).map(
      (target) => `vocabulary: ${target}`,
    ),
    ...(rolePlay.lessonGrammar ?? []).map((target) => `grammar: ${target}`),
  ];
  const plannerLanguageConstraint =
    !rolePlay.isFreeTopic &&
    (rolePlay.lessonHskLevel ?? 0) > 0 &&
    (rolePlay.lessonHskLevel ?? 0) <= 2
      ? `Every planned character utterance must use only words and grammar the learner has already studied in this lesson, apart from proper names already introduced in the transcript. Do not introduce another supposedly simple word. Allowed vocabulary: ${JSON.stringify(rolePlay.lessonVocabulary ?? [])}. Allowed grammar: ${JSON.stringify(rolePlay.lessonGrammar ?? [])}. Studied sentence bank: ${JSON.stringify(rolePlay.lessonPhrases ?? [])}. Recombine familiar building blocks naturally; do not replay the reference dialogue as a sequence.`
      : null;
  return [
    "You are HanGo's private role-play state evaluator and next-turn planner. Never address the learner.",
    `Character: ${rolePlay.aiRole}. Learner role: ${rolePlay.learnerRole}.`,
    `Scenario: ${rolePlay.scenarioContext}. Exact finite objective: ${rolePlay.objective}.`,
    rolePlay.successCriteria?.length
      ? `Observable success checklist: ${JSON.stringify(rolePlay.successCriteria)}. Grade every item separately from direct transcript evidence; objective_complete is true only when every item is satisfied.`
      : null,
    rolePlay.successCriteria?.length
      ? "The learner must never hear or be coached through this private checklist. Stay fully in character: do not name a required grammar form, tell the learner to acknowledge/restate/use a connector, or describe what the exam expects. Create a natural conversational opportunity instead. When a criterion requires a counter-suggestion, pushback, opposing point, or counterargument, the character must actually state one short plausible opposing idea for the learner to answer."
      : null,
    rolePlay.characterChallenge
      ? `Authored character challenge: ${JSON.stringify(rolePlay.characterChallenge)}. Once the learner has stated an initial position/cause/idea, if no equivalent challenge has yet appeared in a role=assistant turn, choose continue and set next_character_utterance to this exact line. The learner cannot receive credit for responding to pushback until a later role=user turn addresses this challenge.`
      : null,
    `Phase: ${phase}. Latest learner message: ${JSON.stringify(latestLearnerTranscript)}.`,
    `Authoritative transcript in exact order: ${JSON.stringify(transcript)}.`,
    learnerTurnWindow
      ? `Placement evidence window: normally ${learnerTurnWindow.minimum}-${learnerTurnWindow.maximum} learner turns. There are currently ${transcript.filter((message) => message.role === "user" && message.content.trim()).length} learner turns. Before the minimum, choose continue even if the checklist is complete and plan one concrete, natural in-character response, alternative, objection, or follow-up that adds useful evidence; never return an empty line or a generic "please continue". At the maximum, plan one final in-character reply so the app can close naturally afterward.`
      : null,
    continueUntilTimeLimit
      ? "This is a timed Speaking session. Objective completion is assessment state only and MUST NOT end the conversation. The application timer alone decides when the character closes the scene."
      : null,
    latestTurnNeedsAnswer
      ? "The latest learner message is a direct question and is still unanswered. The character MUST answer that exact question on the next audible turn. Choose continue even if the question completes the finite objective; never skip straight to the closing line."
      : "There is no newly pending direct learner question before this reply.",
    "Set objective_complete from the finite scene objective and its observable success checklist alone: true only when every required learner-side and character-side part is evidenced. Do not mix lesson practice coverage into this boolean.",
    lessonPracticeTargets.length > 0 && !rolePlay.isFreeTopic
      ? `Mandatory learner practice targets: ${JSON.stringify(lessonPracticeTargets)}.`
      : "There are no mandatory authored practice targets for this free-topic scene.",
    plannerLanguageConstraint,
    previouslyRemainingPracticeTargets
      ? `Monotonic coverage state from the preceding turn: ${JSON.stringify(previouslyRemainingPracticeTargets)}. Only targets in this list may still be returned as remaining. A target absent from this list was already credited and MUST NOT reappear, even if you would judge the full transcript differently now.`
      : "This is the first coverage assessment of the session.",
    "Use only requirements literally named in the objective. A brief value satisfies an objective part unless the objective explicitly demands detail. Never invent names, subtypes, exact venues, addresses, costs, second confirmations, or extra logistics.",
    "Actions assigned to the learner (ask, order, request, explain, compare, negotiate) count only when a role=user message performs them. A character line never completes them.",
    "Use strict observable action definitions: ask = the learner asks a question; order = the learner chooses/orders an item; request = the learner directly asks the character to do something; explain = the learner states relevant cause/details; compare = the learner states a contrast, difference, or reasoned preference between alternatives (asking the character which is better does not count); negotiate = the learner proposes, counters, accepts/rejects terms, or requests a concrete agreement (an informational cost question alone does not count).",
    phase === "after_reply"
      ? "The latest character reply may complete only the character's side of a mutual exchange."
      : "This check occurs before the character replies.",
    lessonPracticeTargets.length > 0 && !rolePlay.isFreeTopic
      ? "Lesson practice is a separate mandatory completion gate. A target counts only when a role=user message personally uses or clearly attempts that vocabulary or grammar in Mandarin; character/assistant use never counts. A communicatively equivalent inflected sentence counts, and an understandable imperfect attempt counts — do not demand perfection or a literal placeholder. Return every target without role=user evidence in remaining_practice_targets, using the exact labels supplied above."
      : "Return an empty remaining_practice_targets array.",
    continueUntilTimeLimit
      ? 'Always choose decision "continue" and close_after_reply false, even when objective_complete is true and remaining_practice_targets is empty. Never use objective completion as a reason to close, say goodbye, or stop inviting the learner to speak.'
      : lessonPracticeTargets.length > 0 && !rolePlay.isFreeTopic
        ? 'Choose decision "end" only when every explicitly named objective part is evidenced, the exchange has reached its natural outcome, remaining_practice_targets is empty, AND no learner question is awaiting an answer. If any practice target or unanswered learner question remains, choose "continue" even when the scene objective is already satisfied.'
        : 'Choose decision "end" only when every explicitly named objective part is evidenced, the exchange has reached its natural outcome, and no learner question is awaiting an answer. Otherwise choose "continue".',
    "A direct learner question is unresolved until a later character turn answers it. Never choose end on the same learner turn that asks the question. Choose continue, answer it directly and declaratively in next_character_utterance, and do not ask a different question back.",
    'For pending_learner_action use only one of: "none", "ask", "order", "request", "explain", "compare", "negotiate", "other". It is the next objective action still owned by the learner.',
    `When continuing, next_character_utterance must be one short natural Mandarin line in Simplified Chinese only for the character. If the latest learner message is a question, answer it directly and declaratively first; never respond with another question, a topic change, or a generic acknowledgement. Otherwise first target a missing objective part; once the objective is met, create a natural opening for the learner to produce exactly ONE remaining practice target. Do not say, demonstrate, or complete that target for the learner. Preserve all established facts: never request information the learner already volunteered, including their name. Never repeat or paraphrase an earlier character question. If only a character-side part of a mutual exchange remains (for example, the character has not supplied their own name), directly supply that value now — never merely announce that it is missing. ${continueUntilTimeLimit ? "After both the objective and authored practice are complete, keep the same scenario going with exactly one easy, relevant, previously unasked follow-up or one new short fact, so the learner can continue speaking until the timer. Always provide a non-empty next_character_utterance." : "If no safe question remains, acknowledge briefly and let the learner continue. When ending, use an empty string."}`,
    "For an authored success checklist, every audible line must sound like the named character, never an examiner or language tutor. Never mention the checklist, a target expression, grammar, scoring, or instructions such as 'use...', 'acknowledge...', 'restate...', or 'please continue'. When pushback or a counterargument is required, actually state the opposing idea rather than asking the learner to manufacture one.",
    continueUntilTimeLimit
      ? "Set close_after_reply false. The application timer, not this assessment, owns the closing line."
      : "Set close_after_reply true only when remaining_practice_targets is empty and the planned answer or character line will complete the final unresolved conversational obligation. This lets the learner hear the answer before the natural closing.",
    'Return JSON only with exactly these keys: {"decision":"continue|end","objective_complete":false,"reason":"short private reason","pending_learner_action":"none|ask|order|request|explain|compare|negotiate|other","remaining_practice_targets":["exact target labels still missing"],"next_character_utterance":"Simplified Chinese Mandarin or empty","close_after_reply":false}.',
  ].join("\n");
}

export function keepTimedSpeakingAssessmentOpen(
  assessment: ConversationCompletionAssessment,
): ConversationCompletionAssessment {
  return {
    ...assessment,
    decision: "continue",
    closeAfterReply: false,
  };
}

/**
 * Placement conversations need enough learner evidence to grade, but should
 * not become open-ended tutoring sessions. Below the minimum we always keep
 * gathering evidence; at the ceiling the character gets one final reply and
 * then closes naturally, even when the learner did not complete the goal.
 */
export function applyPlacementSpeakingTurnWindow(
  assessment: ConversationCompletionAssessment,
  transcript: readonly RealtimeTranscriptMessage[],
  minimumLearnerTurns: number,
  maximumLearnerTurns: number,
): ConversationCompletionAssessment {
  const learnerTurns = transcript.filter(
    (message) => message.role === "user" && message.content.trim(),
  ).length;
  if (learnerTurns < minimumLearnerTurns) {
    return {
      ...assessment,
      decision: "continue",
      closeAfterReply: false,
      nextCharacterUtterance:
        assessment.nextCharacterUtterance || "我倒有一点不同的看法。",
    };
  }
  if (learnerTurns >= maximumLearnerTurns && assessment.decision !== "end") {
    return {
      ...assessment,
      decision: "continue",
      closeAfterReply: true,
      nextCharacterUtterance:
        assessment.nextCharacterUtterance || "好的，谢谢你说明你的想法。",
    };
  }
  return assessment;
}

export function parseTextConversationAssessment(
  content: string,
): ConversationCompletionAssessment | null {
  const match = content.match(/\{[\s\S]*\}/u);
  if (!match) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const assessment = parsed as Record<string, unknown>;
  if (assessment.decision !== "continue" && assessment.decision !== "end")
    return null;
  if (typeof assessment.objective_complete !== "boolean") return null;
  if (!isPendingLearnerAction(assessment.pending_learner_action)) return null;
  if (!Array.isArray(assessment.remaining_practice_targets)) return null;
  const remainingPracticeTargets = parseRemainingPracticeTargets(
    assessment.remaining_practice_targets,
  );
  const decision =
    assessment.decision === "end" && remainingPracticeTargets.length > 0
      ? "continue"
      : assessment.decision;
  return {
    decision,
    objectiveComplete: assessment.objective_complete,
    reason: typeof assessment.reason === "string" ? assessment.reason : "",
    pendingLearnerAction: assessment.pending_learner_action,
    remainingPracticeTargets,
    nextCharacterUtterance:
      typeof assessment.next_character_utterance === "string"
        ? assessment.next_character_utterance.trim()
        : "",
    closeAfterReply:
      assessment.close_after_reply === true &&
      remainingPracticeTargets.length === 0,
  };
}

export function stabilizeConversationPracticeTargets(
  assessment: ConversationCompletionAssessment,
  previouslyRemainingPracticeTargets: readonly string[] | null,
  rolePlay?: Pick<RealtimeRolePlay, "lessonVocabulary" | "lessonGrammar">,
  transcript: readonly RealtimeTranscriptMessage[] = [],
): ConversationCompletionAssessment {
  const authoredTargets = rolePlay
    ? [
        ...(rolePlay.lessonVocabulary ?? []).map(
          (target) => `vocabulary: ${target}`,
        ),
        ...(rolePlay.lessonGrammar ?? []).map((target) => `grammar: ${target}`),
      ]
    : null;
  const eligibleTargets = previouslyRemainingPracticeTargets
    ? [...previouslyRemainingPracticeTargets]
    : authoredTargets;
  const evaluatorRemaining = new Set(assessment.remainingPracticeTargets);
  const remainingPracticeTargets = eligibleTargets
    ? eligibleTargets.filter((target) => {
        if (evaluatorRemaining.has(target)) return true;
        if (!rolePlay) return false;
        const observed = isPracticeTargetObservedByLearner(target, transcript);
        return observed === false;
      })
    : assessment.remainingPracticeTargets;
  return {
    ...assessment,
    decision:
      remainingPracticeTargets.length > 0
        ? "continue"
        : assessment.objectiveComplete
          ? "end"
          : assessment.decision,
    remainingPracticeTargets,
    closeAfterReply:
      assessment.closeAfterReply && remainingPracticeTargets.length === 0,
  };
}

function isPracticeTargetObservedByLearner(
  target: string,
  transcript: readonly RealtimeTranscriptMessage[],
): boolean | null {
  const learnerMessages = transcript
    .filter((message) => message.role === "user")
    .map((message) => normalizePracticeEvidence(message.content));
  if (target.startsWith("vocabulary: ")) {
    const expected = normalizePracticeEvidence(target.slice(12));
    if (!expected || !/\p{Script=Han}/u.test(expected)) return null;
    return learnerMessages.some((message) => message.includes(expected));
  }
  if (!target.startsWith("grammar: ")) return null;
  const requiredChineseSegments = (target.match(/\p{Script=Han}+/gu) ?? [])
    .map(normalizePracticeEvidence)
    .filter(Boolean);
  if (requiredChineseSegments.length === 0) return null;
  return learnerMessages.some((message) => {
    let cursor = 0;
    return requiredChineseSegments.every((segment) => {
      const index = message.indexOf(segment, cursor);
      if (index < 0) return false;
      cursor = index + segment.length;
      return true;
    });
  });
}

function normalizePracticeEvidence(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "");
}

export function isLikelyRealtimeLearnerQuestion(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (/[?？]/u.test(normalized)) return true;
  return (
    /(?:吗|呢|什么|怎么|为什么|哪里|哪儿|哪个|哪种|多少|几(?:点|个|位|岁)?|谁|什么时候|能不能|可不可以|是不是|有没有)(?:[。！!…]*)$/u.test(
      normalized,
    ) ||
    /^(?:what|where|when|why|who|which|how|can|could|would|do|does|is|are|qué|que|dónde|donde|cuándo|cuando|por qué|por que|quién|quien|cuál|cual|cómo|como|puedo|puede)\b[^.!]*$/iu.test(
      normalized,
    )
  );
}

export function ensurePendingLearnerQuestionIsAnswered(
  assessment: ConversationCompletionAssessment,
  latestLearnerTranscript: string,
  phase: "before_reply" | "after_reply",
): ConversationCompletionAssessment {
  if (
    phase !== "before_reply" ||
    !isLikelyRealtimeLearnerQuestion(latestLearnerTranscript)
  )
    return assessment;
  const canCloseAfterAnswer =
    assessment.objectiveComplete &&
    assessment.remainingPracticeTargets.length === 0;
  return {
    ...assessment,
    decision: "continue",
    closeAfterReply: canCloseAfterAnswer,
  };
}

export function buildRealtimeAssessmentTurnGuard(
  assessment: ConversationCompletionAssessment,
  transcript: readonly RealtimeTranscriptMessage[] = [],
  rolePlay?: Pick<RealtimeRolePlay, "objective"> &
    Partial<
      Pick<
        RealtimeRolePlay,
        | "lessonHskLevel"
        | "level"
        | "lessonVocabulary"
        | "lessonGrammar"
        | "lessonPhrases"
      >
    >,
): string {
  const assistantQuestions = transcript
    .filter((message) => message.role === "assistant")
    .flatMap((message) =>
      [...message.content.matchAll(/[^。！？!?\n]+[？?]/gu)].map((match) =>
        match[0].trim(),
      ),
    );
  const learnerFacts = transcript
    .filter((message) => message.role === "user")
    .map((message) => message.content);
  const protectedAction = rolePlay
    ? shouldHoldRealtimeLearnerAction(assessment, rolePlay, transcript)
    : ["ask", "order", "request", "explain", "compare", "negotiate"].includes(
        assessment.pendingLearnerAction,
      );
  const neutralLine =
    assessment.pendingLearnerAction === "ask" ? "请说。" : "请继续。";

  if (protectedAction)
    return `The learner still owns the pending ${assessment.pendingLearnerAction} action. Output exactly ${JSON.stringify(neutralLine)} and nothing else. Your complete response must contain only these exact Chinese characters and punctuation: ${neutralLine}`;

  const latestLearnerMessage = [...transcript]
    .reverse()
    .find((message) => message.role === "user")?.content;
  // The private planner has the lesson's HSK, vocabulary, studied sentence
  // bank, and full transcript. Use its exact grounded answer instead of
  // letting the audio model improvise a new answer to direct questions.
  const latestTurnIsQuestion = Boolean(
    latestLearnerMessage &&
    isLikelyRealtimeLearnerQuestion(latestLearnerMessage),
  );
  const groundedPlannedUtterance = assessment.nextCharacterUtterance
    ? groundedEarlyBeginnerUtterance(
        assessment.nextCharacterUtterance,
        latestLearnerMessage,
        rolePlay,
        transcript,
      )
    : "";
  if (
    groundedPlannedUtterance &&
    (!latestTurnIsQuestion ||
      !isLikelyRealtimeLearnerQuestion(groundedPlannedUtterance))
  ) {
    const plannedUtterance = hasRepeatedRealtimeQuestionIntent(
      groundedPlannedUtterance,
      transcript,
    )
      ? "好的，我知道了。"
      : keepSingleRealtimeRolePlayMove(groundedPlannedUtterance);
    return `Output exactly ${JSON.stringify(plannedUtterance)} and nothing else. Do not add, remove, explain, translate, or paraphrase any part.`;
  }
  if (latestLearnerMessage && latestTurnIsQuestion)
    return `The learner's latest turn is this direct question: ${JSON.stringify(latestLearnerMessage)}. Answer that exact question immediately and naturally as the scenario character in short Simplified Chinese. The first sentence must contain the actual answer. Do not ignore it, redirect to another objective, give only a generic acknowledgement, or ask any question in this turn.`;

  const safeLine = safeRealtimePlannerFallbackLine(transcript);
  return [
    "Private structured scene state from the silent checker; never read or mention this state aloud.",
    "The private planner returned no next character line. Do not improvise one from stale scene context.",
    assistantQuestions.length
      ? `Questions already asked by the character, including unanswered questions: ${JSON.stringify(assistantQuestions)}. Do not ask any of them again or ask the same thing with different wording.`
      : null,
    learnerFacts.length
      ? `The learner already said: ${JSON.stringify(learnerFacts)}. Treat these as authoritative conversation memory and do not request the same information again.`
      : null,
    `Output exactly ${JSON.stringify(safeLine)} and nothing else. Your complete response must contain only these exact Chinese characters and punctuation: ${safeLine}`,
  ]
    .filter(Boolean)
    .join(" ");
}

function groundedEarlyBeginnerUtterance(
  plannedUtterance: string,
  latestLearnerMessage: string | undefined,
  rolePlay:
    | (Pick<RealtimeRolePlay, "objective"> &
        Partial<
          Pick<
            RealtimeRolePlay,
            | "lessonHskLevel"
            | "level"
            | "lessonVocabulary"
            | "lessonGrammar"
            | "lessonPhrases"
          >
        >)
    | undefined,
  transcript: readonly RealtimeTranscriptMessage[],
): string {
  const isEarlyLesson =
    !rolePlay?.level &&
    (rolePlay?.lessonHskLevel ?? 0) > 0 &&
    (rolePlay?.lessonHskLevel ?? 0) <= 2;
  if (!isEarlyLesson || !rolePlay?.lessonPhrases?.length)
    return plannedUtterance;

  const allowedCharacters = new Set(
    [
      ...(rolePlay.lessonVocabulary ?? []),
      ...(rolePlay.lessonGrammar ?? []),
      ...rolePlay.lessonPhrases,
      ...transcript
        .filter((message) => message.role === "user")
        .map((message) => message.content),
    ]
      .join("")
      .match(/\p{Script=Han}/gu) ?? [],
  );
  const plannedCharacters = plannedUtterance.match(/\p{Script=Han}/gu) ?? [];
  if (plannedCharacters.every((character) => allowedCharacters.has(character)))
    return plannedUtterance;

  if (!latestLearnerMessage) return "";
  const learnerCharacters = new Set(
    latestLearnerMessage.match(/\p{Script=Han}/gu) ?? [],
  );
  const priorAssistantLines = new Set(
    transcript
      .filter((message) => message.role === "assistant")
      .map((message) => message.content.trim()),
  );
  return (
    rolePlay.lessonPhrases
      .filter(
        (phrase) =>
          phrase.trim() &&
          !isLikelyRealtimeLearnerQuestion(phrase) &&
          !priorAssistantLines.has(phrase.trim()),
      )
      .map((phrase) => ({
        phrase: phrase.trim(),
        overlap: new Set(phrase.match(/\p{Script=Han}/gu) ?? []).size
          ? [...new Set(phrase.match(/\p{Script=Han}/gu) ?? [])].filter(
              (character) => learnerCharacters.has(character),
            ).length
          : 0,
      }))
      .filter((candidate) => candidate.overlap >= 2)
      .sort(
        (left, right) =>
          right.overlap - left.overlap ||
          left.phrase.length - right.phrase.length,
      )[0]?.phrase ?? ""
  );
}

/**
 * Safe audible fallback for the rare case where the private role-play planner
 * is unavailable.  It must never let the Realtime model freely improvise a
 * question from stale scene context, because that can ask for facts the
 * learner already supplied (most visibly their name).
 */
export function buildRealtimeAssessmentFallbackGuard(
  transcript: readonly RealtimeTranscriptMessage[],
): string {
  const latestLearnerMessage = [...transcript]
    .reverse()
    .find((message) => message.role === "user")?.content;

  if (
    latestLearnerMessage &&
    isLikelyRealtimeLearnerQuestion(latestLearnerMessage)
  )
    return `The private scene planner is temporarily unavailable. The learner's latest turn is this direct question: ${JSON.stringify(latestLearnerMessage)}. Answer that exact question immediately in one short declarative Simplified Chinese sentence. Do not ask any question, request any information, change topics, or add a second conversational move.`;

  const safeLine = safeRealtimePlannerFallbackLine(transcript);
  return `The private scene planner is temporarily unavailable, so you may not improvise the next scene question. Output exactly ${JSON.stringify(safeLine)} and nothing else. Your complete response must contain only these exact Chinese characters and punctuation: ${safeLine}`;
}

function safeRealtimePlannerFallbackLine(
  transcript: readonly RealtimeTranscriptMessage[],
): string {
  const establishedFact = ["name", "nationality"].some((topic) =>
    learnerAlreadyEstablishedTopic(topic, transcript),
  );
  return establishedFact ? "好的，我记住了。" : "好的，请继续。";
}

export function keepSingleRealtimeRolePlayMove(value: string): string {
  const clauses = [
    ...value.matchAll(/([^，,。！？?!；;]+)([，,。！？?!；;]?)/gu),
  ]
    .map((match) => ({
      content: match[1]?.trim() ?? "",
      punctuation: match[2] ?? "",
    }))
    .filter((clause) => clause.content);
  if (clauses.length === 0) return value.trim();
  const genericLead =
    /^(?:你好|您好|好的?|可以|当然|没问题|嗯|对|是的|不是|谢谢|不客气)$/u;
  const dependentLead =
    /^(?:(?:不过|可是|但)?如果|要是|虽然|尽管|即使|哪怕|不但|与其|除非|只要|既然|因为|由于)/u;
  if (
    clauses.length > 1 &&
    dependentLead.test(clauses[0]!.content) &&
    !/[！？?!。]/u.test(clauses[0]!.punctuation)
  ) {
    const first = clauses[0]!;
    const second = clauses[1]!;
    const punctuation = /[！？?!]/u.test(second.punctuation) ? "？" : "。";
    return `${first.content}，${second.content}${punctuation}`;
  }
  const selected =
    clauses.length > 1 && genericLead.test(clauses[0]!.content)
      ? clauses[1]!
      : clauses[0]!;
  const punctuation = /[！？?!]/u.test(selected.punctuation) ? "？" : "。";
  return `${selected.content}${punctuation}`;
}

export function hasRepeatedRealtimeQuestionIntent(
  candidate: string,
  transcript: readonly RealtimeTranscriptMessage[],
): boolean {
  const candidateTopics = realtimeQuestionTopics(candidate);
  if (candidateTopics.size === 0) return false;
  const repeatsAssistantQuestion = transcript
    .filter((message) => message.role === "assistant")
    .some((message) => {
      const previousTopics = realtimeQuestionTopics(message.content);
      return [...candidateTopics].some((topic) => previousTopics.has(topic));
    });
  if (repeatsAssistantQuestion) return true;

  return [...candidateTopics].some((topic) =>
    learnerAlreadyEstablishedTopic(topic, transcript),
  );
}

function learnerAlreadyEstablishedTopic(
  topic: string,
  transcript: readonly RealtimeTranscriptMessage[],
): boolean {
  const learnerMessages = transcript.filter(
    (message) => message.role === "user",
  );
  if (topic === "nationality")
    return learnerMessages.some((message) =>
      /(?:我是[\p{Script=Han}]{1,8}人|我来自[\p{Script=Han}]{1,8}|我的国籍|\b(?:i am|i'm) from\b|\bmy nationality\b|\bsoy de\b|\bmi nacionalidad\b)/iu.test(
        message.content,
      ),
    );
  if (topic !== "name") return false;
  return learnerMessages.some((message) =>
    /(?:我叫|我的名字(?:叫|是)?|\bmy name is\b|\bme llamo\b|\bmi nombre es\b)/iu.test(
      message.content,
    ),
  );
}

function realtimeQuestionTopics(value: string): Set<string> {
  const looksLikeQuestion =
    /[？?]/u.test(value) ||
    /(?:什么|哪(?:里|儿|个|种)?|谁|几点|什么时候|怎么样|好吗|可以吗|能不能|能否|说说|说出|说明)/u.test(
      value,
    );
  if (!looksLikeQuestion) return new Set();

  const topics = new Set<string>();
  if (
    /(?:名字|姓名|叫什么|怎么称呼|姓什么|what(?:'s| is) your name|cómo te llamas|cuál es tu nombre)/iu.test(
      value,
    )
  )
    topics.add("name");
  if (
    /(?:哪国人|哪个国家|国籍|来自哪|where are you from|nationality|de qué país|nacionalidad)/iu.test(
      value,
    )
  )
    topics.add("nationality");
  if (/(?:回家|回来|回去|结束)/u.test(value)) topics.add("return");
  if (/(?:吃|喝|食物|面条|饭|菜|餐厅)/u.test(value)) topics.add("food");
  if (/(?:地铁|公交|出租车|交通|怎么去|坐车)/u.test(value))
    topics.add("transport");
  if (/(?:几点|什么时候|时间|上午|下午|早上|晚上)/u.test(value))
    topics.add("time");
  if (/(?:多久|多长时间|多长|几分钟|几小时)/u.test(value))
    topics.add("duration");
  if (/(?:哪里|哪儿|地点|集合|见面)/u.test(value)) topics.add("place");
  if (/(?:和谁|跟谁|谁一起)/u.test(value)) topics.add("person");
  if (/(?:做什么|活动|玩什么)/u.test(value)) topics.add("activity");
  if (/(?:为什么|原因|理由|怎么想|具体说|说说|说明)/u.test(value))
    topics.add("reason");
  if (
    /(?:比较|对比|区别|优点|缺点|优势|不足|哪个更|更倾向|更看重|更在意|哪一点|还是)/u.test(
      value,
    )
  )
    topics.add("comparison");
  return topics;
}

export function shouldHoldRealtimeLearnerAction(
  assessment: ConversationCompletionAssessment,
  rolePlay: Pick<RealtimeRolePlay, "objective">,
  transcript: readonly RealtimeTranscriptMessage[] = [],
): boolean {
  const objectiveActionPatterns: Record<
    Exclude<
      ConversationCompletionAssessment["pendingLearnerAction"],
      "none" | "other"
    >,
    RegExp
  > = {
    ask: /\b(?:ask|asks|asking)\b/iu,
    order: /\b(?:order|orders|ordering)\b/iu,
    request: /\b(?:request|requests|requesting)\b/iu,
    explain: /\b(?:explain|explains|explaining)\b/iu,
    compare: /\b(?:compare|compares|comparing)\b/iu,
    negotiate: /\b(?:negotiate|negotiates|negotiating)\b/iu,
  };
  const action = assessment.pendingLearnerAction;
  if (action !== "ask") return false;
  const learnerAlreadyAsked = transcript.some(
    (message) => message.role === "user" && /[？?]/u.test(message.content),
  );
  return (
    !learnerAlreadyAsked && objectiveActionPatterns.ask.test(rolePlay.objective)
  );
}

function lessonLanguageConstraints(
  rolePlay: RealtimeRolePlay,
  journeyPractice = false,
): string[] {
  // A true beginner (HSK1-2, no explicit level override) has only seen the
  // words/patterns this specific lesson taught - "prefer" isn't strict
  // enough, since the model will otherwise reach for other simple-but-untaught
  // HSK1-2 vocabulary the learner has never encountered.
  const isEarlyBeginner =
    !rolePlay.level &&
    (rolePlay.lessonHskLevel ?? 0) > 0 &&
    (rolePlay.lessonHskLevel ?? 0) <= 2;
  const vocabularyConstraint =
    isEarlyBeginner && !journeyPractice
      ? `Use ONLY words and grammar already studied in this lesson - do not introduce any other word or pattern, even a supposedly simple one, unless the learner uses it first. Vocabulary: ${rolePlay.lessonVocabulary?.join(", ") || "the words taught in this lesson"}. Patterns: ${rolePlay.lessonGrammar?.join("; ") || "single-clause beginner patterns"}. Studied sentence bank: ${rolePlay.lessonPhrases?.join(" / ") || "not provided"}. Recombine familiar building blocks naturally; do not replay the reference dialogue as a sequence.`
      : `Prefer only this lesson vocabulary: ${rolePlay.lessonVocabulary?.join(", ") || "the simplest words required by the scenario"}. Prefer only these lesson patterns: ${rolePlay.lessonGrammar?.join("; ") || "single-clause beginner patterns"}.`;

  const constraints = [
    vocabularyConstraint,
    rolePlay.level
      ? `The learner explicitly asked to practice at this level: ${rolePlay.level}. Match vocabulary and grammar to that level instead of defaulting to HSK 3–4.`
      : rolePlay.lessonHskLevel
        ? `This lesson's speaking difficulty is HSK ${rolePlay.lessonHskLevel}. ${describeSpeakingDifficulty(rolePlay.lessonHskLevel)}`
        : "Keep all language within HSK 3–4 and prefer the easiest HSK 1–3 wording. Never use words or grammar above HSK 4.",
    "Do not add formal alternatives, idioms, literary or regional expressions, long modifiers, descriptive details, or new teaching points unless the requested level calls for them.",
  ];
  if (rolePlay.pace === "slow") {
    constraints.push(
      "Speak slowly and clearly, with brief natural pauses between phrases - the learner asked for a slower pace.",
    );
  } else if (rolePlay.pace === "fast") {
    constraints.push(
      "Speak at a natural, native conversational speed - the learner asked not to have the pace slowed down for them.",
    );
  }
  return constraints;
}

export function buildRealtimeTurnInstructions(
  requiredLanguage: HanExplanationLanguage,
  rolePlay?: RealtimeRolePlay,
  progress?: PronunciationPracticeProgress | null,
  learnerTranscript?: string,
  sessionLevelOverride?: string | null,
  mode: AiTeacherMode = "TUTOR",
  rolePlayTurnStrategy: "assessed" | "direct" = "assessed",
  conversationTranscript: readonly RealtimeTranscriptMessage[] = [],
  practiceState: PronunciationPracticeState = null,
  journeyPhase?: JourneySpeakingPhase,
  journeyBanks?: JourneySpeakingBanks,
): string {
  const pronunciationProgress = progress
    ? progress.status === "accepted"
      ? `PRONUNCIATION PASS: the learner's transcript matched at least ${Math.round(PRONUNCIATION_ACCEPTANCE_THRESHOLD * 100)}% of ${progress.target}. This threshold is authoritative for exercise flow only: accept the attempt and NEVER ask for ${progress.target} or one of its syllables again. Recognition similarity is NOT an acoustic score and does not prove correct tones, syllables, or rhythm. In at most 18 spoken words, acknowledge that the word was recognized and close this target. You may clearly introduce ONE different, nearby Mandarin target if it serves the learner's requested practice; do not automatically start an unrelated syllable drill. Do not explain meaning, translate, speak pinyin, restate a tone lesson, or add any example beyond that single next target.`
      : progress.status === "max_attempts"
        ? `PRONUNCIATION STOP: after four guided attempts, ${progress.target} still did not reach the recognition threshold. End this target now. In at most 18 spoken words, give one kind reset cue and move to a different target or normal conversation. Do not request another repetition, translate, speak pinyin, or add examples.`
        : `ACTIVE PRONUNCIATION DRILL: attempt ${progress.attempts} of at most 4 for ${progress.target} did not reach the recognition threshold. This instruction overrides Tutor's normal broad teaching structure. Respond with at most 25 spoken words and exactly this pattern: ONE high-confidence sound/tone/rhythm cue, ONE natural demonstration of ${progress.target}, then ONE direct request to repeat. Choose a mismatched or missing portion first; a syllable already recognized in its correct position is not the default correction target. Never repeat the previous turn's syllable correction when the current transcript already recognizes it. Do not explain meaning, translate, speak pinyin, give another Mandarin example, ask a meta-question, or praise at length. If the audio does not support a specific acoustic diagnosis, briefly contrast what the transcript captured with the target instead of inventing an error. On attempt 3 you may demonstrate once slowly and once naturally, still within the same short reply.`
    : "A pronunciation drill happens only after the learner explicitly requests it or accepts Han's invitation to repeat a specific target. Keep normal conversation flowing and never turn an ordinary Mandarin reply into an unsolicited pronunciation test. During an active drill, use microcoaching rather than a lesson: one cue, one demonstration, one learner action. A guided target ends immediately when its transcript similarity reaches 80%, or after four attempts.";
  const explicitPronunciationRequest =
    mode === "TUTOR" &&
    !rolePlay &&
    isExplicitPronunciationRequest(learnerTranscript)
      ? `The learner explicitly requested pronunciation coaching. Remain the same general Han Tutor and use progressive, listen-first microcoaching rather than a lecture. This instruction overrides Tutor's normal request to teach meaning, usage, examples, and cultural context for this turn. ${
          classifyHanPronunciationRequestLength(learnerTranscript) === "long"
            ? "This target has more than 12 Mandarin syllables. Use at most 40 spoken words: pronounce the complete phrase naturally once, divide it into 2 to 4 natural prosodic groups, then choose only the FIRST 2-to-8-syllable group for this turn, preferring 2 to 6 syllables when that does not cut a natural expression. Demonstrate that group once slightly slower and ask the learner to repeat only that group. Practice later groups on later turns and recombine the whole phrase only after the chunks are comfortable. Never assess the whole long phrase as one undifferentiated contour."
            : classifyHanPronunciationRequestLength(learnerTranscript) ===
                "medium"
              ? "This target has 5 to 12 Mandarin syllables. Use at most 30 spoken words: pronounce the complete phrase naturally, group it into 2 or 3 audible rhythm units, give one useful tone or connection cue, and ask for one repetition of the complete phrase."
              : "This target has 1 to 4 Mandarin syllables, or its written length is unknown. Use at most 22 spoken words: pronounce the complete target naturally, give one useful tone or rhythm cue, and ask for one repetition of the complete target."
        } Do not explain meaning, translate, speak pinyin aloud, introduce another Mandarin example, or ask whether the learner wants to try; give the practice action directly. You may offer to explain the reason only after the drill has ended.`
      : null;

  if (rolePlay) {
    const effectiveRolePlay = sessionLevelOverride
      ? { ...rolePlay, level: sessionLevelOverride }
      : rolePlay;
    const tutorMode = effectiveRolePlay.correctionMode === "tutor";
    const journeyHelp = journeyPhase
      ? buildJourneyLanguageHelpInstruction(
          learnerTranscript ?? "",
          requiredLanguage,
        )
      : null;
    const usesTimedConversationMemory = rolePlayTurnStrategy === "direct";
    const recentDialogueMemory = compactRecentDialogue(conversationTranscript);
    const learnerNameEvidence = findLearnerNameEvidence(conversationTranscript);
    const mutualIntroduction = isMutualIntroductionRolePlay(effectiveRolePlay);
    const learnerIdentityMemory = usesTimedConversationMemory
      ? buildSpeakingLearnerIdentityMemory(conversationTranscript)
      : null;
    return [
      usesTimedConversationMemory
        ? `You are currently playing ${effectiveRolePlay.aiRole}. The learner's suggested starting role is ${effectiveRolePlay.learnerRole}; their later explicit self-description is authoritative for their own identity.`
        : `You are currently playing ${effectiveRolePlay.aiRole}; the learner is ${effectiveRolePlay.learnerRole}.`,
      `The active scenario is: ${effectiveRolePlay.scenarioContext}.`,
      `The active goal is: ${effectiveRolePlay.objective}.`,
      effectiveRolePlay.isFreeTopic
        ? "SCENE CONTRACT: The learner-authored topic and details are binding, not a loose theme. Resolve the roles exactly once: second-person 'you/eres/你' in the setup describes your character and first-person 'I/yo/我' describes the learner. If an explicit character role was selected, it remains authoritative. Keep one location, relationship, and current activity for the entire conversation."
        : null,
      buildSessionLevelInstruction(sessionLevelOverride),
      ...lessonLanguageConstraints(effectiveRolePlay, Boolean(journeyPhase)),
      ...(journeyPhase && journeyBanks
        ? [renderJourneySpeakingBanks(journeyBanks)]
        : []),
      "Respond only as that character inside this scenario.",
      `Respect speaker ownership every turn, not only the opening: speak as ${effectiveRolePlay.aiRole}, never on behalf of the learner. Sharing an occupation or status is allowed when actually established; role ownership does not mean the two people must have different occupations. Never produce the specific learner-owned action or message named by the goal. This is not a ban on all character questions: ask other new, relevant character-side questions when they make the exchange natural, provided they neither repeat a known fact nor say the learner's target content for them.`,
      usesTimedConversationMemory
        ? "Your character identity is immutable. Keep the occupation, status, relationship, name, nationality, and other personal facts established by the scenario or by your own earlier lines. A learner statement changes only the learner's facts, never yours."
        : null,
      usesTimedConversationMemory && recentDialogueMemory
        ? `COMPACT DIALOGUE MEMORY — ${recentDialogueMemory}. Treat every fact already supplied by either speaker as known, including names, origin, nationality, role, occupation, age, preferences, family, plans, times, places, choices, and reasons. Before asking any explicit question OR saying 你呢？, resolve the information it requests and verify its answer is not already present here. If known, that question is forbidden; react to it and choose one new relevant question or statement instead.`
        : null,
      learnerIdentityMemory,
      usesTimedConversationMemory && learnerTranscript
        ? `LATEST LEARNER TURN — ${JSON.stringify(learnerTranscript)}. Conversation priorities, in order: answer or react to THIS turn; preserve established speaker-specific facts; then create a relevant opportunity for lesson practice. The lesson objective is not a script and never justifies ignoring a new learner question or looping back to a previously asked question.`
        : null,
      effectiveRolePlay.isFreeTopic && recentDialogueMemory
        ? "SCENE CONTINUITY: Infer what is happening now from the scene contract and compact dialogue memory, then continue from that exact moment. Answer or react to the learner's latest move before adding one logical next beat. Never restart an introduction, re-announce that an activity will begin after it already began, jump to an unrelated activity or location, or alternate incoherently between actions such as walking and starting class."
        : null,
      usesTimedConversationMemory && learnerNameEvidence
        ? `LEARNER NAME STATUS: already answered in ${JSON.stringify(learnerNameEvidence)}. The learner's name is known for the rest of this session. Never ask their name again. FORBIDDEN from now on: 你呢？ after stating your own name, 你叫什么名字, or requesting a repetition just to reconfirm it. If no genuinely new relevant question remains, end with a brief natural statement instead of inventing a question.`
        : null,
      usesTimedConversationMemory
        ? "Never mirror the learner's identity merely to sound reciprocal. Use 也 only when both people truly share the fact. If you are a teacher and the learner says 我是学生, acknowledge the learner; never say 我也是学生 or 我也是新生. The same memory rule applies to every learner fact, not only their name: never ask it again explicitly or through 你呢？."
        : null,
      "Never ask a question or restate information you already said earlier in this conversation; always add something new instead of repeating yourself.",
      "React to the learner's actual meaning before advancing the objective. Sound like a present conversation partner, not an evaluator following a checklist: use a brief natural acknowledgement only when it adds warmth, then answer or continue the same thread.",
      "Prioritize conversational meaning over perfect pronunciation. If the learner is understandable from the audio plus this scene despite a minor tone or pronunciation error, respond naturally to the intended meaning and keep going; preserve the issue for end-of-session feedback instead of correcting it inside the scene.",
      "If pronunciation is genuinely ambiguous between meanings, ask one short in-character clarification. Never silently reinterpret a clearly different word, and never turn an understandable attempt into a drill.",
      effectiveRolePlay.isFreeTopic
        ? "Vary the shape of turns naturally. Do not force a question after every answer. A turn may be one short reaction, one answer, or one answer followed by one easy reciprocal cue."
        : "RECIPROCAL HANDOFF: This timed lesson is a two-way conversation. After a brief reaction or direct answer, use at most one short, natural, previously unasked question when it advances the same thread. Never force a question when it would repeat a known fact or perform the learner-owned objective action; in that case, end with a short in-character statement that leaves room for the learner to continue.",
      mutualIntroduction
        ? learnerNameEvidence
          ? "This is a mutual introduction, but the learner has ALREADY supplied their name. When you state your own name, do not append 你呢？ and do not ask for theirs again. Keep contributing naturally: if another relevant introduction fact about the learner is still unknown and the lesson language supports it, ask one short new question about that fact; otherwise give a brief statement that creates room for the learner's next objective move."
          : "This is genuinely a mutual introduction. After you contribute your own corresponding fact, a short reciprocal cue such as 你呢？ is allowed only because the learner has not given that fact yet."
        : "This is not an introduction exercise. Never ask the learner's name, where they are from, or another generic getting-to-know-you question unless the active scenario or objective explicitly requires it. Keep every question tied to the lesson topic.",
      learnerTranscript &&
      !journeyHelp &&
      isLikelyRealtimeLearnerQuestion(learnerTranscript)
        ? effectiveRolePlay.isFreeTopic
          ? `The learner just asked this question: ${JSON.stringify(learnerTranscript)}. Answer it directly in-character now. Give the actual answer before any other scene move; do not replace the answer with a question back.`
          : learnerNameEvidence &&
              /(?:名字|叫什么|怎么称呼)/u.test(learnerTranscript)
            ? `The learner just asked your name: ${JSON.stringify(learnerTranscript)}. Answer with your character's name directly. Their name is already known, so your complete answer MUST NOT contain 你呢？ or any request for their name. To keep the conversation alive, you may then ask at most one different, previously unasked introduction question whose answer is not in memory and whose language was studied; otherwise finish with one brief natural statement.`
            : `The learner just asked this question: ${JSON.stringify(learnerTranscript)}. Answer it directly in-character first. After the actual answer, add at most one short, relevant reciprocal question only if it continues the same thread without repeating known information or stealing the learner-owned objective action.`
        : null,
      tutorMode
        ? `Reply in-character in Mandarin first. Then, only if the learner's last turn had a clear pronunciation, tone, grammar, or word-choice mistake, briefly switch to ${requiredLanguage} and give one short, specific correction: what they said, what's correct, and how to say it. Keep the correction to one or two sentences, then let the conversation continue naturally. Skip the correction entirely when there was no clear mistake - never invent one.`
        : journeyPhase
          ? (journeyHelp ??
            `Stay in character in Mandarin by default. A request for help or an expression of not understanding pauses immersion: explain briefly in ${requiredLanguage === "Chinese" ? "the learner's explicitly requested Spanish or English, or the session help language" : requiredLanguage}. Do not ignore it or answer with another Mandarin question. Resume the scene once the learner is ready. No unsolicited correction or pronunciation drills.`)
          : "Output Mandarin Chinese only. Do not use English, Spanish, pinyin, translations, explanations, corrections, pronunciation feedback, or tutoring comments.",
      "Speak standard Mainland Mandarin (Putonghua) with natural Chinese tones and rhythm. Never speak or imitate Korean and never use Korean pronunciation or intonation.",
      effectiveRolePlay.isFreeTopic
        ? "Match the requested persona and emotional energy in your voice on every turn. An argument or disagreement should sound naturally firm, terse, and annoyed when appropriate, not friendly and neutral; never become abusive or unsafe."
        : null,
      effectiveRolePlay.isFreeTopic
        ? "Sound like spontaneous everyday Mandarin between real people, not a vocabulary drill, scripted questionnaire, or lesson narration. Respond to this exact moment, leave space for the learner, and never add tutoring filler merely to sound helpful."
        : null,
      effectiveRolePlay.level === "Pre-HSK"
        ? "This learner is Pre-HSK. Say exactly one tiny, immediately usable Mandarin phrase per turn, no more than 8 Chinese characters. Use only the most basic words; never give multiple facts, alternatives, examples, explanations, or more than one question."
        : journeyPhase
          ? "Normally use one or two short sentences and one coherent conversational move: a direct reaction or answer, with at most one easy optional question when useful. A requested hint stays tiny; never read a list or several teaching points. Do not compress or truncate the learner's chosen longer phrase to satisfy a character count."
          : `Use at most two very short sentences${effectiveRolePlay.level ? ` at the ${effectiveRolePlay.level} level` : ", beginner-level"}, no more than ${realtimeRolePlayCharacterLimit(effectiveRolePlay)} Chinese characters total. Make one coherent conversational move: a direct reaction or answer, optionally followed by one short reciprocal cue. Never produce a list of questions or several teaching points.`,
      "If the learner only says nihao or 你好, accept it naturally and continue the scene. Do not greet as Han or ask what they want to practice.",
      "Never reproduce the lesson's reference dialogue verbatim. Keep the exchange natural and guide it toward the active goal.",
      rolePlayTurnStrategy === "direct"
        ? journeyPhase
          ? buildJourneySpeakingPolicy(
              journeyPhase,
              effectiveRolePlay.journeyLevel,
            )
          : effectiveRolePlay.isFreeTopic
            ? "Continue this one live scene directly from the shared session history. Preserve its established roles, place, activity, and causal sequence; stay responsive and relaxed. The application timer, not this turn, decides when to close."
            : `Continue directly from the shared session history toward this objective: ${effectiveRolePlay.objective}. During the available time, create one natural opportunity at a time for the learner to use lesson vocabulary or grammar they have not yet attempted. Never name a target, coach the answer, or turn the scene into an oral exam. The application timer, not objective completion, decides when to close.`
        : effectiveRolePlay.isFreeTopic
          ? "The separate completion check already decided this exchange should continue. Add exactly one natural new thing; do not wrap up merely because the conversation is short or long."
          : `The separate completion check already found that the exact objective is not complete: ${effectiveRolePlay.objective}. Continue with exactly one useful next step toward it, never a filler question.`,
    ].join(" ");
  }

  const effectiveRequiredLanguage =
    mode === "PRACTICE" ? "Chinese" : requiredLanguage;
  const transcriptUserMessages = conversationTranscript
    .filter((message) => message.role === "user")
    .map((message) => message.content);
  const tutorUserMessages =
    learnerTranscript && transcriptUserMessages.at(-1) !== learnerTranscript
      ? [...transcriptUserMessages, learnerTranscript]
      : transcriptUserMessages;
  const tutorSessionPreferences =
    deriveHanTutorSessionPreferences(tutorUserMessages);

  return [
    `For this turn, the required explanation language is ${effectiveRequiredLanguage}${mode === "PRACTICE" ? " by default" : ""}.`,
    mode === "PRACTICE"
      ? `Use Chinese for the conversation by default. Only use ${requiredLanguage} if the learner just explicitly asked for an explanation in their own language - treat that as a rare, special exception for this one turn only, then return to Chinese.`
      : `Use ${effectiveRequiredLanguage} for the explanation and conversation.`,
    buildSessionLevelInstruction(sessionLevelOverride),
    mode !== "PRACTICE"
      ? buildTranslationTargetInstruction(learnerTranscript)
      : null,
    mode !== "PRACTICE"
      ? buildMandarinStudyItemInstruction(learnerTranscript)
      : null,
    mode === "TUTOR" && !rolePlay
      ? buildSentenceOrderingIntegrityInstruction(learnerTranscript)
      : null,
    mode === "TUTOR"
      ? "This is Tutor mode. Use progressive disclosure: answer the learner's exact need first and give only the minimum explanation that resolves this turn. A quick meaning or narrow usage question gets the direct answer, one useful boundary if needed, and at most one natural example. Only for an explicit broad request, teach meaning and context plus the simplest usage pattern; use two natural examples or a native-usage note only when each adds material value. Do not answer with pronunciation alone when the learner requested vocabulary or grammar, and never start a repetition drill unless pronunciation was explicitly requested."
      : "This is Han Practice: a real, warm conversation with Han as a companion, not a lesson, test, or drill. Output Simplified Chinese only by default. Talk like a real friend - react genuinely to what the learner shares, and offer warmth, encouragement, or a piece of advice when it's genuinely called for, proactively bringing up something from their real recent performance when relevant. Correct mistakes gently, mostly by modeling the correct form inside your own next line (a recast) instead of stopping to explain - give a short, explicit correction, in the learner's language if needed, only if the same kind of mistake clearly keeps repeating. Infer intended meaning from audio plus topic, prior turns, and learned language; when imperfect pronunciation is contextually understandable, respond to that meaning and continue naturally. Ask one short Mandarin clarification only when materially different meanings remain plausible.",
    "This is a free Han Tutor conversation: never reproduce a lesson's reference dialogue or invent a role-play objective.",
    sessionLevelOverride
      ? `Keep this turn genuinely at ${sessionLevelOverride}. Do not fall back to beginner material merely because the learner answered with a short acknowledgement.`
      : "Keep this turn appropriate for the learner level in the session instructions: use common vocabulary, one short idea, and one clear response opportunity. Simplify after hesitation; never jump to advanced Chinese.",
    "Treat short Mandarin or pinyin as practice, keep understandable attempts moving, and write Mandarin with Chinese characters, never pinyin.",
    mode === "TUTOR" ? HAN_TUTOR_INTELLIGENT_CORRECTION_POLICY : null,
    mode === "TUTOR"
      ? buildHanTutorTaskGroundingInstruction(
          learnerTranscript,
          tutorUserMessages,
        )
      : null,
    mode === "TUTOR"
      ? buildHanTutorSessionInstruction(tutorSessionPreferences)
      : null,
    explicitPronunciationRequest,
    pronunciationProgress,
    mode === "TUTOR"
      ? buildHanTutorControlCommandInstruction(learnerTranscript)
      : null,
    mode === "TUTOR"
      ? buildTutorPronunciationIdentityInstruction(
          practiceState,
          effectiveRequiredLanguage,
          learnerTranscript,
        )
      : null,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Placement needs a blocking evidence decision before it can safely advance or
 * close. Timed lesson/Lab Speaking does not: Reflection evaluates its saved
 * transcript afterward, so an extra text-model round trip would only make the
 * live conversation pause and sound mechanical.
 */
export function shouldBlockForRolePlayAssessment(
  completionPolicy: "timer" | "objective",
): boolean {
  return completionPolicy === "objective";
}

/**
 * Keeps the session-level Realtime instructions active while adding a
 * one-response turn guard. `response.create.response.instructions` would
 * replace the session instructions for that response, which would drop Han's
 * identity and the learner-adaptation context. A temporary system item adds
 * the turn-specific rules without masking the session prompt; the caller
 * deletes the item after `response.done`.
 */
export function buildSessionPreservingRealtimeTurnEvents(
  instructions: string,
  guardItemId: string,
) {
  return {
    guardEvent: {
      type: "conversation.item.create",
      item: {
        id: guardItemId,
        type: "message",
        role: "system",
        content: [
          {
            type: "input_text",
            text: `One-turn override. Follow this instruction for the next assistant response only: ${instructions}`,
          },
        ],
      },
    },
    responseEvent: {
      type: "response.create",
      response: {},
    },
  } as const;
}

/**
 * Reasserts the full Han session prompt after the browser's WebRTC data
 * channel is live. The Realtime server confirms this with `session.updated`;
 * callers should keep the microphone disabled until that confirmation.
 */
export function buildRealtimeSessionUpdateEvent(
  instructions: string,
  speechSpeed = 1,
) {
  return {
    type: "session.update",
    session: {
      type: "realtime",
      instructions,
      audio: {
        input: {
          // HanGo uses an explicit push-to-talk turn boundary. Keeping server
          // VAD disabled prevents room noise from creating learner turns while
          // the red talk button is not being held.
          turn_detection: null,
        },
        output: {
          speed: speechSpeed,
        },
      },
    },
  } as const;
}

export function findAcceptedMandarinTarget(
  learnerTranscript: string,
  history: readonly { role: "user" | "assistant"; content: string }[],
): string | null {
  const previousAssistant = [...history]
    .reverse()
    .find((message) => message.role === "assistant");
  if (!previousAssistant) return null;

  const candidates = [
    ...new Set(previousAssistant.content.match(/\p{Script=Han}+/gu) ?? []),
  ].sort((left, right) => right.length - left.length);

  return (
    candidates.find(
      (candidate) =>
        mandarinTargetSimilarity(learnerTranscript, candidate) >=
        PRONUNCIATION_ACCEPTANCE_THRESHOLD,
    ) ?? null
  );
}

export function advancePronunciationPractice(
  learnerTranscript: string,
  history: readonly { role: "user" | "assistant"; content: string }[],
  previousState: PronunciationPracticeState,
  explanationLanguage?: HanExplanationLanguage,
): {
  state: PronunciationPracticeState;
  progress: PronunciationPracticeProgress | null;
} {
  if (
    isExplicitPronunciationRequest(learnerTranscript) &&
    !isPronunciationDetailRequest(learnerTranscript)
  ) {
    const target = exactRequestedMandarinTarget(learnerTranscript);
    return {
      state: target
        ? newTutorPronunciationTarget(target, explanationLanguage)
        : {
            target: "",
            attempts: 0,
            completed: false,
            explanationLanguage,
            needsClarification: true,
          },
      progress: null,
    };
  }
  if (
    detectExplicitHanTutorLanguageRequest(learnerTranscript) &&
    !TUTOR_NEW_STUDY_REQUEST.test(learnerTranscript) &&
    !isHanTutorMeaningRequest(learnerTranscript)
  )
    return { state: previousState, progress: null };
  if (previousState?.needsClarification) {
    if (
      isHanTutorMeaningRequest(learnerTranscript) ||
      /(?:estructura|grammar|gramática|语法|结构|怎么用|如何用)/iu.test(
        learnerTranscript,
      )
    )
      return { state: null, progress: null };
    const selected =
      exactRequestedMandarinTarget(learnerTranscript) ??
      (/^[\p{Script=Han}。？！\s]+$/u.test(learnerTranscript)
        ? learnerTranscript.match(/\p{Script=Han}+/gu)?.join("")
        : null);
    if (selected)
      return {
        state: newTutorPronunciationTarget(
          selected,
          explanationLanguage ?? previousState.explanationLanguage,
        ),
        progress: null,
      };
    return { state: previousState, progress: null };
  }
  const target = previousState?.target ?? findPromptedMandarinTarget(history);
  const isTargetAttempt =
    target != null && isTutorTargetAttempt(learnerTranscript, target);
  // A substantive carrier-language turn or a question starts a new request,
  // even if Han's preceding reply happened to contain a repetition cue.
  // Pure Mandarin/pinyin attempts and short acknowledgements remain eligible.
  const isNewStudyRequest = TUTOR_NEW_STUDY_REQUEST.test(learnerTranscript);
  if (
    !isTargetAttempt &&
    (isNewStudyRequest ||
      isHanTutorMeaningRequest(learnerTranscript) ||
      isLikelyRealtimeLearnerQuestion(learnerTranscript))
  )
    return { state: null, progress: null };
  if (!target) return { state: null, progress: null };
  if (
    previousState?.completed &&
    (learnerTranscript.match(/\p{Script=Han}/gu)?.length ?? 0) >= 4 &&
    mandarinTargetSimilarity(learnerTranscript, target) < 0.5
  ) {
    return { state: null, progress: null };
  }
  // A language/pace control is not an attempt, and must not reset the target.
  if (!isTargetAttempt) return { state: previousState, progress: null };

  if (previousState?.target === target && previousState.completed) {
    // Once a target passes (or reaches the attempt cap), it is closed. Even if
    // a generated reply accidentally repeats its cue, do not reopen the same
    // drill and create the frustrating single-syllable loop.
    return { state: previousState, progress: null };
  }

  const attempts =
    previousState?.target === target
      ? Math.min(4, previousState.attempts + 1)
      : 1;
  const similarity = mandarinTargetSimilarity(learnerTranscript, target);
  const status =
    similarity >= PRONUNCIATION_ACCEPTANCE_THRESHOLD
      ? "accepted"
      : attempts >= 4
        ? "max_attempts"
        : "retry";
  const completed = status !== "retry";

  return {
    state: {
      ...previousState,
      target,
      attempts,
      completed,
      awaitingAttempt: !completed,
    },
    progress: { target, attempts, similarity, status },
  };
}

const TUTOR_REFERENCE_PINYIN: Readonly<Record<string, string>> = {
  吧: "ba (neutral tone)",
  吗: "ma (neutral tone, question particle)",
  妈: "mā (first tone, mother)",
  八: "bā (first tone)",
  把: "bǎ (third lexical tone)",
  被: "bèi (fourth tone)",
};

function newTutorPronunciationTarget(
  target: string,
  explanationLanguage?: HanExplanationLanguage,
): NonNullable<PronunciationPracticeState> {
  return {
    target,
    fullTarget: target,
    referencePinyin: TUTOR_REFERENCE_PINYIN[target] ?? null,
    explanationLanguage,
    attempts: 0,
    completed: false,
    awaitingAttempt: false,
  };
}

function exactRequestedMandarinTarget(message: string): string | null {
  const quoted = message
    .match(/[“"「]([\p{Script=Han}，。！？、；：\s]+)[”"」]/u)?.[1]
    ?.trim();
  if (quoted) return quoted;
  // Unquoted all-Chinese requests contain instructions as well as study content.
  // Do not guess which of those characters is the target.
  if (!/[a-záéíóúñ]/iu.test(message)) return null;
  const expressions =
    message.match(/\p{Script=Han}+(?:[，。！？、；：\s]+\p{Script=Han}+)*/gu) ??
    [];
  return expressions.length === 1 ? expressions[0]! : null;
}

function isTutorTargetAttempt(message: string, target: string): boolean {
  const value = message.trim();
  const pureMandarin = /^[\p{Script=Han}\p{Punctuation}\s]+$/u.test(value);
  const purePinyin =
    /^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5\p{Punctuation}\s]+$/iu.test(value);
  if (!pureMandarin && !purePinyin) return false;
  if (purePinyin && TUTOR_NEW_STUDY_REQUEST.test(value)) return false;
  if (mandarinTargetSimilarity(value, target) >= 0.5) return true;
  if (
    isHanTutorMeaningRequest(value) ||
    /(?:语法|结构|怎么用|如何用)/u.test(value)
  )
    return false;
  if (!isLikelyRealtimeLearnerQuestion(value)) return true;
  if (
    purePinyin &&
    !isLikelyRealtimeLearnerQuestion(value.replace(/[?？]/gu, ""))
  )
    return true;
  // Short interrogative syllables are also drill targets, not language changes.
  const count = value.match(/\p{Script=Han}/gu)?.length ?? 0;
  return (
    pureMandarin && count <= 2 && !/(?:什么|怎么|为什么|谁|哪里)/u.test(value)
  );
}

/** Register once after Han demonstrates a target. Active identity is immutable;
 * only a closed target plus a clearly announced next step can replace it. */
export function rememberTutorPronunciationResponse(
  assistantMessage: string,
  previousState: PronunciationPracticeState,
  explanationLanguage: HanExplanationLanguage,
): PronunciationPracticeState {
  // Until the learner identifies the character, an assistant guess is not evidence.
  if (previousState?.needsClarification) return previousState;
  const target = findPromptedMandarinTarget([
    { role: "assistant", content: assistantMessage },
  ]);
  if (!target) return previousState;
  if (previousState && !previousState.completed) {
    const isInitialChunk =
      previousState.awaitingAttempt === false &&
      previousState.attempts === 0 &&
      (previousState.fullTarget?.length ?? 0) > 12 &&
      previousState.fullTarget!.includes(target);
    if (target !== previousState.target && !isInitialChunk)
      return previousState;
    return {
      ...previousState,
      target,
      referencePinyin: TUTOR_REFERENCE_PINYIN[target] ?? null,
      awaitingAttempt: true,
    };
  }
  if (previousState) {
    if (target === previousState.target) return previousState;
    if (
      !/\b(?:next|another|different)\s+(?:word|target|phrase|syllable|sound|one|chunk)\b|\b(?:siguiente|otra|otro|nueva|nuevo)\s+(?:palabra|frase|sílaba|sonido|objetivo|grupo)\b|(?:ahora|now)\s+(?:vamos\s+con|practiquemos|practica|try|practice)\b|(?:seguimos|vamos|pasemos)\s+(?:con|a)\s*[:“"]?\p{Script=Han}|(?:接下来|下一个|另一)/iu.test(
        assistantMessage,
      )
    )
      return previousState;
    if (
      (previousState.fullTarget?.length ?? 0) > 12 &&
      !previousState.fullTarget!.includes(target)
    )
      return previousState;
  }
  return {
    ...newTutorPronunciationTarget(target, explanationLanguage),
    fullTarget: previousState?.fullTarget?.includes(target)
      ? previousState.fullTarget
      : target,
    awaitingAttempt: true,
  };
}

function buildTutorPronunciationIdentityInstruction(
  state: PronunciationPracticeState,
  language: HanExplanationLanguage,
  latestMessage?: string,
): string | null {
  if (
    state?.target &&
    !state.needsClarification &&
    latestMessage &&
    isHanTutorMeaningRequest(latestMessage)
  ) {
    const suppliedItems: string[] =
      latestMessage.match(/\p{Script=Han}+/gu) ?? [];
    if (suppliedItems.length > 0 && !suppliedItems.includes(state.target))
      return null;
    return `PAUSED TUTOR PRACTICE: the exact previously established study item is ${JSON.stringify(state.target)}. Answer its requested meaning in ${language}, not a homophone from an earlier mistaken assistant reply. Do not continue the drill or request another repetition. This turn is an explanation, not pronunciation grading.`;
  }
  if (
    !state &&
    latestMessage &&
    isExplicitPronunciationRequest(latestMessage) &&
    !isPronunciationDetailRequest(latestMessage)
  ) {
    const target = exactRequestedMandarinTarget(latestMessage);
    if (target) state = newTutorPronunciationTarget(target, language);
  }
  if (state && !state.needsClarification)
    return [
      `AUTHORITATIVE TUTOR PRACTICE STATE: exact target = ${JSON.stringify(state.target)}; explanation language = ${language}; status = ${state.completed ? "closed" : "active"}. This state overrides conflicting words in earlier assistant replies.`,
      state.referencePinyin
        ? `Reference pronunciation: ${state.referencePinyin}. This is lexical reference, NOT evidence of the learner's actual tones.`
        : "No verified phonetic reference is available here. Do not invent a tone diagnosis from the transcript.",
      state.completed
        ? "Never reopen this target. If continuing the requested practice, explicitly announce the different next target before demonstrating it."
        : state.awaitingAttempt === false && state.target.length > 12
          ? `The complete requested phrase is ${state.target}. For the first turn you may select one short exact contiguous chunk from this phrase; do not invent or substitute characters. After demonstrating that chunk, keep it as the current target until it closes.`
          : `Keep demonstrating ${state.target}, not a similar-sounding word. In particular 吗 and 妈 are different targets, never interchangeable. A repeated target with question punctuation is a practice attempt, not permission to change language.`,
      state.fullTarget && state.fullTarget !== state.target
        ? `Complete requested phrase: ${state.fullTarget}. Subsequent chunks must come from this exact phrase, not unrelated syllables.`
        : null,
      `Keep all coaching in ${language}; only the Mandarin practice material is Chinese. Similarity measures recognition only, never tone accuracy.`,
    ]
      .filter(Boolean)
      .join(" ");
  if (
    !state?.needsClarification &&
    (!isExplicitPronunciationRequest(latestMessage) ||
      isPronunciationDetailRequest(latestMessage))
  )
    return null;
  return `PRONUNCIATION TARGET CLARIFICATION: no single exact Mandarin target has been established. This clarification overrides demonstration and drill instructions for this turn. Untoned romanization such as ba can mean 吧, 八, or 把. Ask one short clarification in ${language} before choosing a character or starting a drill. Do not silently select a homophone or accept an earlier assistant guess as learner confirmation.`;
}

function findPromptedMandarinTarget(
  history: readonly { role: "user" | "assistant"; content: string }[],
): string | null {
  const previousAssistant = [...history]
    .reverse()
    .find((message) => message.role === "assistant");
  if (!previousAssistant) return null;

  // Only create a drill when Han actually asked for a pronunciation attempt.
  // This prevents ordinary role-play replies from being counted as drills.
  if (
    !/\b(?:repeat|try|say|pronounce|repite|intenta|intentar|inténtalo|di|decirlo|pronuncia)\b|(?:再说|再试|跟我|试着说|读一遍)/iu.test(
      previousAssistant.content,
    )
  )
    return null;

  const promptedAfterCue = previousAssistant.content.match(
    /(?:repeat|try|say|pronounce|repite|intenta|inténtalo|di|pronuncia|再说|再试|跟我|试着说|读一遍)[^\p{Script=Han}]{0,80}(\p{Script=Han}{1,48}(?:[，、\s]+\p{Script=Han}{1,48})*)/iu,
  )?.[1];
  if (promptedAfterCue) return promptedAfterCue;

  const safeCandidates = [
    ...new Set(previousAssistant.content.match(/\p{Script=Han}+/gu) ?? []),
  ].filter((candidate) => candidate.length <= 48);
  return safeCandidates.at(-1) ?? null;
}

function mandarinTargetSimilarity(
  learnerTranscript: string,
  target: string,
): number {
  const learnerHanzi = (
    learnerTranscript.match(/\p{Script=Han}+/gu) ?? []
  ).join("");
  if (!learnerHanzi || !target) return 0;
  if (target.length === 1) return learnerHanzi === target ? 1 : 0;
  if (learnerHanzi.includes(target) && target.length > 1) return 1;

  let best = 0;
  const minLength = Math.max(1, target.length - 1);
  const maxLength = Math.min(learnerHanzi.length, target.length + 1);
  for (let length = minLength; length <= maxLength; length++) {
    for (let start = 0; start + length <= learnerHanzi.length; start++) {
      const candidate = learnerHanzi.slice(start, start + length);
      const distance = levenshteinDistance(candidate, target);
      best = Math.max(
        best,
        1 - distance / Math.max(candidate.length, target.length),
      );
    }
  }
  return best;
}

function levenshteinDistance(left: string, right: string): number {
  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length] ?? Math.max(left.length, right.length);
}

export function buildRealtimeOpeningInstructions(
  rolePlay: RealtimeRolePlay,
): string {
  const openingLine =
    rolePlay.openingLine?.trim() ||
    (!rolePlay.isFreeTopic && isMutualIntroductionRolePlay(rolePlay)
      ? "你好。"
      : null);
  if (openingLine) {
    return [
      `Start the scene now as ${rolePlay.aiRole}.`,
      `Output exactly ${JSON.stringify(openingLine)} and nothing else.`,
      "Use standard Mainland Mandarin (Putonghua). Do not add a greeting, explanation, translation, pinyin, correction, or second sentence.",
      "Never end the scene during this opening turn.",
    ].join(" ");
  }
  return [
    `Start the scene now as ${rolePlay.aiRole}. The learner is ${rolePlay.learnerRole}.`,
    `Scenario: ${rolePlay.scenarioContext}.`,
    `Goal: ${rolePlay.objective}.`,
    ...lessonLanguageConstraints(rolePlay),
    "You speak first. Output Mandarin Chinese only, with no English, Spanish, pinyin, translation, correction, or explanation.",
    "Speak standard Mainland Mandarin (Putonghua), never Korean or Korean-accented Chinese.",
    ...(rolePlay.isFreeTopic
      ? [
          "Match the persona, relationship, and emotional energy requested by the scenario in your audible delivery. If it calls for an argument, disagreement, annoyance, urgency, or excitement, make that attitude clearly audible and natural instead of sounding cheerful and neutral; remain non-abusive and safe.",
        ]
      : []),
    `Respect role ownership: you are ${rolePlay.aiRole}, not ${rolePlay.learnerRole}. Never perform or ask the learner for an action, item, or service that only your own character should provide in this scenario.`,
    `Choose exactly ONE category for your entire opening turn: one short fact OR one short functional cue/question${rolePlay.level ? ` at the ${rolePlay.level} level` : " at beginner level"}. Use no more than ${realtimeRolePlayCharacterLimit(rolePlay)} Chinese characters. ${rolePlay.level === "Pre-HSK" ? "For Pre-HSK, use one tiny phrase with only the most basic words and stop immediately." : ""} Do not output only 你好 or 您好; make the single short line fit this character and scenario, while leaving the learner's objective action for the learner. A comma does not turn multiple details into one thing. Save every additional detail for a later turn, one new thing at a time, after the learner responds.`,
    "The goal describes what the learner must accomplish. Never say the learner's target phrase or perform their required action for them during the opening. If you are a waiter, clerk, receptionist, or other service provider, a simple greeting or welcome is safer than asking yourself whether the service or item is available.",
    "Never end the scene during the opening turn.",
    "Do not copy the lesson's reference dialogue verbatim.",
  ].join(" ");
}

export function buildRealtimeOpeningTurnGuard(
  rolePlay: Pick<RealtimeRolePlay, "objective"> &
    Partial<
      Pick<
        RealtimeRolePlay,
        "aiRole" | "scenarioContext" | "openingLine" | "isFreeTopic"
      >
    >,
): string | null {
  if (rolePlay.openingLine?.trim()) {
    const openingLine = rolePlay.openingLine.trim();
    return `This authored assessment opening is deterministic. Output exactly ${JSON.stringify(openingLine)} and nothing else. Do not add, remove, explain, translate, or paraphrase any part.`;
  }
  // A generic deterministic line discarded the learner's chosen persona and
  // emotional tone in Practice with Han. Let the persistent session prompt
  // create one short contextual opening for free-topic practice instead.
  if (rolePlay.isFreeTopic) return null;
  const roleContext = `${rolePlay.aiRole ?? ""} ${rolePlay.scenarioContext ?? ""} ${rolePlay.objective}`;
  const opening = isMutualIntroductionRolePlay(rolePlay)
    ? "你好。"
    : /\b(?:tell(?:ing)? (?:the )?time|say(?:ing)? (?:a |the )?date|day and time|suggest(?:ing)? (?:a |the )?(?:day|time)|meet for coffee|when to meet|schedule|what time)\b/iu.test(
          roleContext,
        )
      ? "你明天忙吗？"
      : /\b(?:waiter|server|clerk|cashier|shop assistant|salesperson|restaurant|store|shop)\b/iu.test(
            roleContext,
          )
        ? "欢迎光临。"
        : /\b(?:doctor|nurse|clinic|hospital)\b/iu.test(roleContext)
          ? "请坐。"
          : /\b(?:passerby|staff|receptionist|front desk|information desk|directions?|asks?|asking|help)\b/iu.test(
                roleContext,
              )
            ? "请说。"
            : "我们开始吧。";
  return `This opening is deterministic and contextual. Output exactly ${JSON.stringify(opening)} and nothing else. Your complete response must contain only these exact Chinese characters and punctuation: ${opening} Do not add a name, occupation, nationality, extra question, or second sentence.`;
}

export function buildRealtimeClosingInstructions(
  rolePlay: RealtimeRolePlay,
  journeyTranscript?: readonly RealtimeTranscriptMessage[],
  journeyBanks?: JourneySpeakingBanks,
  helpLanguage: HanExplanationLanguage = "English",
): string {
  if (rolePlay.closingLine?.trim()) {
    const closingLine = rolePlay.closingLine.trim();
    return [
      `End the scene now as ${rolePlay.aiRole}.`,
      `Output exactly ${JSON.stringify(closingLine)} and nothing else.`,
      "Do not add a question, explanation, translation, pinyin, correction, or second sentence.",
    ].join(" ");
  }
  return [
    `End the scene now naturally as ${rolePlay.aiRole}.`,
    `Scenario: ${rolePlay.scenarioContext}. Goal: ${rolePlay.objective}.`,
    ...lessonLanguageConstraints(rolePlay, Boolean(journeyTranscript)),
    ...(journeyTranscript && journeyBanks
      ? [renderJourneySpeakingBanks(journeyBanks)]
      : []),
    journeyTranscript
      ? "Output Mandarin by default. Only if the unanswered last turn explicitly requests language help, one tiny Spanish or English hint is permitted before the Mandarin goodbye."
      : "Output Mandarin Chinese only.",
    "Speak standard Mainland Mandarin (Putonghua), never Korean or Korean-accented Chinese.",
    journeyTranscript
      ? `This is a bounded final turn, not proof that the objective was achieved. Actual recent dialogue: ${compactRecentDialogue(journeyTranscript)}. If the last learner turn has not been answered, answer it briefly first, then say goodbye. Never confirm an order, agreement, identity or successful outcome not established by these speakers. Use at most two very short sentences, no final question, no new topic or teaching point.`
      : "This is the final audible line after the scene objective or natural endpoint was reached.",
    journeyTranscript
      ? "Say goodbye briefly in character at the level actually understood; a brief pending answer may precede it. Thank the learner when appropriate, without inventing an outcome."
      : "Use one very short sentence at the session's level that fits what just happened, such as confirming the outcome, thanking the learner, or saying goodbye in character.",
    journeyTranscript
      ? "Do not ask another question, introduce a new topic, give an unsolicited explanation, translation or correction, or mention that time is over."
      : "Do not ask another question, introduce a new topic, explain, translate, correct, or mention that time is over.",
    journeyTranscript?.at(-1)?.role === "user"
      ? buildJourneyLanguageHelpInstruction(
          journeyTranscript.at(-1)!.content,
          helpLanguage,
        )
      : null,
  ].join(" ");
}

export function nextHanExplanationLanguage(
  transcript: string,
  current: HanExplanationLanguage,
): HanExplanationLanguage {
  return detectHanTutorResponseLanguage(transcript, current);
}
