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

const AMBIENT_FLOOR_RISE_ALPHA = 0.002;
const AMBIENT_FLOOR_FALL_ALPHA = 0.03;

const SHORT_MANDARIN_MAX_CHARACTERS = 4;
const MIN_SHORT_MANDARIN_VOICED_MS = 160;
const MIN_SHORT_MANDARIN_PEAK_RMS = 0.012;
const MIN_SHORT_MANDARIN_SIGNAL_TO_NOISE_RATIO = 2.2;
const MIN_SHORT_MANDARIN_VARIATION_RATIO = 0.12;

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
