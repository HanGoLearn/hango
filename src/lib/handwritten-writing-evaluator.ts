import "server-only";

import { createHash } from "node:crypto";
import { serverEnv } from "@/lib/env/server";
import {
  HANDWRITTEN_LEVEL_CONFIG,
  HANDWRITTEN_TOPIC_CONFIG,
  type HandwrittenEvaluation,
  type HandwrittenLevel,
  type HandwrittenSubmissionResult,
  type HandwrittenTopic,
} from "@/lib/handwritten-writing";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
export const HANDWRITTEN_EVALUATION_MODEL = "gpt-5-mini";
const REQUEST_TIMEOUT_MS = 60_000;

export class HandwrittenEvaluationError extends Error {}

interface RawEvaluation {
  readable: boolean;
  reason: string | null;
  transcription: string | null;
  legibilityScore: number | null;
  problemCharacters: { character: string; issue: string }[];
  cohesionNotes: string | null;
  scores: Record<string, number | null>;
  correctedVersion: string | null;
  errors: {
    type: "character" | "grammar" | "vocabulary";
    description: string;
  }[];
  overallNotes: string | null;
}

const SCORE_KEYS = [
  "topicFulfillment",
  "sentenceConstruction",
  "grammar",
  "vocabulary",
  "clarity",
  "cohesion",
  "naturalness",
  "contentDepth",
  "lexicalPrecision",
  "organization",
  "style",
] as const;

const nullableScoreProperties = Object.fromEntries(
  SCORE_KEYS.map((key) => [
    key,
    { type: ["number", "null"], minimum: 0, maximum: 100 },
  ]),
);

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "readable",
    "reason",
    "transcription",
    "legibilityScore",
    "problemCharacters",
    "cohesionNotes",
    "scores",
    "correctedVersion",
    "errors",
    "overallNotes",
  ],
  properties: {
    readable: { type: "boolean" },
    reason: { type: ["string", "null"] },
    transcription: { type: ["string", "null"] },
    legibilityScore: { type: ["number", "null"], minimum: 0, maximum: 100 },
    problemCharacters: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["character", "issue"],
        properties: {
          character: { type: "string" },
          issue: { type: "string" },
        },
      },
    },
    cohesionNotes: { type: ["string", "null"] },
    scores: {
      type: "object",
      additionalProperties: false,
      required: [...SCORE_KEYS],
      properties: nullableScoreProperties,
    },
    correctedVersion: { type: ["string", "null"] },
    errors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "description"],
        properties: {
          type: {
            type: "string",
            enum: ["character", "grammar", "vocabulary"],
          },
          description: { type: "string" },
        },
      },
    },
    overallNotes: { type: ["string", "null"] },
  },
} as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countChineseCharacters(transcription: string): number {
  const hanCharacters = transcription.match(/\p{Script=Han}/gu)?.length ?? 0;
  const illegibleCharacters = transcription.match(/\[\?\]/g)?.length ?? 0;
  return hanCharacters + illegibleCharacters;
}

function buildPrompt(level: HandwrittenLevel, topic: HandwrittenTopic): string {
  const levelConfig = HANDWRITTEN_LEVEL_CONFIG[level];
  const topicConfig = HANDWRITTEN_TOPIC_CONFIG[topic];
  const rubric = levelConfig.rubric
    .map(
      (dimension) =>
        `- ${dimension.label}: ${dimension.weight}% (output key: ${dimension.key})`,
    )
    .join("\n");

  return `You are evaluating handwritten Chinese submitted by a language learner from one to three photos.

Level: ${level}
Topic: "${topicConfig.label}"
Writing task: ${topicConfig.prompts[level]}
Target length: ${levelConfig.characterTarget}

The learner may write a sequence of sentences or one continuous text. Do not penalize either format. Count Chinese Han characters only, excluding spaces and punctuation. Writing beyond the target is not itself a problem unless it becomes repetitive or off-topic.

First validate every image. If any required part is too blurry, poorly lit, cropped, obstructed, duplicated in a confusing way, or otherwise unreadable, set readable=false and give a concise, actionable reason. Do not guess a transcription and do not award scores.

If readable:
1. Transcribe exactly what is written, character by character. Put [?] in the position of each single illegible character. This transcription is internal evidence and will not be shown in the feedback.
2. Give legibilityScore from 0 to 100 for recognizable, correctly formed final characters. List at most 8 specific problem characters and what is visibly wrong. Never assess stroke order from static photos.
3. Score only the dimensions in this level's rubric; set every unused score key to null:
${rubric}
4. For INTERMEDIATE and ADVANCED, assess logical flow and transitions in cohesionNotes. For BASIC, set cohesionNotes to null.
5. Provide a corrected Chinese version and specific errors separated into character, grammar, or vocabulary.
6. Give a short, warm, specific teacher note. Keep all feedback in English.

Do not calculate an overall score; the application calculates the weighted total. Be strict but level-appropriate.`;
}

