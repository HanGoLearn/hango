import type { RolePlayContext } from "@/lib/ai-context";

export type SpeakingPronunciationIssueCategory =
  "tone" | "pronunciation" | "ambiguity";

export interface SpeakingPronunciationIssue {
  category: SpeakingPronunciationIssueCategory;
  evidence: string;
  feedback: string;
  confidence: number;
}

export interface SpeakingTurnEvidence {
  turnIndex: number;
  rawTranscript: string;
  interpretedTranscript: string;
  transcriptionConfidence: number | null;
  understanding: "clear" | "context_resolved" | "uncertain";
  issue: SpeakingPronunciationIssue | null;
}

const MAX_EVIDENCE_TURNS = 20;
const MAX_TEXT_LENGTH = 240;

function canonicalText(value: string): string {
  return value
    .toLocaleLowerCase("zh")
    .replace(/[^\p{Letter}\p{Number}]/gu, "")
    .trim();
}

function clampConfidence(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value));
}

export function createSpeakingTurnEvidence(
  turnIndex: number,
  rawTranscript: string,
  interpretedTranscript: string,
  transcriptionConfidence: number | null,
): SpeakingTurnEvidence {
  const confidence = clampConfidence(transcriptionConfidence);
  const contextResolved =
    canonicalText(rawTranscript) !== canonicalText(interpretedTranscript);
  const uncertain = confidence !== null && confidence < 0.45;

  return {
    turnIndex,
    rawTranscript: rawTranscript.trim().slice(0, MAX_TEXT_LENGTH),
    interpretedTranscript: interpretedTranscript
      .trim()
      .slice(0, MAX_TEXT_LENGTH),
    transcriptionConfidence: confidence,
    understanding: uncertain
      ? "uncertain"
      : contextResolved
        ? "context_resolved"
        : "clear",
    // STT uncertainty is not proof of a pronunciation error. The Realtime
    // audio review below may add an issue only when it can hear one clearly.
    issue: null,
  };
}

export function buildSpeakingEvidenceReviewInstructions(
  rolePlay: RolePlayContext,
  turns: readonly SpeakingTurnEvidence[],
): string {
  const turnList = turns
    .slice(0, MAX_EVIDENCE_TURNS)
    .map(
      (turn) =>
        `${turn.turnIndex}. interpreted=${JSON.stringify(turn.interpretedTranscript)}; raw_STT=${JSON.stringify(turn.rawTranscript)}; STT_confidence=${turn.transcriptionConfidence ?? "unavailable"}`,
    )
    .join("\n");

  return [
    "This is a silent end-of-session Speaking evidence review. Do not continue the conversation and do not address the learner.",
    "Review only the learner's actual audio turns already present in this Realtime conversation. Use the transcript and scenario as context, but acoustic audio is the evidence for pronunciation and tones.",
    `Scenario: ${rolePlay.scenarioContext}. Learner role: ${rolePlay.learnerRole}. Goal: ${rolePlay.objective}.`,
    `Expected lesson vocabulary: ${rolePlay.lessonVocabulary?.join(", ") || "no fixed list"}.`,
    `Expected lesson grammar: ${rolePlay.lessonGrammar?.join("; ") || "no fixed list"}.`,
    "The app may have interpreted an understandable imperfect attempt as its intended Mandarin so the conversation could continue. Preserve that intended meaning, but report a separate issue when the audio clearly demonstrates one.",
    "If a minor tone/pronunciation issue did not change comprehensibility, mark understood=true and report the issue. If the audio is genuinely ambiguous between meanings, use category=ambiguity. Never infer an error from low STT confidence alone, room noise, accent, or transcript spelling. Never invent a tone issue when the audio is insufficient.",
    "Return at most one highest-value issue per learner turn. Omit turns with no clear issue.",
    "Learner turn index and app interpretation:",
    turnList || "(no learner turns)",
    "Return ONLY JSON in this exact shape:",
    '{"turns":[{"turnIndex":1,"intendedText":"简体中文","understood":true,"issue":{"category":"tone|pronunciation|ambiguity","evidence":"short factual description","feedback":"short actionable advice","confidence":0.0}}]}',
  ].join("\n");
}

