import type { RolePlayContext } from "@/lib/ai-context";
import type { SpeakingTranscriptMessage } from "@/lib/reflection-prompt";
import {
  DEFAULT_SPEAKING_FEEDBACK,
  parseSpeakingFeedback,
  type SpeakingFeedback,
} from "@/lib/speaking-feedback";

export type PlacementSpeakingLevel = 3 | 4 | 5 | 6 | 7;

export interface PlacementSpeakingScenario {
  level: PlacementSpeakingLevel;
  title: string;
  rolePlay: RolePlayContext;
}

export interface PlacementSpeakingEvaluation extends SpeakingFeedback {
  objectiveCompletionRatio: number;
  score: number;
}

/** Raised from 70 to 80 (2026-08-19, matching the written exam's level-gate redesign to the same 80% bar - project/TASKS.md's "Placement exam — adaptive engine redesign" section). */
export const PLACEMENT_SPEAKING_PASS_SCORE = 80;
export const PLACEMENT_SPEAKING_MIN_TURNS = 2;
export const PLACEMENT_SPEAKING_MAX_TURNS = 5;

export const PLACEMENT_SPEAKING_SCENARIOS: Record<
  PlacementSpeakingLevel,
  PlacementSpeakingScenario
> = {
  3: {
    level: 3,
    title: "Weekend plans with a friend",
    rolePlay: {
      aiRole: "your friend",
      learnerRole: "yourself",
      scenarioContext:
        "You and your friend are deciding what to do this weekend — go hiking or stay in and watch a movie.",
      objective:
        "State a preference with at least one reason (因为), and respond to the friend's counter-suggestion — agree, compromise, or politely disagree.",
      openingLine: "这个周末你想在家休息休息，还是想出去运动？",
      characterChallenge: "可是在家看电影很轻松而且不会淋雨。",
      closingLine: "好，就这么决定吧。",
      successCriteria: [
        "The learner states a clear preference.",
        "The learner gives at least one reason using 因为.",
        "After the character offers a genuine counter-suggestion, the learner agrees, compromises, or politely disagrees.",
      ],
      level: "HSK 3",
      lessonHskLevel: 3,
      pace: "normal",
    },
  },
  4: {
    level: 4,
    title: "A dip in team efficiency",
    rolePlay: {
      aiRole: "your colleague",
      learnerRole: "yourself",
      scenarioContext:
        "Your team's work efficiency has dropped recently, and your colleague wants your take on why, and what to do about it.",
      objective:
        "Identify at least one possible cause, propose at least one solution, and respond to a mild pushback from the colleague using comparison or concession language (比较 / 虽然...但是 / 不过).",
      openingLine: "最近咱们团队的效率好像下降了，你觉得是为什么？",
      characterChallenge: "不过改工作流程不是会花更多时间吗？",
      closingLine: "好，那我们先试试这个办法。",
      successCriteria: [
        "The learner identifies at least one plausible cause.",
        "The learner proposes at least one concrete solution.",
        "After the character gives mild pushback, the learner responds using 比较, 虽然...但是, or 不过.",
      ],
      level: "HSK 4",
      lessonHskLevel: 4,
      pace: "normal",
    },
  },
  5: {
    level: 5,
    title: "Should young people live with their parents?",
    rolePlay: {
      aiRole: "an acquaintance with a differing opinion",
      learnerRole: "yourself",
      scenarioContext:
        "A casual but real debate about the social trend of young people living independently from their parents.",
      objective:
        "State and defend a position with reasoning, acknowledge at least one valid point from the other side (承认/不过), without simply agreeing to end the conversation.",
      openingLine: "现在很多年轻人不愿意跟父母住，你怎么看？",
      characterChallenge: "可是跟父母住既能互相照顾又能省钱。",
      closingLine: "我明白你的看法了，谢谢你跟我聊。",
      successCriteria: [
        "The learner states a clear position and defends it with reasoning.",
        "After the character states a valid opposing point, the learner acknowledges it using 承认, 不过, or an equivalent concession.",
        "The learner preserves a nuanced position instead of simply agreeing to end the disagreement.",
      ],
      level: "HSK 5",
      lessonHskLevel: 5,
      pace: "normal",
    },
  },
  6: {
    level: 6,
    title: "Defending a position under scrutiny",
    rolePlay: {
      aiRole: "a skeptical colleague or reviewer",
      learnerRole: "yourself, presenting an idea or theory",
      scenarioContext:
        "The learner has proposed an idea, plan, theory, or method and must defend it against genuine, substantive pushback about its limitations.",
      objective:
        "Acknowledge the theory/plan's real limitations honestly (局限性) while still making a coherent case for its value, using at least one concessive structure (虽...但/可/却).",
      openingLine: "这个想法听起来不错，不过你觉得它有没有局限性？",
      characterChallenge: "但团队可能因为培训成本太高而不接受。",
      closingLine: "好，我们先做小范围试验。",
      successCriteria: [
        "The learner honestly identifies a real limitation or 局限性.",
        "The learner makes a coherent case for the idea's value despite that limitation.",
        "The learner naturally uses a concessive structure such as 虽...但, 可, or 却.",
      ],
      level: "HSK 6",
      lessonHskLevel: 6,
      pace: "normal",
    },
  },
  7: {
    level: 7,
    title: "Is disruption overrated?",
    rolePlay: {
      aiRole: "a debate partner with a genuinely opposing, well-reasoned view",
      learnerRole: "yourself",
      scenarioContext:
        "An abstract discussion of whether disruptive innovation is more valuable than gradual improvement — the kind of conversation a fluent adult speaker has, not a scripted exchange.",
      objective:
        "Construct a nuanced argument (not just pro/con), use at least one advanced discourse connector (连...都/宁可...也不/更不用说) naturally, and engage substantively with the counterargument rather than deflecting it.",
      openingLine: "你觉得真正的创新一定要颠覆原来的范式吗？",
      characterChallenge:
        "可是渐进式改进可能只优化旧框架而错过真正的突破。",
      closingLine: "我明白你的观点了，谢谢这次讨论。",
      successCriteria: [
        "The learner constructs a nuanced argument rather than a simple pro/con claim.",
        "The learner naturally uses 连...都, 宁可...也不, 更不用说, or an equally advanced discourse connector.",
        "The learner engages substantively with the character's counterargument instead of deflecting it.",
      ],
      level: "HSK 7-9",
      lessonHskLevel: 7,
      pace: "normal",
    },
  },
};

