import type {
  JourneyQualityContext,
  JourneyQualityTarget,
} from "./journey-speaking-quality-candidate";
import { hasUncertainJourneyRecognition } from "./journey-speaking-attempt-contract";
import {
  scenarioActEvidenceRule,
  isScenarioActEvidenceRule,
  probeScenarioActEvidence,
  type ScenarioActEvidenceRule,
} from "./journey-speaking-quality-scenario-evidence";

export type JourneyActEvidenceRule =
  | "greetings-greet-v1"
  | "greetings-identify-v1"
  | "greetings-ask-name-v2"
  | "greetings-ask-origin-v1"
  | ScenarioActEvidenceRule;
type Topic = "name" | "origin";
type Clause = {
  kind:
    | "greeting"
    | "name"
    | "origin"
    | "ask-name"
    | "ask-origin"
    | "reciprocal"
    | "courtesy";
  topic?: Topic;
};
const bindings: Array<{
  rule: JourneyActEvidenceRule;
  labels: readonly string[];
}> = [
  {
    rule: "greetings-greet-v1",
    labels: [
      "Greet the other person",
      "Saludar a la otra persona",
      "Saludar de forma pertinente",
    ],
  },
  {
    rule: "greetings-identify-v1",
    labels: ["Say your own name", "Decir tu nombre", "Presentarse por nombre"],
  },
  {
    rule: "greetings-ask-name-v2",
    labels: [
      "Ask their name",
      "Preguntar su nombre",
      "Preguntar el nombre del interlocutor",
    ],
  },
  {
    rule: "greetings-ask-origin-v1",
    labels: [
      "Ask where they're from",
      "Preguntar de dónde es",
      "Preguntar el origen del interlocutor",
    ],
  },
];

/** Exact, lesson-specific editorial binding. These are pattern probes, not a
 * universal Chinese parser or an approval of meaning/grammar/pronunciation. */
export function journeyActEvidenceRule(
  lessonSlug: string,
  target: JourneyQualityTarget,
) {
  const scenario = scenarioActEvidenceRule(lessonSlug, target);
  if (scenario) return scenario;
  if (
    lessonSlug !== "foundations-greetings-and-introductions" ||
    target.kind !== "act"
  )
    return null;
  return (
    bindings.find((item) => item.labels.includes(target.text))?.rule ?? null
  );
}
function parse(text: string): Clause[] | null {
  // Reported speech, negation, quotations and complex forms are unresolved, not
  // learner errors. Do not claim an embedded question was addressed to the peer.
  if (text.length > 240 || /[“”"「」『』:：]/u.test(text)) return null;
  const parts = text
    .replace(/\s/gu, "")
    .split(/[，,。！!？?；;\n]/u)
    .filter(Boolean);
  if (!parts.length) return null;
  const clauses: Clause[] = [];
  for (const part of parts) {
    if (/^(?:你好|您好)$/u.test(part)) clauses.push({ kind: "greeting" });
    else if (/^很高兴认识你$/u.test(part)) clauses.push({ kind: "courtesy" });
    else if (/^(?:你|您)呢$/u.test(part)) clauses.push({ kind: "reciprocal" });
    else if (/^(?:请问)?(?:你|您)(?:叫什么(?:名字)?|的名字是什么)$/u.test(part))
      clauses.push({ kind: "ask-name", topic: "name" });
    else if (
      /^(?:请问)?(?:你|您)(?:是哪国人|是哪里人|来自哪里|从哪里来|是哪个国家的)$/u.test(
        part,
      )
    )
      clauses.push({ kind: "ask-origin", topic: "origin" });
    else if (
      /^(?:我叫|我的名字是)[\p{Script=Han}A-Za-z·]{1,12}$/u.test(part) &&
      !/(?:什么|谁|吗|哪|怎么|不是|不叫|叫你|叫什么)/u.test(part)
    )
      clauses.push({ kind: "name", topic: "name" });
    // Explicitly narrow nationality set, not a country whitelist for learners.
    // Unlisted origins remain reviewable, never incorrect/zero.
    else if (
      /^我是(?:中国|秘鲁|英国|美国|西班牙|墨西哥|日本|韩国|北京|上海)人$/u.test(
        part,
      ) ||
      (/^我来自[\p{Script=Han}]{1,12}$/u.test(part) &&
        !/(?:哪里|什么|不是|不来自|吗|呢|谁|怎么)/u.test(part))
    )
      clauses.push({ kind: "origin", topic: "origin" });
    else return null;
  }
  return clauses;
}
function reciprocalTopic(clauses: Clause[], previous?: string) {
  const last = clauses.at(-1);
  if (last?.kind !== "reciprocal") return null;
  const local = clauses.slice(0, -1).findLast((clause) => clause.topic);
  if (local) return local.topic!;
  if (!previous) return null;
  const partner = parse(previous);
  return partner?.findLast((clause) => clause.topic)?.topic ?? null;
}

export function probeJourneyActEvidence(
  rule: JourneyActEvidenceRule,
  quote: string,
  turnId: string,
  context: JourneyQualityContext,
): "PATTERN_SUPPORTED" | "EVIDENCE_MISMATCH" | "NEEDS_REVIEW" {
  if (isScenarioActEvidenceRule(rule))
    return probeScenarioActEvidence(rule, quote, turnId, context);
  const turn = context.turns.find((item) => item.id === turnId);
  if (
    !turn ||
    turn.role !== "user" ||
    hasUncertainJourneyRecognition(turn) ||
    !turn.content.includes(quote)
  )
    return "NEEDS_REVIEW";
  // A narrow citation may omit a negation, reported speaker or later topic.
  // Require the complete learner turn to be understood by this limited probe.
  const whole = parse(turn.content),
    clauses = parse(quote);
  if (!whole || !clauses) return "NEEDS_REVIEW";
  const previous = context.turns.find(
    (item) => item.role === "assistant" && item.sequence === turn.sequence - 1,
  );
  // A clipped 你呢 must not borrow a different referent from the preceding
  // partner after its own turn has already changed topic. Keep it unresolved.
  const clippedReciprocity =
    clauses.at(-1)?.kind === "reciprocal" && quote !== turn.content;
  const topic = clippedReciprocity
    ? null
    : reciprocalTopic(clauses, previous?.content);
  switch (rule) {
    case "greetings-greet-v1":
      return clauses.some((clause) => clause.kind === "greeting")
        ? "PATTERN_SUPPORTED"
        : "NEEDS_REVIEW";
    case "greetings-identify-v1":
      return clauses.some((clause) => clause.kind === "name")
        ? "PATTERN_SUPPORTED"
        : "NEEDS_REVIEW";
    case "greetings-ask-origin-v1":
      return clauses.some((clause) => clause.kind === "ask-origin") ||
        topic === "origin"
        ? "PATTERN_SUPPORTED"
        : "NEEDS_REVIEW";
    case "greetings-ask-name-v2":
      if (
        clauses.some((clause) => clause.kind === "ask-name") ||
        topic === "name"
      )
        return "PATTERN_SUPPORTED";
      return clauses.some((clause) => clause.kind === "name") &&
        !clauses.some(
          (clause) =>
            clause.kind === "reciprocal" || clause.kind.startsWith("ask-"),
        )
        ? "EVIDENCE_MISMATCH"
        : "NEEDS_REVIEW";
  }
}
