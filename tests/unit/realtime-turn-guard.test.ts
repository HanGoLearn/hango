import { describe, expect, it } from "vitest";
import {
  INITIAL_AMBIENT_NOISE_FLOOR_RMS,
  freeTopicUnclosedTurnTimeoutMs,
  isConfidentLearnerBargeIn,
  isLikelyFreeTopicLearnerUtterance,
  isLikelyLearnerSpeech,
  isLikelyLearnerUtterance,
  rmsFromTimeDomainSamples,
  stuckFreeTopicTurnAction,
  updateAmbientNoiseFloor,
} from "@/lib/speech/realtime-turn-guard";
import {
  HAN_FREE_TOPIC_VAD_CONFIG,
  HAN_FREE_TOPIC_NOISE_REDUCTION_CONFIG,
  HAN_REALTIME_VAD_CONFIG,
  realtimeNoiseReductionConfig,
  realtimeVadConfig,
} from "@/lib/speech/realtime-vad";

describe("Realtime voice turn guard", () => {
  it("uses noise-resistant turn endings without automatic interruption for Practice with Han", () => {
    expect(realtimeVadConfig(true)).toEqual(HAN_FREE_TOPIC_VAD_CONFIG);
    expect(HAN_FREE_TOPIC_VAD_CONFIG).toMatchObject({
      type: "server_vad",
      threshold: 0.76,
      silence_duration_ms: 1_300,
      create_response: false,
      interrupt_response: false,
    });
    expect(realtimeVadConfig(false)).toEqual(HAN_REALTIME_VAD_CONFIG);
    expect(HAN_REALTIME_VAD_CONFIG.interrupt_response).toBe(false);
    expect(realtimeNoiseReductionConfig(true)).toEqual(
      HAN_FREE_TOPIC_NOISE_REDUCTION_CONFIG,
    );
    expect(HAN_FREE_TOPIC_NOISE_REDUCTION_CONFIG).toEqual({
      type: "far_field",
    });
    expect(realtimeNoiseReductionConfig(false)).toBeUndefined();
  });

  it("recovers a free-topic turn that background noise never closes", () => {
    expect(freeTopicUnclosedTurnTimeoutMs("Pre-HSK")).toBe(4_500);
    expect(freeTopicUnclosedTurnTimeoutMs("HSK 1")).toBe(6_000);
    expect(freeTopicUnclosedTurnTimeoutMs("HSK 2")).toBe(8_000);
    expect(freeTopicUnclosedTurnTimeoutMs("HSK 5")).toBe(12_000);

    expect(
      stuckFreeTopicTurnAction({
        durationMs: 5_000,
        voicedMs: 4_200,
        peakRms: 0.03,
        noiseFloorRms: 0.009,
        meanRms: 0.026,
        rmsStandardDeviation: 0.001,
      }),
    ).toBe("clear");
    expect(
      stuckFreeTopicTurnAction({
        durationMs: 5_000,
        voicedMs: 2_500,
        peakRms: 0.065,
        noiseFloorRms: 0.006,
        meanRms: 0.02,
        rmsStandardDeviation: 0.01,
      }),
    ).toBe("commit");
  });

  it("does not interrupt Han for steady music-like energy", () => {
    expect(
      isConfidentLearnerBargeIn({
        durationMs: 900,
        voicedMs: 760,
        peakRms: 0.03,
        noiseFloorRms: 0.009,
        meanRms: 0.026,
        rmsStandardDeviation: 0.001,
      }),
    ).toBe(false);
  });

  it("confirms a sustained foreground learner interruption", () => {
    expect(
      isConfidentLearnerBargeIn({
        durationMs: 520,
        voicedMs: 300,
        peakRms: 0.06,
        noiseFloorRms: 0.006,
        meanRms: 0.019,
        rmsStandardDeviation: 0.009,
      }),
    ).toBe(true);
  });

  it("rejects a low-confidence free-topic sentence hallucinated from room noise", () => {
    expect(
      isLikelyFreeTopicLearnerUtterance(
        {
          durationMs: 800,
          voicedMs: 310,
          peakRms: 0.035,
          noiseFloorRms: 0.008,
          meanRms: 0.014,
          rmsStandardDeviation: 0.004,
        },
        "你好，我们继续吧",
        0.18,
      ),
    ).toBe(false);
  });

  it("keeps a confident real free-topic learner turn", () => {
    expect(
      isLikelyFreeTopicLearnerUtterance(
        {
          durationMs: 900,
          voicedMs: 420,
          peakRms: 0.05,
          noiseFloorRms: 0.005,
          meanRms: 0.016,
          rmsStandardDeviation: 0.008,
        },
        "我想买苹果",
        0.72,
      ),
    ).toBe(true);
  });

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
