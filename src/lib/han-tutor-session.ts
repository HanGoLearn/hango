export type HanTutorLanguage = "English" | "Spanish" | "Chinese";

export type HanTutorCorrectionStyle = "flow" | "balanced" | "strict";
export type HanTutorSpeechPace = "slow" | "normal" | "fast";

export interface HanTutorSessionPreferences {
  /** Auto follows the learner's carrier language turn by turn. */
  language: "auto" | HanTutorLanguage;
  correctionStyle: HanTutorCorrectionStyle;
  speechPace: HanTutorSpeechPace;
}

export const DEFAULT_HAN_TUTOR_SESSION_PREFERENCES: HanTutorSessionPreferences =
  {
    language: "auto",
    correctionStyle: "balanced",
    speechPace: "normal",
  };

const SPANISH_CARRIER_WORDS =
  /\b(hola|cómo|qué|cuál|cuándo|dónde|quiero|puedo|dime|explica|por qué|porque|gracias|esto|eso|bien|mal|quieres|podemos|practicar|significa|español|chino|mandarín|frase|palabra|saludo|entiendo|parece|necesito|ayuda|también|pero|para|con|una|uno|el|la|los|las|que|me|mi|yo|tú|puedes|sería|debería|otra|vez)\b/giu;
const ENGLISH_CARRIER_WORDS =
  /\b(hello|hi|how|what|which|when|where|why|because|please|thanks|thank|tell|explain|practice|means|meaning|english|chinese|mandarin|sentence|word|greeting|understand|need|help|also|but|with|the|this|that|want|can|could|would|should|my|your|you|learn|again|sounds|think)\b/giu;