export function parseSpeakingEvidenceReview(
  raw: string,
  seedTurns: readonly SpeakingTurnEvidence[],
): SpeakingTurnEvidence[] {
  const seeds = seedTurns.slice(0, MAX_EVIDENCE_TURNS).map((turn) => ({
    ...turn,
    issue: turn.issue ? { ...turn.issue } : null,
  }));
  const jsonMatch = raw.match(/\{[\s\S]*\}/u);
  if (!jsonMatch) return seeds;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { turns?: unknown };
    if (!Array.isArray(parsed.turns)) return seeds;
    const byIndex = new Map(seeds.map((turn) => [turn.turnIndex, turn]));

    for (const item of parsed.turns.slice(0, MAX_EVIDENCE_TURNS)) {
      if (!item || typeof item !== "object") continue;
      const candidate = item as Record<string, unknown>;
      const turnIndex = candidate.turnIndex;
      if (typeof turnIndex !== "number" || !Number.isInteger(turnIndex))
        continue;
      const seed = byIndex.get(turnIndex);
      if (!seed) continue;
      const issue = candidate.issue;
      if (!issue || typeof issue !== "object") continue;
      const issueRecord = issue as Record<string, unknown>;
      const category = issueRecord.category;
      const evidence = issueRecord.evidence;
      const feedback = issueRecord.feedback;
      const confidence = clampConfidence(issueRecord.confidence);
      if (
        (category !== "tone" &&
          category !== "pronunciation" &&
          category !== "ambiguity") ||
        typeof evidence !== "string" ||
        typeof feedback !== "string" ||
        confidence === null ||
        confidence < 0.6
      )
        continue;

      const intendedText = candidate.intendedText;
      seed.interpretedTranscript =
        typeof intendedText === "string" && intendedText.trim()
          ? intendedText.trim().slice(0, MAX_TEXT_LENGTH)
          : seed.interpretedTranscript;
      seed.understanding =
        candidate.understood === false ? "uncertain" : "context_resolved";
      seed.issue = {
        category,
        evidence: evidence.trim().slice(0, MAX_TEXT_LENGTH),
        feedback: feedback.trim().slice(0, MAX_TEXT_LENGTH),
        confidence,
      };
    }

    return seeds;
  } catch {
    return seeds;
  }
}

export function speakingEvidenceForPrompt(
  evidence: readonly SpeakingTurnEvidence[],
): string {
  const useful = evidence
    .filter((turn) => turn.issue)
    .slice(0, 8)
    .map((turn) => {
      const issue = turn.issue!;
      return `Turn ${turn.turnIndex}: intended ${turn.interpretedTranscript}; ${issue.category}; ${issue.evidence}; advice: ${issue.feedback}; evidence confidence ${issue.confidence.toFixed(2)}.`;
    });
  return useful.length > 0
    ? useful.join("\n")
    : "No high-confidence audio-derived pronunciation or tone issue was captured.";
}

/** Server-action boundary: keep only the small, known evidence shape. */
export function sanitizeSpeakingTurnEvidence(
  value: unknown,
): SpeakingTurnEvidence[] {
  if (!Array.isArray(value)) return [];
  const sanitized: SpeakingTurnEvidence[] = [];
  for (const item of value.slice(0, MAX_EVIDENCE_TURNS)) {
    if (!item || typeof item !== "object") continue;
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.turnIndex !== "number" ||
      !Number.isInteger(candidate.turnIndex)
    )
      continue;
    if (
      typeof candidate.rawTranscript !== "string" ||
      typeof candidate.interpretedTranscript !== "string"
    )
      continue;
    const confidence = clampConfidence(candidate.transcriptionConfidence);
    const understanding = candidate.understanding;
    if (
      understanding !== "clear" &&
      understanding !== "context_resolved" &&
      understanding !== "uncertain"
    )
      continue;

    const seed = createSpeakingTurnEvidence(
      candidate.turnIndex,
      candidate.rawTranscript,
      candidate.interpretedTranscript,
      confidence,
    );
    seed.understanding = understanding;
    const issue = candidate.issue;
    if (issue && typeof issue === "object") {
      const issueRecord = issue as Record<string, unknown>;
      const category = issueRecord.category;
      const issueConfidence = clampConfidence(issueRecord.confidence);
      if (
        (category === "tone" ||
          category === "pronunciation" ||
          category === "ambiguity") &&
        typeof issueRecord.evidence === "string" &&
        typeof issueRecord.feedback === "string" &&
        issueConfidence !== null &&
        issueConfidence >= 0.6
      ) {
        seed.issue = {
          category,
          evidence: issueRecord.evidence.trim().slice(0, MAX_TEXT_LENGTH),
          feedback: issueRecord.feedback.trim().slice(0, MAX_TEXT_LENGTH),
          confidence: issueConfidence,
        };
      }
    }
    sanitized.push(seed);
  }
  return sanitized;
}
