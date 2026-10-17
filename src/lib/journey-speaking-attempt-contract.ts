import { z } from "zod";
import type { JourneySpeakingBanks } from "@/lib/content/journey-speaking-bank-contract";
import type { JourneyAssessmentSnapshot } from "@/lib/journey-lesson-report";

export const JOURNEY_RUBRIC_VERSION = "journey-evidence-2026-10-11-v2";
export const JOURNEY_CAPTURE_SOURCE = "browser-captured";
export const JOURNEY_MAX_CAPTURE_TURNS = 80;
export const JOURNEY_MAX_CAPTURE_CHARACTERS = 24_000;

export type JourneyAttemptSnapshot = {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  difficulty: string;
  hskReference: number | null;
  aiRole: string;
  learnerRole: string;
  objective: string;
  scenarioContext?: string;
  successConditions: Array<{ id: string; text: string }>;
  banks: JourneySpeakingBanks;
  assessment?: JourneyAssessmentSnapshot;
};

export const JourneyAttemptStartSchema = z
  .object({
    lessonId: z.string().min(1).max(100),
    requestKey: z.uuid(),
    locale: z.enum(["es", "en"]),
  })
  .strict();

export const JourneyRecognitionSchema = z
  .object({
    rawTranscript: z.string().trim().min(1).max(3_000),
    interpretedTranscript: z.string().trim().min(1).max(3_000),
    confidence: z.number().min(0).max(1).nullable(),
  })
  .strict();
export const JourneyCaptureQualitySchema = z
  .object({
    pendingLearnerTurn: z.boolean(),
    interruptedAssistant: z.boolean(),
  })
  .strict();

const CapturedTurnSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(3_000),
    recognition: JourneyRecognitionSchema.optional(),
  })
  .strict()
  .superRefine((turn, context) => {
    if (
      turn.recognition &&
      (turn.role !== "user" || turn.content !== turn.recognition.rawTranscript)
    )
      context.addIssue({
        code: "custom",
        message: "Recognition must preserve the learner's original transcript",
        path: ["recognition"],
      });
  });

export const JourneyAttemptSealSchema = z
  .object({
    attemptId: z.string().min(1).max(100),
    lessonId: z.string().min(1).max(100),
    closeReason: z.enum([
      "NATURAL",
      "USER_END",
      "TECHNICAL_FAILURE",
      "ABANDONED",
    ]),
    turns: z.array(CapturedTurnSchema).max(JOURNEY_MAX_CAPTURE_TURNS),
    quality: JourneyCaptureQualitySchema.optional(),
  })
  .strict()
  .superRefine((capture, context) => {
    if (
      capture.turns.reduce((n, turn) => n + turn.content.length, 0) >
      JOURNEY_MAX_CAPTURE_CHARACTERS
    )
      context.addIssue({
        code: "custom",
        message: "Capture is too large",
        path: ["turns"],
      });
  });

export type JourneyAttemptSealInput = z.infer<typeof JourneyAttemptSealSchema>;
export type JourneyCapturedTurn = {
  id: string;
  sequence: number;
  role: "user" | "assistant";
  content: string;
  recognition?: z.infer<typeof JourneyRecognitionSchema>;
};
export type JourneyCaptureQuality = z.infer<typeof JourneyCaptureQualitySchema>;

/** Context resolution is a hypothesis, not certified production or phonetics. */
export function hasUncertainJourneyRecognition(
  turn: JourneyCapturedTurn,
): boolean {
  const recognition = turn.recognition;
  if (!recognition) return false;
  const normalize = (text: string) =>
    text.toLocaleLowerCase("zh").replace(/[^\p{Letter}\p{Number}]/gu, "");
  return (
    (recognition.confidence !== null && recognition.confidence < 0.45) ||
    normalize(recognition.rawTranscript) !==
      normalize(recognition.interpretedTranscript)
  );
}