function matchCount(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

export function detectExplicitHanTutorLanguageRequest(
  message: string | undefined,
): HanTutorLanguage | null {
  const value = message?.trim() ?? "";
  if (!value) return null;

  if (
    /(?:expl[ií]ca(?:me|lo|melo)?|resp[oó]nde(?:me)?|cont[eé]sta(?:me)?|d[ií](?:me|melo)?|h[aá]bla(?:me)?|escr[ií]be(?:me)?|say|speak|answer|reply|explain|tell me|write)\b[^.!?。！？]{0,35}\b(?:en|in)\s+espa(?:ñ|n)ol\b|(?:用|说|解释成?)西班牙语/iu.test(
      value,
    )
  )
    return "Spanish";
  if (
    /(?:expl[ií]ca(?:me|lo|melo)?|resp[oó]nde(?:me)?|cont[eé]sta(?:me)?|d[ií](?:me|melo)?|h[aá]bla(?:me)?|escr[ií]be(?:me)?|say|speak|answer|reply|explain|tell me|write)\b[^.!?。！？]{0,35}\b(?:en|in)\s+(?:ingl[eé]s|english)\b|(?:用|说|解释成?)英语/iu.test(
      value,
    )
  )
    return "English";
  if (
    /(?:resp[oó]nde(?:me)?|cont[eé]sta(?:me)?|d[ií](?:me|melo)?|h[aá]bla(?:me)?|escr[ií]be(?:me)?|say|speak|answer|reply|tell me|write)\b[^.!?。！？]{0,35}\b(?:en|in)\s+(?:chino|mandar[ií]n|chinese|mandarin)\b|(?:用|说)中文|用汉语/iu.test(
      value,
    )
  )
    return "Chinese";
  return null;
}

/**
 * Detects the carrier language without treating a quoted Mandarin item as a
 * language switch. A short Mandarin attempt also keeps the prior explanation
 * language; a substantive Mandarin sentence/question establishes Chinese.
 */
export function detectHanTutorResponseLanguage(
  message: string | undefined,
  fallback: HanTutorLanguage,
  options: { pronunciationAttempt?: boolean } = {},
): HanTutorLanguage {
  const value = message?.trim() ?? "";
  if (!value) return fallback;
  const explicit = detectExplicitHanTutorLanguageRequest(value);
  if (explicit) return explicit;

  const spanishScore =
    matchCount(value, SPANISH_CARRIER_WORDS) +
    (/[¿¡áéíóúüñ]/iu.test(value) ? 2 : 0);
  const englishScore = matchCount(value, ENGLISH_CARRIER_WORDS);
  if (spanishScore > 0 || englishScore > 0) {
    return spanishScore >= englishScore ? "Spanish" : "English";
  }

  const hanzi = value.match(/\p{Script=Han}/gu)?.length ?? 0;
  if (hanzi === 0 || options.pronunciationAttempt) return fallback;
  const isMandarinQuestion =
    /[？?]/u.test(value) ||
    /(?:什么|谁|哪(?:里|儿|个|些)?|怎么|为什么|几|多少|吗|呢|是不是|有没有)/u.test(
      value,
    );
  const isSubstantiveMandarinTurn = hanzi >= 4 || /[。！]/u.test(value);
  return isMandarinQuestion || isSubstantiveMandarinTurn ? "Chinese" : fallback;
}

function sessionLanguageDirective(
  message: string,
): HanTutorSessionPreferences["language"] | null {
  if (
    /(?:solo|solamente|siempre|a partir de ahora)\s+(?:háblame|habla|respóndeme|responde|contéstame|contesta)\s+(?:solo\s+|solamente\s+)?(?:en\s+)?(?:chino|mandarín)|(?:only|always|from now on)\s+(?:speak|answer|reply|talk)\s+(?:to me\s+)?(?:only\s+)?(?:in\s+)?(?:chinese|mandarin)|只说中文|一直用中文|只用中文/iu.test(
      message,
    )
  )
    return "Chinese";
  if (
    /(?:solo|solamente|siempre|a partir de ahora)\s+(?:háblame|habla|respóndeme|responde|contéstame|contesta)\s+(?:solo\s+|solamente\s+)?(?:en\s+)?español|(?:only|always|from now on)\s+(?:speak|answer|reply|talk)\s+(?:to me\s+)?(?:only\s+)?(?:in\s+)?spanish|只说西班牙语|一直用西班牙语/iu.test(
      message,
    )
  )
    return "Spanish";
  if (
    /(?:solo|solamente|siempre|a partir de ahora)\s+(?:háblame|habla|respóndeme|responde|contéstame|contesta)\s+(?:solo\s+|solamente\s+)?(?:en\s+)?inglés|(?:only|always|from now on)\s+(?:speak|answer|reply|talk)\s+(?:to me\s+)?(?:only\s+)?(?:in\s+)?english|只说英语|一直用英语/iu.test(
      message,
    )
  )
    return "English";
  if (
    /(?:sigue|adáptate|usa)\s+(?:el\s+)?idioma\s+que\s+(?:yo\s+)?use|follow\s+(?:the\s+)?language\s+i\s+use|跟着我用的语言|自动切换语言/iu.test(
      message,
    )
  )
    return "auto";
  return null;
}

function correctionDirective(message: string): HanTutorCorrectionStyle | null {
  if (
    /(?:no|nunca)\s+me\s+corrijas|corr[ií]geme\s+menos|d[eé]jame\s+hablar|solo\s+(?:conversemos|hablemos)|(?:do not|don't|never)\s+correct\s+me|correct\s+me\s+less|just\s+(?:talk|let me speak)|别纠正我|少纠正|只聊天/iu.test(
      message,
    )
  )
    return "flow";
  if (
    /corr[ií]geme\s+(?:m[aá]s|todo|cada\s+error)|se[nñ][aá]lame\s+cada\s+error|correct\s+(?:me\s+)?(?:more|everything|every\s+(?:error|mistake))|多纠正|每个错误都纠正/iu.test(
      message,
    )
  )
    return "strict";
  if (
    /corrige\s+solo\s+(?:los\s+)?errores\s+importantes|corr[ií]geme\s+(?:normal|de\s+forma\s+equilibrada)|correct\s+only\s+(?:the\s+)?important\s+(?:errors|mistakes)|balanced\s+corrections?|只纠正重要错误/iu.test(
      message,
    )
  )
    return "balanced";
  return null;
}

function paceDirective(message: string): HanTutorSpeechPace | null {
  if (
    /habla\s+m[aá]s\s+despacio|ve\s+m[aá]s\s+despacio|speak\s+(?:more\s+)?slowly|slow\s+down|说慢一点|慢一点说/iu.test(
      message,
    )
  )
    return "slow";
  if (
    /habla\s+m[aá]s\s+r[aá]pido|speak\s+faster|speed\s+up|说快一点|快一点说/iu.test(
      message,
    )
  )
    return "fast";
  if (
    /(?:vuelve\s+a\s+)?velocidad\s+normal|habla\s+normal|normal\s+speed|speak\s+normally|正常速度|正常说/iu.test(
      message,
    )
  )
    return "normal";
  return null;
}

export function deriveHanTutorSessionPreferences(
  learnerMessages: readonly string[],
): HanTutorSessionPreferences {
  const preferences = { ...DEFAULT_HAN_TUTOR_SESSION_PREFERENCES };
  for (const message of learnerMessages) {
    const language = sessionLanguageDirective(message);
    const correctionStyle = correctionDirective(message);
    const speechPace = paceDirective(message);
    if (language) preferences.language = language;
    if (correctionStyle) preferences.correctionStyle = correctionStyle;
    if (speechPace) preferences.speechPace = speechPace;
  }
  return preferences;
}

export function resolveHanTutorConversationLanguage(
  learnerMessages: readonly string[],
  fallback: HanTutorLanguage,
  preferences: HanTutorSessionPreferences,
  options: { latestIsPronunciationAttempt?: boolean } = {},
): HanTutorLanguage {
  const latest = learnerMessages.at(-1);
  const explicitLatest = detectExplicitHanTutorLanguageRequest(latest);
  if (explicitLatest) return explicitLatest;
  if (preferences.language !== "auto") return preferences.language;

  let current = fallback;
  learnerMessages.forEach((message) => {
    current = detectHanTutorResponseLanguage(message, current, {
      pronunciationAttempt: options.latestIsPronunciationAttempt,
    });
  });
  return current;
}

export const HAN_TUTOR_INTELLIGENT_CORRECTION_POLICY = [
  "HAN TUTOR CORRECTION POLICY — silently choose exactly ONE response action for the latest learner turn: CONTINUE, RECAST, MICRO-CORRECT, CLARIFY, or PRONUNCIATION PRACTICE.",
  "The latest learner turn is authoritative. Never answer an earlier question after the learner introduces a new grammar, vocabulary, or task topic. Never begin with generic acknowledgements such as Claro, Entiendo, Perfecto, I understand, Sure, or their Chinese equivalents; begin with the useful answer.",
  "CONTINUE when meaning is clear and no correction materially helps. Respond to the meaning; do not manufacture feedback.",
  "RECAST a minor grammar or word-choice issue by naturally using the correct Mandarin in the reply without stopping the conversation to explain it.",
  "MICRO-CORRECT only one high-confidence, high-impact issue when it blocks or changes meaning, clearly repeats during this current conversation, or the learner explicitly requests correction. Give the natural corrected form and one short reason, then continue.",
  "CLARIFY with one short question when audio or meaning remains genuinely ambiguous. Never guess a specific pronunciation, tone, or grammar error from weak evidence.",
  "PRONUNCIATION PRACTICE only after an explicit request or accepted invitation. Use its dedicated one-cue/one-demonstration/one-action rules and stop the target at its acceptance threshold.",
  "During pronunciation practice, Mandarin repetitions are practice material, not a request to switch the explanation language. Keep coaching in the established Spanish or English language unless the learner explicitly requests a change. Preserve lexical tones: 被 is bèi, fourth tone, not a neutral-tone pause. Never invent a tone diagnosis from recognition text alone.",
  "Never stack corrections, produce a scorecard, summarize the turn as a report, or end with an unsolicited lesson recap. Han is the learner's on-demand helper, not an examiner.",
].join("\n");

function isMultipleChoiceTurn(message: string): boolean {
  return /(?:respuestas?|opciones?|alternativas?)\s+(?:son|:)|\bopci[oó]n\s*[a-d]\b|\b(?:answer|option)\s*[a-d]\b|(?:^|[\s,;])(?:a|b|c|d)[).,:]\s*\p{Script=Han}|por\s+qu[eé]\s+no\s+(?:ser[ií]a|es)\s+la?\s*[a-d]\b|why\s+(?:isn['’]?t|not)\s+(?:option\s+)?[a-d]\b/iu.test(
    message,
  );
}

function explicitMandarinStudyTopic(message: string): string[] {
  const asksAboutAnItem =
    /(?:estructura|gram[aá]tica|uso|c[oó]mo\s+se\s+(?:usa|utiliza)|c[oó]mo\s+usar|quiero\s+entender|quisiera\s+entender|explain\s+(?:the\s+)?(?:structure|grammar|use)|how\s+(?:do|does|is)\s+.+\s+used)/iu.test(
      message,
    );
  if (!asksAboutAnItem) return [];
  return [...new Set(message.match(/\p{Script=Han}{1,8}/gu) ?? [])];
}

/**
 * Keeps Tutor grounded when speech recognition produces questionable HSK
 * options, and makes an explicit new grammar/vocabulary request override the
 * preceding task. This is turn control only; Companion and role-play never use
 * it.
 */
export function buildHanTutorTaskGroundingInstruction(
  latestMessage: string | undefined,
  learnerMessages: readonly string[] = [],
): string | null {
  const latest = latestMessage?.trim() ?? "";
  if (!latest) return null;
  const asksAboutHan =
    /(?:types?|kinds?|tipos?|clases?)\s+(?:of\s+|de\s+)?han\b/iu.test(latest) ||
    (/\bhan\s+tutor\b/iu.test(latest) &&
      /what\s+can|how\s+(?:can\s+i\s+)?use|help\s+me\s+with|qu[eé]\s+(?:puedo|puede)|para\s+qu[eé]\s+sirve/iu.test(
        latest,
      ));
  if (asksAboutHan && !/\p{Script=Han}/u.test(latest)) {
    return [
      "HAN TUTOR CAPABILITIES: Han in this question refers to you, the existing HanGo tutor. Answer what the learner can work on with Han Tutor: Mandarin vocabulary and meaning, grammar and sentence structures, pronunciation practice (tones, syllables, rhythm), and help understanding or checking an exercise or sentence.",
      "Do not reinterpret 'types of Han' as types of Mandarin tones. Do not invent multiple Tutor personalities, selectable Tutor models, or a new feature. Give a short overview in the established explanation language and invite the learner to choose one topic. If they explicitly ask to compare HanGo products, distinguish the Tutor helper from the separate Han Companion conversation; otherwise keep the answer about this Tutor.",
    ].join(" ");
  }
  const studyItems = explicitMandarinStudyTopic(latest);
  if (studyItems.length > 0) {
    const itemList = studyItems.join(", ");
    return [
      `HIGHEST-PRIORITY TOPIC RESET: the learner's latest turn starts a NEW Mandarin study topic: ${itemList}. Answer this new request only. Do not continue, reinterpret, justify, or mention the previous multiple-choice question unless the learner explicitly connects the two topics.`,
      `Treat ${itemList} as exact Simplified Chinese study content, not as a Latin letter, answer-option label, homophone, or reference to an earlier option.`,
      studyItems.includes("被")
        ? "被 is the Mandarin passive marker bèi, never the letter or answer option B. Explain the requested passive construction directly: affected subject + 被 + agent (optional) + verb + result/complement."
        : null,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const messages =
    learnerMessages.at(-1) === latest
      ? learnerMessages
      : [...learnerMessages, latest];
  if (!messages.slice(-8).some(isMultipleChoiceTurn)) return null;

  return [
    "HIGHEST-PRIORITY MULTIPLE-CHOICE EVIDENCE RULE: identify the exact stem and every supplied option before choosing. Judge grammaticality and the semantic relationship to the stem; never select an option because it merely sounds optimistic, mentions the same time word, or contrasts superficially.",
    "Speech recognition may corrupt Mandarin. If an option is unnatural or internally incompatible — for example 会能好 or 很太… — say that the transcript is uncertain and ask for the exact characters or a screenshot. Never silently repair a garbled option and then claim the repaired version was supplied.",
    "Keep the answer stable across follow-ups unless the learner corrects the stem/options or you identify a concrete earlier mistake. If the answer changes, explicitly state what evidence changed and correct the earlier claim; never alternate between A and B without justification.",
    "Distinguish literal time words from the sentence's implication, advice, conditional meaning, or consequence. Never invent missing options or claim to know the original exam wording from a corrupted transcript.",
  ].join(" ");
}

export function buildHanTutorSessionInstruction(
  preferences: HanTutorSessionPreferences,
): string {
  const language =
    preferences.language === "auto"
      ? "Follow the learner's carrier language turn by turn: Spanish carrier speech gets Spanish explanation, English carrier speech gets English explanation, and substantive Mandarin conversation gets Mandarin. A Spanish or English carrier sentence may contain Mandarin; keep that Mandarin in Simplified Chinese without treating it as a language switch."
      : preferences.language === "Chinese"
        ? "The learner requested Chinese-only conversation for this session. Respond in Simplified Chinese without Spanish, English, translation, or spoken pinyin unless the learner explicitly overrides this for the latest turn."
        : `The learner requested ${preferences.language} as the session's explanation language. Use it for explanations while keeping Mandarin study content in Simplified Chinese, unless the learner explicitly overrides the latest turn.`;
  const correction =
    preferences.correctionStyle === "flow"
      ? "Correction style is FLOW: prioritize uninterrupted conversation. Recast silently when useful and correct explicitly only when meaning would otherwise be lost or the learner asks for correction."
      : preferences.correctionStyle === "strict"
        ? "Correction style is STRICT: identify one clear, useful error on each relevant learner turn, but never nitpick uncertain audio, stack several corrections, or turn the reply into a report."
        : "Correction style is BALANCED: let understandable minor errors pass or recast them; explicitly correct only one important or repeated, high-confidence issue.";
  const pace =
    preferences.speechPace === "slow"
      ? "The learner requested slower speech for this session. Speak clearly with natural phrase pauses, without distorting Mandarin tones or rhythm."
      : preferences.speechPace === "fast"
        ? "The learner requested faster speech for this session. Use natural fluent speed while keeping articulation clear."
        : "Use a natural conversational speaking pace.";

  return [
    "TEMPORARY HAN TUTOR SESSION PREFERENCES:",
    language,
    correction,
    pace,
    "These preferences belong only to the currently open Han Tutor conversation. Never claim to remember them from an earlier Tutor session and never transfer them to Han Companion, Learning Journey Speaking, Speaking Lab, or placement.",
  ].join("\n");
}

export function buildHanTutorControlCommandInstruction(
  latestMessage: string | undefined,
): string | null {
  const value = latestMessage?.trim() ?? "";
  if (!value) return null;
  if (
    /^(?:rep[ií]telo|repite(?:lo)?|otra\s+vez|repeat(?:\s+it)?|say\s+it\s+again|再说一遍|再说一次)[.!?。！？\s]*$/iu.test(
      value,
    )
  )
    return "HIGHEST-PRIORITY TURN CONTROL: the latest message is a direct repeat command. This overrides generic pronunciation-progress and broad-teaching rules for this turn. Repeat the immediately preceding useful Mandarin expression exactly once, then stop. Do not explain, translate, praise, add an example, or ask a question.";
  if (
    /divide\s+(?:la\s+)?frase|por\s+partes|sep[aá]ralo|break\s+it\s+(?:down|up)|split\s+(?:the\s+)?phrase|分开说|分成几部分/iu.test(
      value,
    )
  )
    return "HIGHEST-PRIORITY TURN CONTROL: the learner asked to divide the latest Mandarin target. This overrides generic pronunciation-progress and broad-teaching rules for this turn. Give only 2 to 4 natural prosodic groups, demonstrate each once, then recombine the full target once. Do not add a meaning lesson or a new example.";
  if (
    /compara\s+(?:c[oó]mo\s+)?lo\s+dije|comp[aá]ralo\s+con|compare\s+(?:how\s+i\s+said\s+it|my\s+attempt)|对比我说的|比较我的发音/iu.test(
      value,
    )
  )
    return "HIGHEST-PRIORITY TURN CONTROL: the learner asked for a comparison. This overrides generic pronunciation-progress and broad-teaching rules for this turn. State at most one high-confidence difference between the latest supported attempt and the target, demonstrate the target once, and stop. If evidence is insufficient, say so briefly instead of inventing an error.";
  if (
    /habla\s+m[aá]s\s+despacio|speak\s+(?:more\s+)?slowly|slow\s+down|说慢一点|慢一点说/iu.test(
      value,
    )
  )
    return "HIGHEST-PRIORITY TURN CONTROL: acknowledge the pace request through behavior, not commentary. This request is not a pronunciation attempt and must not advance an active drill. Answer the learner's actual intent slowly and clearly now. Do not explain that you changed speed.";
  return null;
}
