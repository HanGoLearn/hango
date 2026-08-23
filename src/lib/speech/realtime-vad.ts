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

/**
 * Speaking Lab's free-topic "Practice with Han" is a real conversation, but
 * it is also commonly used in ordinary rooms. A higher server-VAD threshold
 * avoids treating nearby music as continuous speech. Its silence window still
 * leaves room for a thoughtful pause. Realtime's automatic interruption is
 * disabled: the browser confirms sustained foreground learner speech before
 * manually cancelling an answer, so one sound cannot silence Han.
 */
export const HAN_FREE_TOPIC_VAD_CONFIG = {
  type: "server_vad",
  threshold: 0.76,
  prefix_padding_ms: 500,
  silence_duration_ms: 1_300,
  create_response: false,
  interrupt_response: false,
} as const;

/**
 * OpenAI applies input noise reduction before VAD and transcription. Free
 * practice normally uses a laptop microphone in an ordinary room, so the
 * far-field profile is a better fit than the close-talking/headset profile.
 */
export const HAN_FREE_TOPIC_NOISE_REDUCTION_CONFIG = {
  type: "far_field",
} as const;

export function realtimeVadConfig(isFreeTopic: boolean) {
  return isFreeTopic ? HAN_FREE_TOPIC_VAD_CONFIG : HAN_REALTIME_VAD_CONFIG;
}

export function realtimeNoiseReductionConfig(isFreeTopic: boolean) {
  return isFreeTopic ? HAN_FREE_TOPIC_NOISE_REDUCTION_CONFIG : undefined;
}