export function placementSpeakingStartLevel(levels: readonly (number | null)[]):
  | PlacementSpeakingLevel
  | null {
  if (levels.some((level) => level == null)) return null;
  const lowest = Math.min(...(levels as number[]));
  if (lowest < 3) return null;
  return Math.min(lowest, 7) as PlacementSpeakingLevel;
}

export function nextPlacementSpeakingLevel(
  current: PlacementSpeakingLevel,
): PlacementSpeakingLevel | null {
  return current >= 7 ? null : ((current + 1) as PlacementSpeakingLevel);
}

export function computePlacementSpeakingScore(feedback: {
  pronunciation: number;
  fluency: number;
  accuracy: number;
  complexity: number;
  communicationEffectiveness: number;
  objectiveCompletionRatio: number;
}): number {
  const baseAverage =
    (feedback.pronunciation +
      feedback.fluency +
      feedback.accuracy +
      feedback.complexity +
      feedback.communicationEffectiveness) /
    5;
  return Math.round(baseAverage * feedback.objectiveCompletionRatio);
}

export function buildPlacementSpeakingEvaluationPrompt(
  scenario: PlacementSpeakingScenario,
  transcript: readonly SpeakingTranscriptMessage[],
  learnerTurnConfidences: readonly number[] = [],
): string {
  const transcriptText = transcript
    .map(
      (message) =>
        `${message.role === "user" ? "LEARNER" : "CHARACTER"}: ${message.content}`,
    )
    .join("\n");
  const averageConfidence = learnerTurnConfidences.length
    ? learnerTurnConfidences.reduce((sum, value) => sum + value, 0) /
      learnerTurnConfidences.length
    : null;

  return [
    "You are grading one adaptive Mandarin placement-exam speaking conversation.",
    `Target band: ${scenario.rolePlay.level}. Scenario: ${scenario.title}.`,
    `Learner objective: ${scenario.rolePlay.objective}`,
    `Observable success checklist: ${JSON.stringify(scenario.rolePlay.successCriteria ?? [])}.`,
    "Transcript (speech-to-text; grade LEARNER turns only):",
    transcriptText || "(empty)",
    averageConfidence == null
      ? "No aggregate speech-recognition confidence was available. Be conservative about pronunciation and never invent a tone error."
      : `Average normalized speech-recognition confidence across learner turns: ${averageConfidence.toFixed(3)}. Use it only as a weak pronunciation signal, never as proof of a specific tone error.`,
    "",
    "Score these five dimensions from 0 to 100 using demonstrated evidence only:",
    "- pronunciation: intelligibility suggested by successful transcription and the confidence signal. Do not claim phonetic certainty or diagnose a specific tone without audio evidence.",
    "- fluency: continuity, responsiveness, natural turn-taking, and ability to sustain the exchange.",
    "- accuracy: grammatical and lexical correctness while remaining comprehensible.",
    `- complexity: whether the learner actually produces language at ${scenario.rolePlay.level}, including the scenario's required reasoning or discourse structure. Beginner phrases alone cannot earn a passing complexity score at this band.`,
    "- communicationEffectiveness: whether the learner understands, answers, and advances this exact interaction.",
    "Also return objectiveCompletionRatio from 0 to 1. Grade each checklist item separately from direct LEARNER evidence. Character prompting or language never counts as learner completion.",
    "A short greeting, evasion, or unfinished exchange receives no participation baseline. A relevant but incomplete attempt may receive partial credit.",
    "Write concise English notes and one next step. Return up to 6 specific mistakes; never invent a tones mistake from transcript-only evidence.",
    "Return JSON only:",
    '{"pronunciation":number,"fluency":number,"accuracy":number,"complexity":number,"communicationEffectiveness":number,"objectiveCompletionRatio":number,"notes":string,"recommendedNextStep":string,"mistakes":[{"category":"pronunciation|grammar|vocabulary|context|response|fluency","evidence":string,"feedback":string}]}',
  ].join("\n");
}

export function parsePlacementSpeakingEvaluation(
  raw: string,
): PlacementSpeakingEvaluation {
  const base = parseSpeakingFeedback(raw);
  const match = raw.match(/\{[\s\S]*\}/u);
  if (base === DEFAULT_SPEAKING_FEEDBACK || !match) {
    return { ...DEFAULT_SPEAKING_FEEDBACK, objectiveCompletionRatio: 0, score: 0 };
  }
  try {
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const ratio = parsed.objectiveCompletionRatio;
    if (
      typeof ratio !== "number" ||
      !Number.isFinite(ratio) ||
      ratio < 0 ||
      ratio > 1
    ) {
      return { ...base, objectiveCompletionRatio: 0, score: 0 };
    }
    return {
      ...base,
      objectiveCompletionRatio: ratio,
      score: computePlacementSpeakingScore({
        ...base,
        objectiveCompletionRatio: ratio,
      }),
    };
  } catch {
    return { ...DEFAULT_SPEAKING_FEEDBACK, objectiveCompletionRatio: 0, score: 0 };
  }
}
