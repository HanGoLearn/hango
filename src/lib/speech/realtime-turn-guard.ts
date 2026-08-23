export type RealtimeVoiceTurnSignal = {
  durationMs: number;
  voicedMs: number;
  peakRms: number;
  noiseFloorRms: number;
  meanRms: number;
  rmsStandardDeviation: number;
};

// Keep these limits deliberately short so a softly spoken one-syllable
// Mandarin word such as "ai" is still accepted. Server VAD remains the first
// filter; this is only a second guard against clicks, breaths and weak room
// noise that VAD occasionally promotes to a transcription turn.
export const MIN_REALTIME_TURN_DURATION_MS = 140;
export const MIN_REALTIME_VOICED_MS = 80;
export const MIN_REALTIME_PEAK_RMS = 0.008;
export const MIN_SIGNAL_TO_NOISE_RATIO = 1.8;
export const MIN_RMS_VARIATION_RATIO = 0.08;
export const INITIAL_AMBIENT_NOISE_FLOOR_RMS = 0.004;

// Interruption is deliberately stricter than accepting a completed turn.
// A cough, music, or a television may briefly trip server VAD, but should not
// cut off Han before the learner has produced sustained foreground speech.
export const REALTIME_BARGE_IN_CONFIRMATION_MS = 360;
const MIN_BARGE_IN_DURATION_MS = 300;
const MIN_BARGE_IN_VOICED_MS = 180;
const MIN_BARGE_IN_PEAK_RMS = 0.016;
const MIN_BARGE_IN_SIGNAL_TO_NOISE_RATIO = 2.6;
const MIN_BARGE_IN_VARIATION_RATIO = 0.14;

const AMBIENT_FLOOR_RISE_ALPHA = 0.002;
const AMBIENT_FLOOR_FALL_ALPHA = 0.03;

const SHORT_MANDARIN_MAX_CHARACTERS = 4;
const MIN_SHORT_MANDARIN_VOICED_MS = 160;
const MIN_SHORT_MANDARIN_PEAK_RMS = 0.012;
const MIN_SHORT_MANDARIN_SIGNAL_TO_NOISE_RATIO = 2.2;
const MIN_SHORT_MANDARIN_VARIATION_RATIO = 0.12;
export const MIN_FREE_TOPIC_TRANSCRIPT_CONFIDENCE = 0.25;

export function freeTopicUnclosedTurnTimeoutMs(level?: string): number {
  if (level === "Pre-HSK") return 4_500;
  const explicitLevel = level?.match(/HSK\s*([1-9])/iu)?.[1];
  const hskLevel = explicitLevel ? Number(explicitLevel) : null;
  if (hskLevel === 1) return 6_000;
  if (hskLevel === 2) return 8_000;
  return 12_000;
}

/** Preserve a likely real long utterance; discard an unclosed noise buffer. */
export function stuckFreeTopicTurnAction(
  signal: RealtimeVoiceTurnSignal | null | undefined,
): "commit" | "clear" {
  return isConfidentLearnerBargeIn(signal) ? "commit" : "clear";
}

/**
 * Learns the room level between turns without absorbing the beginning of the
 * learner's voice while the server's speech_started event is still in flight.
 * Rising energy changes the baseline very slowly; a quieter room is adopted
 * faster. This keeps soft speech above the foreground threshold.
 */
export function updateAmbientNoiseFloor(
  currentFloorRms: number,
  measuredRms: number,
): number {
  const current =
    Number.isFinite(currentFloorRms) && currentFloorRms >= 0
      ? currentFloorRms
      : INITIAL_AMBIENT_NOISE_FLOOR_RMS;
  if (!Number.isFinite(measuredRms) || measuredRms < 0) return current;

  const cappedMeasurement = Math.min(measuredRms, Math.max(0.04, current * 3));
  const alpha =
    cappedMeasurement > current
      ? AMBIENT_FLOOR_RISE_ALPHA
      : AMBIENT_FLOOR_FALL_ALPHA;
  return current * (1 - alpha) + cappedMeasurement * alpha;
}

export function rmsFromTimeDomainSamples(samples: Float32Array): number {
  if (samples.length === 0) return 0;

  let sumSquares = 0;
  for (const sample of samples) sumSquares += sample * sample;
  return Math.sqrt(sumSquares / samples.length);
}

/**
 * Returns true when a completed Realtime VAD turn contains enough foreground
 * signal to be learner speech. A missing measurement is accepted so browsers
 * without Web Audio support keep the existing, functional voice path.
 */
