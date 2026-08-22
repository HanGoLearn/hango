import { describe, expect, it } from "vitest";
import { HAN_REALTIME_VAD_CONFIG } from "@/lib/speech/realtime-vad";

describe("Han Realtime VAD policy", () => {
  it("hears normal voices without returning to the noisy-room default", () => {
    expect(HAN_REALTIME_VAD_CONFIG.type).toBe("server_vad");
    expect(HAN_REALTIME_VAD_CONFIG.threshold).toBeGreaterThan(0.5);
    expect(HAN_REALTIME_VAD_CONFIG.threshold).toBeLessThan(0.84);
    expect(HAN_REALTIME_VAD_CONFIG.prefix_padding_ms).toBeGreaterThanOrEqual(
      500,
    );
  });

  it("allows a thoughtful pause and never interrupts Han automatically", () => {
    expect(HAN_REALTIME_VAD_CONFIG.silence_duration_ms).toBeGreaterThanOrEqual(
      1_500,
    );
    expect(HAN_REALTIME_VAD_CONFIG.create_response).toBe(false);
    expect(HAN_REALTIME_VAD_CONFIG.interrupt_response).toBe(false);
  });
});
