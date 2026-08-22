import { describe, expect, it } from "vitest";
import {
  INITIAL_AMBIENT_NOISE_FLOOR_RMS,
  isLikelyLearnerSpeech,
  isLikelyLearnerUtterance,
  rmsFromTimeDomainSamples,
  updateAmbientNoiseFloor,
} from "@/lib/speech/realtime-turn-guard";

describe("Realtime voice turn guard", () => {
  it("does not absorb the beginning of a soft voice into the room baseline", () => {
    let floor = INITIAL_AMBIENT_NOISE_FLOOR_RMS;
    for (let frame = 0; frame < 8; frame++) {
      floor = updateAmbientNoiseFloor(floor, 0.03);
    }

    expect(floor).toBeLessThan(0.005);
  });

  it("adapts downward faster when the room becomes quieter", () => {
    const rising = updateAmbientNoiseFloor(0.01, 0.03);
    const falling = updateAmbientNoiseFloor(0.01, 0.003);

    expect(rising - 0.01).toBeLessThan(0.0001);
    expect(0.01 - falling).toBeGreaterThan(0.0001);
  });

  it("silently rejects a click-like turn that is too short", () => {
    expect(
      isLikelyLearnerSpeech({
        durationMs: 70,
        voicedMs: 45,
        peakRms: 0.2,
        noiseFloorRms: 0.004,
        meanRms: 0.02,
        rmsStandardDeviation: 0.01,
      }),
    ).toBe(false);
  });

  it("rejects a long but weak ambient-noise turn", () => {
    expect(
      isLikelyLearnerSpeech({
        durationMs: 600,
        voicedMs: 40,
        peakRms: 0.006,
        noiseFloorRms: 0.004,
        meanRms: 0.005,
        rmsStandardDeviation: 0.0001,
      }),
    ).toBe(false);
  });

  it("keeps a short foreground Mandarin syllable", () => {
    expect(
      isLikelyLearnerSpeech({
        durationMs: 260,
        voicedMs: 150,
        peakRms: 0.045,
        noiseFloorRms: 0.004,
        meanRms: 0.012,
        rmsStandardDeviation: 0.009,
      }),
    ).toBe(true);
  });

  it("fails open when Web Audio could not provide a measurement", () => {
    expect(isLikelyLearnerSpeech(null)).toBe(true);
  });

  it("rejects steady background noise mis-transcribed as 你好", () => {
    expect(
      isLikelyLearnerUtterance(
        {
          durationMs: 1_200,
          voicedMs: 900,
          peakRms: 0.022,
          noiseFloorRms: 0.004,
          meanRms: 0.019,
          rmsStandardDeviation: 0.0006,
        },
        "你好",
      ),
    ).toBe(false);
  });

  it("keeps a real short 你好 with a speech-like foreground signal", () => {
    expect(
      isLikelyLearnerUtterance(
        {
          durationMs: 1_150,
          voicedMs: 360,
          peakRms: 0.05,
          noiseFloorRms: 0.005,
          meanRms: 0.013,
          rmsStandardDeviation: 0.01,
        },
        "你好",
      ),
    ).toBe(true);
  });

  it("calculates RMS energy from time-domain samples", () => {
    expect(rmsFromTimeDomainSamples(new Float32Array([1, -1, 1, -1]))).toBe(1);
  });
});
