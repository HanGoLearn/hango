import { describe, expect, it } from "vitest";
import {
  estimateTtsCostUsd,
  estimateTtsDurationSeconds,
  estimateSttCostUsd,
  estimateAudioDurationSecondsFromBytes,
  buildAiUsageCostMetadata,
} from "@/lib/ai-usage";

describe("AI usage cost estimators (2026-09-05, pure functions, no database)", () => {
  it("estimates TTS cost proportionally to spoken text length", () => {
    const text = "a".repeat(150); // 150 chars / 15 chars-per-second = 10s
    expect(estimateTtsDurationSeconds(text)).toBeCloseTo(10, 8);
    expect(estimateTtsCostUsd(text)).toBeCloseTo((10 / 60) * 0.015, 8);
    expect(estimateTtsCostUsd("a".repeat(300))).toBeCloseTo(
      2 * estimateTtsCostUsd(text),
      8,
    );
  });

  it("estimates STT cost from a real duration in seconds", () => {
    expect(estimateSttCostUsd(60)).toBeCloseTo(0.006, 8);
    expect(estimateSttCostUsd(30)).toBeCloseTo(0.003, 8);
    expect(estimateSttCostUsd(0)).toBe(0);
  });

  it("estimates audio duration from byte size at the assumed voice bitrate", () => {
    // 32,000 bytes * 8 bits / 32,000 bps = 8 seconds.
    expect(estimateAudioDurationSecondsFromBytes(32_000)).toBeCloseTo(8, 8);
    expect(estimateAudioDurationSecondsFromBytes(0)).toBe(0);
  });

  it("snapshots token rates and audio evidence without a database write", () => {
    expect(
      buildAiUsageCostMetadata({
        feature: "ai-teacher-chat",
        model: "gpt-5-mini",
        inputTokens: 100,
        outputTokens: 50,
      }),
    ).toEqual({
      calculationMethod: "TOKEN_RATES",
      inputRateUsdPerMillionTokens: 0.25,
      outputRateUsdPerMillionTokens: 2,
      audioRateUsdPerMinute: null,
      durationSeconds: null,
      durationSource: null,
    });

    expect(
      buildAiUsageCostMetadata({
        feature: "speaking-transcribe",
        model: "whisper-1",
        durationSeconds: 12,
        durationSource: "CLIENT_RECORDED",
      }),
    ).toEqual({
      calculationMethod: "PER_MINUTE",
      inputRateUsdPerMillionTokens: null,
      outputRateUsdPerMillionTokens: null,
      audioRateUsdPerMinute: 0.006,
      durationSeconds: 12,
      durationSource: "CLIENT_RECORDED",
    });
  });
});
