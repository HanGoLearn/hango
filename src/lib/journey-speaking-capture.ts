import {
  JOURNEY_MAX_CAPTURE_CHARACTERS,
  JOURNEY_MAX_CAPTURE_TURNS,
  JourneyAttemptSealSchema,
  type JourneyAttemptSealInput,
  type JourneyCaptureQuality,
} from "@/lib/journey-speaking-attempt-contract";
import type { SpeakingTranscriptMessage } from "@/lib/reflection-prompt";
import type { SpeakingTurnEvidence } from "@/lib/speech/speaking-pronunciation-evidence";

/** Browser adapter. Never replace original recognition with contextual guesses.
 * Oversized captures are bounded and explicitly technical/partial, not silently
 * truncated into an apparently complete conversation. No speech/AI calls here.
 */
export function buildJourneyAttemptCapture(
  attemptId: string,
  lessonId: string,
  transcript: readonly SpeakingTranscriptMessage[],
  diagnostics: {
    speakingEvidence: readonly SpeakingTurnEvidence[];
    closeReason?: JourneyAttemptSealInput["closeReason"];
    quality?: JourneyCaptureQuality;
    capturedTurns?: JourneyAttemptSealInput["turns"];
  },
): JourneyAttemptSealInput {
  let userIndex = 0;
  let characters = 0;
  let truncated = false;
  const turns: JourneyAttemptSealInput["turns"] = [];
  const evidence = new Map(
    diagnostics.speakingEvidence.map((item) => [item.turnIndex, item]),
  );
  for (const message of diagnostics.capturedTurns ?? transcript) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const fullRecord = diagnostics.capturedTurns
      ? (message as JourneyAttemptSealInput["turns"][number]).recognition
      : undefined;
    const record =
      message.role === "user" ? evidence.get(++userIndex) : undefined;
    // Older diagnostics cap raw text at 240 chars. Only use it when it maps
    // exactly to this turn, and never shorten a long utterance to that prefix.
    const mapped =
      record && record.interpretedTranscript === message.content.trim();
    const raw = fullRecord
      ? fullRecord.rawTranscript.trim()
      : mapped
        ? record.rawTranscript.trim()
        : message.content.trim();
    if (!raw) continue;
    if (
      turns.length >= JOURNEY_MAX_CAPTURE_TURNS ||
      characters + raw.length > JOURNEY_MAX_CAPTURE_CHARACTERS ||
      raw.length > 3000
    ) {
      truncated = true;
      break;
    }
    characters += raw.length;
    turns.push({
      role: message.role,
      content: raw,
      ...(fullRecord
        ? { recognition: fullRecord }
        : mapped
          ? {
              recognition: {
                rawTranscript: raw,
                interpretedTranscript: record.interpretedTranscript,
                confidence: record.transcriptionConfidence,
              },
            }
          : {}),
    });
  }
  return JourneyAttemptSealSchema.parse({
    attemptId,
    lessonId,
    closeReason: truncated
      ? "TECHNICAL_FAILURE"
      : (diagnostics.closeReason ?? "USER_END"),
    turns,
    quality: {
      pendingLearnerTurn:
        truncated || diagnostics.quality?.pendingLearnerTurn || false,
      interruptedAssistant: diagnostics.quality?.interruptedAssistant || false,
    },
  });
}