export function isLikelyLearnerSpeech(
  signal: RealtimeVoiceTurnSignal | null | undefined,
): boolean {
  if (!signal) return true;

  const values = [
    signal.durationMs,
    signal.voicedMs,
    signal.peakRms,
    signal.noiseFloorRms,
    signal.meanRms,
    signal.rmsStandardDeviation,
  ];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) return true;

  const requiredPeak = Math.max(
    MIN_REALTIME_PEAK_RMS,
    signal.noiseFloorRms * MIN_SIGNAL_TO_NOISE_RATIO,
  );
  const variationRatio =
    signal.meanRms > 0
      ? signal.rmsStandardDeviation / signal.meanRms
      : Number.POSITIVE_INFINITY;

  return (
    signal.durationMs >= MIN_REALTIME_TURN_DURATION_MS &&
    signal.voicedMs >= MIN_REALTIME_VOICED_MS &&
    signal.peakRms >= requiredPeak &&
    variationRatio >= MIN_RMS_VARIATION_RATIO
  );
}

/**
 * Confirms foreground learner speech before the browser manually interrupts
 * a live free-topic answer. Missing/invalid measurements fail closed here:
 * the completed transcript can still be accepted after Han finishes, but
 * uncertain room audio must never silence an answer in progress.
 */
export function isConfidentLearnerBargeIn(
  signal: RealtimeVoiceTurnSignal | null | undefined,
): boolean {
  if (!signal) return false;

  const values = [
    signal.durationMs,
    signal.voicedMs,
    signal.peakRms,
    signal.noiseFloorRms,
    signal.meanRms,
    signal.rmsStandardDeviation,
  ];
  if (values.some((value) => !Number.isFinite(value) || value < 0))
    return false;

  const requiredPeak = Math.max(
    MIN_BARGE_IN_PEAK_RMS,
    signal.noiseFloorRms * MIN_BARGE_IN_SIGNAL_TO_NOISE_RATIO,
  );
  const variationRatio =
    signal.meanRms > 0
      ? signal.rmsStandardDeviation / signal.meanRms
      : Number.POSITIVE_INFINITY;

  return (
    signal.durationMs >= MIN_BARGE_IN_DURATION_MS &&
    signal.voicedMs >= MIN_BARGE_IN_VOICED_MS &&
    signal.peakRms >= requiredPeak &&
    variationRatio >= MIN_BARGE_IN_VARIATION_RATIO
  );
}

/**
 * Short Mandarin results deserve extra caution because a biased STT prompt
 * can turn ambiguous room noise into a plausible beginner word such as 你好.
 * Real short speech still passes when it has a clear foreground peak,
 * sustained voiced samples, and speech-like energy variation.
 */
export function isLikelyLearnerUtterance(
  signal: RealtimeVoiceTurnSignal | null | undefined,
  transcript: string,
): boolean {
  if (!isLikelyLearnerSpeech(signal)) return false;
  if (!signal) return true;

  const bareTranscript = transcript.replace(/[。！？!?.,，]/gu, "").trim();
  const isShortMandarin = new RegExp(
    `^\\p{Script=Han}{1,${SHORT_MANDARIN_MAX_CHARACTERS}}$`,
    "u",
  ).test(bareTranscript);
  if (!isShortMandarin) return true;

  const requiredPeak = Math.max(
    MIN_SHORT_MANDARIN_PEAK_RMS,
    signal.noiseFloorRms * MIN_SHORT_MANDARIN_SIGNAL_TO_NOISE_RATIO,
  );
  const variationRatio =
    signal.meanRms > 0
      ? signal.rmsStandardDeviation / signal.meanRms
      : Number.POSITIVE_INFINITY;

  return (
    signal.voicedMs >= MIN_SHORT_MANDARIN_VOICED_MS &&
    signal.peakRms >= requiredPeak &&
    variationRatio >= MIN_SHORT_MANDARIN_VARIATION_RATIO
  );
}

/**
 * Free-topic practice has no lesson turn to anchor the recognizer, so faint
 * room audio is more likely to become a plausible invented sentence. When
 * Realtime supplies acoustic log probabilities, require a modest confidence
 * floor in addition to the existing foreground-signal checks. Missing
 * logprobs keep the signal-only fallback for compatibility.
 */
export function isLikelyFreeTopicLearnerUtterance(
  signal: RealtimeVoiceTurnSignal | null | undefined,
  transcript: string,
  confidence: number | null,
): boolean {
  if (confidence !== null && confidence < MIN_FREE_TOPIC_TRANSCRIPT_CONFIDENCE)
    return false;
  return isLikelyLearnerUtterance(signal, transcript);
}
