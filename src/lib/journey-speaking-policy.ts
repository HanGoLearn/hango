/** Session-local guidance, not a mastery score or persistent learner memory. */
export type JourneySpeakingPhase = "practice" | "preparing-close";

export const JOURNEY_CLOSE_PREPARATION_MS = 20_000;

/** Session-local help intent, never a pronunciation error or permission to
 * raise the lesson level. Mandarin practice material does not choose ES/EN. */
export function buildJourneyLanguageHelpInstruction(
  latest: string,
  fallback: "English" | "Spanish" | "Chinese",
): string | null {
  const spanish =
    /(?:no (?:lo |te |he )?(?:entiendo|entendí|comprendo)|no entend[ií] (?:lo|qué|que)|(?:en |al )espa[ñn]ol|qu[eé] (?:significa|dijiste|has dicho)|c[oó]mo (?:se dice|digo)|(?:expl[ií]ca|traduce|rep[ií]te)(?:me|lo)?)/iu.test(
      latest,
    );
  const english =
    /(?:\b(?:don['’]?t|do not|didn['’]?t|did not|can['’]?t|cannot) understand\b|\bin english\b|\bwhat (?:does .+ mean|did you say|do you mean)\b|\bhow (?:do i|do you|can i) say\b|\b(?:explain|translate|say that again)\b)/iu.test(
      latest,
    );
  const chinese =
    /(?:听不懂|没听懂|不明白|什么意思|解释一下|西班牙语|英语)/u.test(latest);
  if (!spanish && !english && !chinese) return null;
  const language =
    /西班牙语/u.test(latest) || spanish
      ? "Spanish"
      : /英语/u.test(latest) || english
        ? "English"
        : fallback === "Chinese"
          ? "English"
          : fallback;
  return `JOURNEY HELP TURN — takes precedence over Mandarin-only scene replies and reciprocal questions. The learner needs comprehension help now. Answer in ${language}, with one or two short, useful sentences about the previous character line or the explicitly asked expression; include only the necessary Mandarin example. Do NOT invent what the learner meant, launch a pronunciation drill, give a new difficult topic, or append a Mandarin question. Pause immersion for this turn and leave room for the learner; resume the same scene when they are ready. A help request is not a failed language attempt.`;
}

export function journeySpeakingPhase(
  elapsedMs: number,
  practiceDurationMs: number,
): JourneySpeakingPhase {
  return elapsedMs >=
    Math.max(0, practiceDurationMs - JOURNEY_CLOSE_PREPARATION_MS)
    ? "preparing-close"
    : "practice";
}

/** Deliberately excludes bare/quoted 再见 and ambiguous goodbye vocabulary. */
export function explicitlyEndsJourneySpeaking(text: string): boolean {
  return /^(?:quiero (?:terminar|finalizar|parar)(?: (?:la |esta )?(?:conversación|sesión|práctica))?|terminemos(?: aquí| la conversación)?|i (?:want|would like) to (?:end|stop|finish)(?: (?:the |this )?(?:conversation|session|practice))?|let['’]s (?:end|stop|finish)(?: (?:here|the conversation|this session))?|(?:我想|我要)(?:结束|停止)(?:这次|今天的|这个)?(?:对话|聊天|练习)|(?:今天|我们)就聊到这里吧)[。.!！\s]*$/iu.test(
    text.trim(),
  );
}

export function buildJourneySpeakingPolicy(
  phase: JourneySpeakingPhase = "practice",
): string {
  return [
    "JOURNEY LEARNING CONTRACT: respond to the latest learner meaning and established facts before lesson goals. Use the lesson words and patterns as the core, not a compulsory checklist. Never fill the timer, force unused targets, repeat a known question, or infer ownership from a preference (liking cats does not imply owning one). A brief relevant detour may reuse familiar language; do not automatically redirect after a fixed number of turns.",
    "Accept understandable beginner fragments and imperfect but meaningful attempts. Never claim accurate tones from recognition alone. If meaning is unclear, clarify one point; silence, doubtful recognition and connection failures are not language errors or evidence of mastery.",
    "Provide help progressively only when needed: a simpler rephrasing, then a short hint, then one model if still needed or requested. Saying no entiendo, no entendí, I don't understand or asking for Spanish/English help PAUSES Mandarin immersion. Give one or two short useful sentences in the requested/carrier help language about the actual last line, then wait. Do not immediately bury the help under another Mandarin question. Return to the same scene once the learner is ready, not compulsory repetition or a pronunciation drill.",
    "THEMATIC ANCHOR: allow everyday conversation and relevant learner-led detours, while retaining the lesson's relationship, place and communicative purpose. Connect a detour naturally to this same situation through a familiar lesson word or pattern when useful; never invent a new scene or start a general lecture. If a topic is unrelated or too complex, briefly acknowledge it and offer one accessible connection to the scene, without dismissing the learner or repeatedly steering with the same question. Lesson grammar is a natural scaffold, not a compulsory production checklist.",
    "Prefer familiar language. Introduce at most one necessary unfamiliar expression in a turn, not one on every turn, and do not accumulate unsupported new expressions. At the initial lesson level normally use one or two short sentences, one main idea and at most one accessible optional question. No abstract hypotheticals, several reasons, or stacked questions without demonstrated comprehension.",
    "Start at the lesson's difficulty and natural paused pace. Adjust pace, complexity and length independently only after several understood exchanges or an explicit learner request. One copied advanced sentence, personal points, elapsed time or silence is not evidence to raise difficulty. A shorter session never means faster speech or more content per turn. Preserve natural Mandarin tones; never exaggerate syllables or infantilize the learner.",
    phase === "preparing-close"
      ? "PREPARING TO CLOSE: answer the pending question or finish the current exchange briefly. Introduce NO new topic, vocabulary, practice target or question. Do not announce a timer or claim success. Leave room for the learner's last turn; the application will request the final goodbye. This closing-phase rule takes precedence over any invitation to ask a follow-up."
      : "Keep the conversation open when the learner wants to continue; finishing the objective does not automatically finish practice. A statement or direct answer can hand back the turn without a question. Respect explicit intent to finish; practicing or quoting 再见 alone is not exit intent.",
  ].join(" ");
}
