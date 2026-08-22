/**
 * Shared Realtime turn-detection policy for Han.
 *
 * The previous 0.84 activation threshold was excellent at suppressing room
 * noise but also required some normal/soft voices to speak unusually loudly.
 * A longer silence window protects thoughtful learner pauses, while the
 * separate client-side signal/transcript guards continue rejecting coughs,
 * clicks, and implausible STT results.
 */
export const HAN_REALTIME_VAD_CONFIG = {
  type: "server_vad",
  threshold: 0.68,
  prefix_padding_ms: 500,
  silence_duration_ms: 1_600,
  create_response: false,
  interrupt_response: false,
} as const;