interface UsageTokens {
  inputTokens: number;
  outputTokens: number;
}

/** The Responses API returns real token usage alongside `output`/`output_text` - reused for cost tracking instead of estimating a vision call's tokens some other way. */
function extractUsage(payload: unknown): UsageTokens | null {
  if (!payload || typeof payload !== "object") return null;
  const usage = (payload as { usage?: unknown }).usage;
  if (!usage || typeof usage !== "object") return null;
  const inputTokens = (usage as { input_tokens?: unknown }).input_tokens;
  const outputTokens = (usage as { output_tokens?: unknown }).output_tokens;
  if (typeof inputTokens !== "number" || typeof outputTokens !== "number")
    return null;
  return { inputTokens, outputTokens };
}

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const direct = (payload as { output_text?: unknown }).output_text;
  if (typeof direct === "string" && direct.trim()) return direct;
  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) return text;
    }
  }
  return null;
}

function toPublicEvaluation(
  raw: RawEvaluation,
  level: HandwrittenLevel,
): HandwrittenSubmissionResult {
  if (!raw.readable) {
    return {
      readable: false,
      reason:
        raw.reason?.trim() ||
        "The photos are not clear enough to assess. Please retake them.",
    };
  }
  if (
    !raw.transcription ||
    raw.legibilityScore === null ||
    !raw.correctedVersion ||
    !raw.overallNotes
  ) {
    throw new HandwrittenEvaluationError("The evaluation was incomplete.");
  }

  const config = HANDWRITTEN_LEVEL_CONFIG[level];
  const dimensions = config.rubric.map((dimension) => {
    const value =
      dimension.key === "legibility"
        ? raw.legibilityScore!
        : raw.scores[dimension.key];
    if (typeof value !== "number") {
      throw new HandwrittenEvaluationError(
        `Missing score for ${dimension.key}.`,
      );
    }
    return { ...dimension, score: clampScore(value) };
  });
  const overallScore = clampScore(
    dimensions.reduce(
      (sum, dimension) => sum + dimension.score * dimension.weight,
      0,
    ) / 100,
  );

  return {
    readable: true,
    evaluation: {
      overallScore,
      characterCount: countChineseCharacters(raw.transcription),
      targetRange: config.characterTarget,
      dimensions,
      problemCharacters: raw.problemCharacters.slice(0, 8),
      cohesionNotes: raw.cohesionNotes,
      correctedVersion: raw.correctedVersion,
      errors: raw.errors,
      overallNotes: raw.overallNotes,
      strokeOrderDisclaimer:
        "Stroke order cannot be verified from a static photo; this score assesses only the final visible result.",
    },
  };
}

export interface EvaluatedHandwriting {
  result: HandwrittenSubmissionResult;
  transcription: string | null;
  usage: UsageTokens | null;
}

export async function evaluateHandwrittenWriting(
  userId: string,
  level: HandwrittenLevel,
  topic: HandwrittenTopic,
  images: { mimeType: string; bytes: ArrayBuffer }[],
): Promise<EvaluatedHandwriting> {
  if (!serverEnv.OPENAI_API_KEY) {
    throw new HandwrittenEvaluationError(
      "Handwriting evaluation is not configured.",
    );
  }

  const content: Record<string, unknown>[] = [
    { type: "input_text", text: buildPrompt(level, topic) },
  ];
  for (const image of images) {
    const base64 = Buffer.from(image.bytes).toString("base64");
    content.push({
      type: "input_image",
      image_url: `data:${image.mimeType};base64,${base64}`,
      detail: "high",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${serverEnv.OPENAI_API_KEY}`,
        "content-type": "application/json",
        "openai-safety-identifier": createHash("sha256")
          .update(userId)
          .digest("hex"),
      },
      body: JSON.stringify({
        model: HANDWRITTEN_EVALUATION_MODEL,
        store: false,
        reasoning: { effort: "low" },
        max_output_tokens: level === "ADVANCED" ? 2_000 : 1_400,
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "handwritten_chinese_evaluation",
            strict: true,
            schema: OUTPUT_SCHEMA,
          },
        },
        input: [{ role: "user", content }],
      }),
      signal: controller.signal,
    });
  } catch {
    throw new HandwrittenEvaluationError(
      "The evaluation service could not be reached.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new HandwrittenEvaluationError(
      response.status === 429
        ? "The evaluation service is busy. Please wait a moment and try again."
        : "The photos could not be evaluated right now.",
    );
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  const outputText = extractOutputText(payload);
  if (!outputText)
    throw new HandwrittenEvaluationError("The evaluation returned no result.");

  let raw: RawEvaluation;
  try {
    raw = JSON.parse(outputText) as RawEvaluation;
  } catch {
    throw new HandwrittenEvaluationError(
      "The evaluation result could not be read.",
    );
  }

  return {
    result: toPublicEvaluation(raw, level),
    transcription: raw.readable ? raw.transcription : null,
    usage: extractUsage(payload),
  };
}
