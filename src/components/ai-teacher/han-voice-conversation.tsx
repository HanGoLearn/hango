"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Loader2, Mic, Square, UserRound, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InformationBanner } from "@/components/ui/banner";
import { Caption } from "@/components/ui/typography";
import {
  getHanOnDemandAppContextAction,
  saveRealtimeConversationMessageAction,
  saveRealtimeConversationTurnAction,
  saveRealtimeSpeakingEvidenceAction,
} from "@/lib/actions/ai-teacher";
import type { AiChatMessage } from "@/components/ai-teacher/ai-teacher-provider";
import {
  detectExplicitHskSessionLevel,
  type AiTeacherContext,
  type AiTeacherMode,
  type RolePlayContext,
} from "@/lib/ai-context";
import {
  buildHanTutorControlCommandInstruction,
  deriveHanTutorSessionPreferences,
  resolveHanTutorConversationLanguage,
} from "@/lib/han-tutor-session";
import {
  advancePronunciationPractice,
  allowsRealtimeBargeIn,
  buildRealtimePushToTalkStartEvents,
  buildRealtimeAssessmentFallbackGuard,
  buildRealtimeAssessmentTurnGuard,
  buildRealtimeClosingInstructions,
  buildRealtimeOpeningInstructions,
  buildRealtimeOpeningTurnGuard,
  buildRealtimeSessionUpdateEvent,
  buildSessionPreservingRealtimeTurnEvents,
  buildRealtimeTurnInstructions,
  canBeginRealtimePushToTalk,
  isNonSpeechNoiseTranscript,
  nextHanExplanationLanguage,
  realtimeRolePlayOutputTokenLimit,
  realtimeSessionStartErrorMessage,
  realtimeTutorPronunciationOutputTokenLimit,
  shouldHoldRealtimeLearnerAction,
  shouldBlockForRolePlayAssessment,
  userFacingRealtimeVoiceError,
  type HanExplanationLanguage,
  type ConversationCompletionAssessment,
  type PronunciationPracticeState,
} from "@/lib/han-realtime";
import type { SpeakingTranscriptMessage } from "@/lib/reflection-prompt";
import {
  assessHanTranscript,
  assessMandarinRolePlayTranscript,
  confidenceFromLogprobs,
  HAN_STT_REPEAT_MESSAGE,
  transcriptHintsFromContext,
  type TranscriptLogprob,
} from "@/lib/speech/transcript-quality";
import {
  INITIAL_AMBIENT_NOISE_FLOOR_RMS,
  freeTopicUnclosedTurnTimeoutMs,
  isConfidentLearnerBargeIn,
  isLikelyFreeTopicLearnerUtterance,
  isLikelyLearnerUtterance,
  REALTIME_BARGE_IN_CONFIRMATION_MS,
  rmsFromTimeDomainSamples,
  stuckFreeTopicTurnAction,
  updateAmbientNoiseFloor,
  type RealtimeVoiceTurnSignal,
} from "@/lib/speech/realtime-turn-guard";
import {
  CLOSING_AUDIO_RMS_THRESHOLD,
  shouldFinishClosingPlayback,
} from "@/lib/speech/realtime-playback";
import { detectHanAppContextIntent } from "@/lib/han-app-intent";
import {
  buildSpeakingEvidenceReviewInstructions,
  createSpeakingTurnEvidence,
  parseSpeakingEvidenceReview,
  type SpeakingTurnEvidence,
} from "@/lib/speech/speaking-pronunciation-evidence";

export type RealtimeConversationState =
  "idle" | "connecting" | "listening" | "thinking" | "speaking";
export interface RealtimeConversationDiagnostics {
  learnerTurnConfidences: number[];
  speakingEvidence: SpeakingTurnEvidence[];
}
type RealtimeEvent = {
  type?: string;
  item_id?: string;
  transcript?: string;
  text?: string;
  delta?: string;
  logprobs?: TranscriptLogprob[];
  session?: { instructions?: string };
  response?: {
    output?: unknown[];
    status?: "completed" | "cancelled" | "failed" | "incomplete";
    status_details?: { reason?: string; error?: { message?: string } } | null;
  };
  error?: { message?: string };
};

async function requestRolePlayAssessment(
  rolePlay: RolePlayContext,
  latestLearnerTranscript: string,
  phase: "before_reply" | "after_reply",
  transcript: readonly SpeakingTranscriptMessage[],
  previouslyRemainingPracticeTargets: readonly string[] | null,
  continueUntilTimeLimit: boolean,
  minimumLearnerTurns?: number,
  maximumLearnerTurns?: number,
): Promise<ConversationCompletionAssessment> {
  const response = await fetch("/api/han/realtime/assessment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      rolePlay,
      latestLearnerTranscript,
      phase,
      transcript,
      previouslyRemainingPracticeTargets,
      continueUntilTimeLimit,
      minimumLearnerTurns,
      maximumLearnerTurns,
    }),
  });
  if (!response.ok) throw new Error("Role-play assessment failed");
  return (await response.json()) as ConversationCompletionAssessment;
}

export function HanVoiceConversation({
  disabled,
  voice,
  explanationLanguage,
  mode,
  context,
  open,
  appendMessage,
  onActiveChange,
  variant = "compact",
  roleLabel = "Conversation partner",
  maxSessionMs = 5 * 60 * 1000,
  naturalCloseAfterMs,
  onComplete,
  onUnavailable,
  completionPolicy = "timer",
  minimumLearnerTurns,
  maximumLearnerTurns,
}: {
  disabled: boolean;
  voice: string;
  explanationLanguage: string;
  mode: AiTeacherMode;
  context: AiTeacherContext;
  open: boolean;
  appendMessage: (message: Omit<AiChatMessage, "id">) => void;
  onActiveChange: (active: boolean) => void;
  variant?: "compact" | "immersive" | "orb";
  roleLabel?: string;
  maxSessionMs?: number;
  naturalCloseAfterMs?: number;
  onComplete?: (
    transcript: SpeakingTranscriptMessage[],
    diagnostics: RealtimeConversationDiagnostics,
  ) => void | Promise<void>;
  onUnavailable?: () => void;
  /** Lessons keep talking until their timer; placement may close once its evidence checklist is complete. */
  completionPolicy?: "timer" | "objective";
  minimumLearnerTurns?: number;
  maximumLearnerTurns?: number;
}) {
  const [state, setState] = useState<RealtimeConversationState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pushToTalkActive, setPushToTalkActive] = useState(false);
  const pushToTalkActiveRef = useRef(false);
  const [latestCaption, setLatestCaption] = useState(
    "Start when you're ready.",
  );
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const contextRef = useRef(context);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioAnalysisFrameRef = useRef<number | null>(null);
  const remoteAudioContextRef = useRef<AudioContext | null>(null);
  const remoteAudioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const remoteAudioAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAudioGainRef = useRef<GainNode | null>(null);
  const remoteAudioAnalysisFrameRef = useRef<number | null>(null);
  const remoteAudioAudibleRef = useRef(false);
  const remotePlaybackSuppressedRef = useRef(false);
  const orbRef = useRef<HTMLButtonElement | null>(null);
  const ambientNoiseFloorRef = useRef(INITIAL_AMBIENT_NOISE_FLOOR_RMS);
  const activeVoiceTurnRef = useRef<{
    startedAt: number;
    lastSampleAt: number;
    voicedMs: number;
    peakRms: number;
    noiseFloorRms: number;
    sampleCount: number;
    rmsSum: number;
    rmsSquareSum: number;
  } | null>(null);
  const activeVoiceTurnItemIdRef = useRef<string | null>(null);
  const discardedVoiceTurnItemIdsRef = useRef<Set<string>>(new Set());
  const completedVoiceTurnSignalsRef = useRef<RealtimeVoiceTurnSignal[]>([]);
  const pendingUserTextRef = useRef("");
  const transcriptRef = useRef<SpeakingTranscriptMessage[]>([]);
  const learnerTurnConfidencesRef = useRef<number[]>([]);
  const speakingEvidenceRef = useRef<SpeakingTurnEvidence[]>([]);
  const pendingSavesRef = useRef<Promise<void>[]>([]);
  const sessionTimerRef = useRef<number | null>(null);
  const sessionConfigurationTimerRef = useRef<number | null>(null);
  const pendingSessionActivationRef = useRef<(() => void) | null>(null);
  const pendingSessionInstructionsRef = useRef<string | null>(null);
  const naturalCloseTimerRef = useRef<number | null>(null);
  const openingTurnRef = useRef(false);
  const replyNeedsAssessmentRef = useRef(false);
  const remainingPracticeTargetsRef = useRef<string[] | null>(null);
  const pendingTurnInstructionsRef = useRef("");
  const ephemeralTurnGuardItemIdRef = useRef<string | null>(null);
  const closingTurnRef = useRef(false);
  const closeRequestedRef = useRef(false);
  const closeAfterReplyRef = useRef(false);
  const activeResponseRef = useRef(false);
  const lastTutorTurnInstructionsRef = useRef("");
  const tutorContinuationCountRef = useRef(0);
  const outputPlaybackActiveRef = useRef(false);
  const pushToTalkInterruptedResponseRef = useRef(false);
  const pushToTalkInterruptedPlaybackRef = useRef(false);
  const bargeInConfirmationTimerRef = useRef<number | null>(null);
  const unclosedTurnTimerRef = useRef<number | null>(null);
  const audioInputResetTimerRef = useRef<number | null>(null);
  const forcedTranscriptFallbackTimerRef = useRef<number | null>(null);
  const ignoreNextSpeechStoppedRef = useRef(false);
  const confirmedBargeInRef = useRef(false);
  const finishStartedRef = useRef(false);
  const evidenceReviewPendingRef = useRef(false);
  const evidenceReviewTextRef = useRef("");
  const evidenceReviewTimerRef = useRef<number | null>(null);
  const closingResponseDoneAtRef = useRef<number | null>(null);
  const closingAudioObservedRef = useRef(false);
  const closingLastAudibleAtRef = useRef<number | null>(null);
  const closingPlaybackStoppedRef = useRef(false);
  const closingPlaybackTimerRef = useRef<number | null>(null);
  const turnResponseDoneAtRef = useRef<number | null>(null);
  const turnAudioObservedRef = useRef(false);
  const turnLastAudibleAtRef = useRef<number | null>(null);
  const turnPlaybackStoppedRef = useRef(false);
  const turnPlaybackTimerRef = useRef<number | null>(null);
  const pronunciationPracticeRef = useRef<PronunciationPracticeState>(null);
  const sessionLevelRef = useRef<string | null>(null);
  const explanationLanguageRef = useRef<HanExplanationLanguage>(
    explanationLanguage === "ES"
      ? "Spanish"
      : explanationLanguage === "ZH"
        ? "Chinese"
        : "English",
  );

  const stopVoiceSignalAnalysis = useCallback(() => {
    if (audioAnalysisFrameRef.current != null)
      window.cancelAnimationFrame(audioAnalysisFrameRef.current);
    audioAnalysisFrameRef.current = null;
    audioSourceRef.current?.disconnect();
    audioSourceRef.current = null;
    audioAnalyserRef.current?.disconnect();
    audioAnalyserRef.current = null;
    if (audioContextRef.current) void audioContextRef.current.close();
    audioContextRef.current = null;
    orbRef.current?.style.removeProperty("--learner-level");
    orbRef.current?.style.removeProperty("--learner-scale");
    orbRef.current?.style.removeProperty("--learner-glow");
    orbRef.current?.style.removeProperty("--learner-blur");
    orbRef.current?.style.removeProperty("--learner-spread");
    activeVoiceTurnRef.current = null;
    activeVoiceTurnItemIdRef.current = null;
    discardedVoiceTurnItemIdsRef.current.clear();
    completedVoiceTurnSignalsRef.current = [];
    ambientNoiseFloorRef.current = INITIAL_AMBIENT_NOISE_FLOOR_RMS;
  }, []);

  const startVoiceSignalAnalysis = useCallback(
    (stream: MediaStream) => {
      stopVoiceSignalAnalysis();
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = audioContext;
        audioSourceRef.current = source;
        audioAnalyserRef.current = analyser;
        void audioContext.resume();

        const samples = new Float32Array(analyser.fftSize);
        const sampleSignal = () => {
          const currentAnalyser = audioAnalyserRef.current;
          if (!currentAnalyser) return;

          currentAnalyser.getFloatTimeDomainData(samples);
          const rms = rmsFromTimeDomainSamples(samples);
          const now = performance.now();
          const audioEnabled =
            streamRef.current
              ?.getAudioTracks()
              .some((track) => track.enabled) ?? false;
          const activeTurn = activeVoiceTurnRef.current;

          // Companion's outer jade ring follows the learner's existing mic
          // analyser. CSS variables keep this 60fps path outside React.
          const learnerVisualLevel = audioEnabled
            ? Math.sqrt(
                Math.min(
                  1,
                  Math.max(
                    0,
                    (rms - ambientNoiseFloorRef.current * 1.15) / 0.09,
                  ),
                ),
              )
            : 0;
          if (orbRef.current) {
            orbRef.current.style.setProperty(
              "--learner-level",
              learnerVisualLevel.toFixed(3),
            );
            orbRef.current.style.setProperty(
              "--learner-scale",
              (1 + learnerVisualLevel * 0.13).toFixed(3),
            );
            orbRef.current.style.setProperty(
              "--learner-glow",
              (0.12 + learnerVisualLevel * 0.78).toFixed(3),
            );
            orbRef.current.style.setProperty(
              "--learner-blur",
              `${22 + learnerVisualLevel * 48}px`,
            );
            orbRef.current.style.setProperty(
              "--learner-spread",
              `${2 + learnerVisualLevel * 12}px`,
            );
          }

          if (audioEnabled && activeTurn) {
            const elapsedSinceSample = Math.max(
              0,
              Math.min(50, now - activeTurn.lastSampleAt),
            );
            activeTurn.lastSampleAt = now;
            activeTurn.peakRms = Math.max(activeTurn.peakRms, rms);
            activeTurn.sampleCount += 1;
            activeTurn.rmsSum += rms;
            activeTurn.rmsSquareSum += rms * rms;
            const voicedThreshold = Math.max(
              0.006,
              activeTurn.noiseFloorRms * 1.6,
            );
            if (rms >= voicedThreshold)
              activeTurn.voicedMs += elapsedSinceSample;
          } else if (audioEnabled) {
            // Learn the room slowly on rising energy so the first sound of a
            // learner's voice is not mistaken for a new noise baseline while
            // the server's speech_started event is still in flight.
            ambientNoiseFloorRef.current = updateAmbientNoiseFloor(
              ambientNoiseFloorRef.current,
              rms,
            );
          }

          audioAnalysisFrameRef.current =
            window.requestAnimationFrame(sampleSignal);
        };
        audioAnalysisFrameRef.current =
          window.requestAnimationFrame(sampleSignal);
      } catch {
        // Web Audio measurement is an enhancement. The Realtime session must
        // remain usable if a browser blocks or lacks the analyser API.
        stopVoiceSignalAnalysis();
      }
    },
    [stopVoiceSignalAnalysis],
  );

  const stopRemoteAudioAnalysis = useCallback(() => {
    if (remoteAudioAnalysisFrameRef.current != null)
      window.cancelAnimationFrame(remoteAudioAnalysisFrameRef.current);
    remoteAudioAnalysisFrameRef.current = null;
    remoteAudioSourceRef.current?.disconnect();
    remoteAudioSourceRef.current = null;
    remoteAudioAnalyserRef.current?.disconnect();
    remoteAudioAnalyserRef.current = null;
    remoteAudioGainRef.current?.disconnect();
    remoteAudioGainRef.current = null;
    if (remoteAudioContextRef.current)
      void remoteAudioContextRef.current.close();
    remoteAudioContextRef.current = null;
    remoteAudioAudibleRef.current = false;
    orbRef.current?.style.removeProperty("--han-level");
    orbRef.current?.style.removeProperty("--han-scale");
    orbRef.current?.style.removeProperty("--han-glow");
    orbRef.current?.style.removeProperty("--han-core-scale");
    orbRef.current?.style.removeProperty("--han-brightness");
    orbRef.current?.style.removeProperty("--han-blur");
    orbRef.current?.style.removeProperty("--han-spread");
  }, []);

  const startRemoteAudioAnalysis = useCallback(
    (stream: MediaStream) => {
      stopRemoteAudioAnalysis();
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const analyser = audioContext.createAnalyser();
        const silentGain = audioContext.createGain();
        const source = audioContext.createMediaStreamSource(stream);
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.15;
        silentGain.gain.value = 0;
        source.connect(analyser);
        analyser.connect(silentGain);
        silentGain.connect(audioContext.destination);
        remoteAudioContextRef.current = audioContext;
        remoteAudioSourceRef.current = source;
        remoteAudioAnalyserRef.current = analyser;
        remoteAudioGainRef.current = silentGain;
        void audioContext.resume();

        const samples = new Float32Array(analyser.fftSize);
        const sampleOutput = () => {
          const currentAnalyser = remoteAudioAnalyserRef.current;
          if (!currentAnalyser) return;
          currentAnalyser.getFloatTimeDomainData(samples);
          const rms = rmsFromTimeDomainSamples(samples);
          remoteAudioAudibleRef.current = rms >= CLOSING_AUDIO_RMS_THRESHOLD;
          // The orb consumes Han's already-measured output signal directly.
          // CSS variables keep the 60fps visual path outside React's render
          // cycle; the conversation state machine and audio pipeline remain
          // exactly the same for every variant.
          const visualLevel = Math.sqrt(
            Math.min(1, Math.max(0, (rms - 0.004) / 0.11)),
          );
          if (orbRef.current) {
            orbRef.current.style.setProperty(
              "--han-level",
              visualLevel.toFixed(3),
            );
            orbRef.current.style.setProperty(
              "--han-scale",
              (1 + visualLevel * 0.105).toFixed(3),
            );
            orbRef.current.style.setProperty(
              "--han-glow",
              (0.2 + visualLevel * 0.62).toFixed(3),
            );
            orbRef.current.style.setProperty(
              "--han-core-scale",
              (1 + visualLevel * 0.07).toFixed(3),
            );
            orbRef.current.style.setProperty(
              "--han-brightness",
              (1 + visualLevel * 0.28).toFixed(3),
            );
            orbRef.current.style.setProperty(
              "--han-blur",
              `${26 + visualLevel * 54}px`,
            );
            orbRef.current.style.setProperty(
              "--han-spread",
              `${3 + visualLevel * 14}px`,
            );
          }
          if (rms >= CLOSING_AUDIO_RMS_THRESHOLD) {
            const now = performance.now();
            if (closingTurnRef.current) {
              closingAudioObservedRef.current = true;
              closingLastAudibleAtRef.current = now;
            } else if (
              context.rolePlay &&
              (activeResponseRef.current ||
                turnResponseDoneAtRef.current != null)
            ) {
              turnAudioObservedRef.current = true;
              turnLastAudibleAtRef.current = now;
            }
          }
          remoteAudioAnalysisFrameRef.current =
            window.requestAnimationFrame(sampleOutput);
        };
        remoteAudioAnalysisFrameRef.current =
          window.requestAnimationFrame(sampleOutput);
      } catch {
        stopRemoteAudioAnalysis();
      }
    },
    [context.rolePlay, stopRemoteAudioAnalysis],
  );

  function snapshotActiveVoiceTurn(): RealtimeVoiceTurnSignal | null {
    const activeTurn = activeVoiceTurnRef.current;
    if (!activeTurn) return null;
    const meanRms =
      activeTurn.sampleCount > 0
        ? activeTurn.rmsSum / activeTurn.sampleCount
        : 0;
    const variance =
      activeTurn.sampleCount > 0
        ? Math.max(
            0,
            activeTurn.rmsSquareSum / activeTurn.sampleCount - meanRms ** 2,
          )
        : 0;
    return {
      durationMs: Math.max(0, performance.now() - activeTurn.startedAt),
      voicedMs: activeTurn.voicedMs,
      peakRms: activeTurn.peakRms,
      noiseFloorRms: activeTurn.noiseFloorRms,
      meanRms,
      rmsStandardDeviation: Math.sqrt(variance),
    };
  }

  function completeActiveVoiceTurn(): RealtimeVoiceTurnSignal | null {
    const signal = snapshotActiveVoiceTurn();
    if (!signal) return null;
    activeVoiceTurnRef.current = null;
    activeVoiceTurnItemIdRef.current = null;
    completedVoiceTurnSignalsRef.current.push(signal);
    if (completedVoiceTurnSignalsRef.current.length > 4)
      completedVoiceTurnSignalsRef.current.shift();
    return signal;
  }

  function setMicrophoneInputEnabled(enabled: boolean) {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  function silenceRemotePlaybackImmediately() {
    remotePlaybackSuppressedRef.current = true;
    remoteAudioAudibleRef.current = false;
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = true;
  }

  function resumeRemotePlaybackForNextResponse() {
    if (!remotePlaybackSuppressedRef.current) return;
    remotePlaybackSuppressedRef.current = false;
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = false;
  }

  function beginPushToTalk() {
    const channel = dataChannelRef.current;
    const isInterruptingResponse = activeResponseRef.current;
    const isInterruptingPlayback =
      outputPlaybackActiveRef.current ||
      remoteAudioAudibleRef.current ||
      state === "speaking";
    if (
      !canBeginRealtimePushToTalk(
        state,
        isInterruptingResponse,
        isInterruptingPlayback,
      ) ||
      pushToTalkActiveRef.current ||
      channel?.readyState !== "open" ||
      finishStartedRef.current ||
      closingTurnRef.current ||
      closeRequestedRef.current
    )
      return;

    // A fresh buffer for every physical press is the key noise boundary:
    // audio from before this moment can never become part of the learner turn.
    if (isInterruptingResponse || isInterruptingPlayback) {
      // This is a deliberate press, not an inferred noise/VAD interruption.
      // Remember it until the cancelled response emits response.done so that
      // its cleanup cannot mute the learner's new turn.
      pushToTalkInterruptedResponseRef.current = isInterruptingResponse;
      pushToTalkInterruptedPlaybackRef.current = isInterruptingPlayback;
      confirmedBargeInRef.current = true;
      turnPlaybackStoppedRef.current = true;
      silenceRemotePlaybackImmediately();
    }
    for (const event of buildRealtimePushToTalkStartEvents(
      isInterruptingResponse,
      isInterruptingPlayback,
    ))
      channel.send(JSON.stringify(event));
    if (isInterruptingPlayback) outputPlaybackActiveRef.current = false;
    completedVoiceTurnSignalsRef.current = [];
    const now = performance.now();
    activeVoiceTurnRef.current = {
      startedAt: now,
      lastSampleAt: now,
      voicedMs: 0,
      peakRms: 0,
      noiseFloorRms: ambientNoiseFloorRef.current,
      sampleCount: 0,
      rmsSum: 0,
      rmsSquareSum: 0,
    };
    activeVoiceTurnItemIdRef.current = null;
    pushToTalkActiveRef.current = true;
    setPushToTalkActive(true);
    setError(null);
    setLatestCaption("Listening… release to send.");
    setState("listening");
    setMicrophoneInputEnabled(true);
  }

  function endPushToTalk() {
    if (!pushToTalkActiveRef.current) return;

    // Disable the physical input first. Analysis and network work happen only
    // after the microphone has stopped accepting room audio.
    pushToTalkActiveRef.current = false;
    setPushToTalkActive(false);
    setMicrophoneInputEnabled(false);

    const channel = dataChannelRef.current;
    const signal = snapshotActiveVoiceTurn();
    if (channel?.readyState !== "open") {
      activeVoiceTurnRef.current = null;
      activeVoiceTurnItemIdRef.current = null;
      return;
    }

    // OpenAI requires a real audio buffer before commit. Treat a tap as a UI
    // gesture, not a learner utterance, so it cannot generate a noise reply.
    if (!signal || signal.durationMs < 180) {
      activeVoiceTurnRef.current = null;
      activeVoiceTurnItemIdRef.current = null;
      channel.send(JSON.stringify({ type: "input_audio_buffer.clear" }));
      setLatestCaption("Hold the red button while you speak.");
      setState("listening");
      return;
    }

    completeActiveVoiceTurn();
    channel.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    setLatestCaption("Analyzing what you said…");
    setState("thinking");
  }

  function handlePushToTalkPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    beginPushToTalk();
  }

  function handlePushToTalkPointerEnd(
    event: ReactPointerEvent<HTMLButtonElement>,
  ) {
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    endPushToTalk();
  }

  function handlePushToTalkKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
  ) {
    if ((event.key !== " " && event.key !== "Enter") || event.repeat) return;
    event.preventDefault();
    beginPushToTalk();
  }

  function handlePushToTalkKeyUp(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    endPushToTalk();
  }

  function interruptActiveRealtimeResponse() {
    const channel = dataChannelRef.current;
    if (channel?.readyState !== "open" || !activeResponseRef.current) return;
    confirmedBargeInRef.current = true;
    turnPlaybackStoppedRef.current = true;
    silenceRemotePlaybackImmediately();
    channel.send(JSON.stringify({ type: "response.cancel" }));
    channel.send(JSON.stringify({ type: "output_audio_buffer.clear" }));
  }

  function clearUnclosedTurnTimer() {
    if (unclosedTurnTimerRef.current != null)
      window.clearTimeout(unclosedTurnTimerRef.current);
    unclosedTurnTimerRef.current = null;
  }

  function createBriefInputSilenceBoundary() {
    if (audioInputResetTimerRef.current != null)
      window.clearTimeout(audioInputResetTimerRef.current);
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    audioInputResetTimerRef.current = window.setTimeout(() => {
      audioInputResetTimerRef.current = null;
      if (
        finishStartedRef.current ||
        closingTurnRef.current ||
        closeRequestedRef.current ||
        !pushToTalkActiveRef.current
      )
        return;
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
    }, 220);
  }

  function recoverUnclosedFreeTopicTurn() {
    clearUnclosedTurnTimer();
    const rolePlay = contextRef.current.rolePlay;
    const channel = dataChannelRef.current;
    if (
      !rolePlay?.isFreeTopic ||
      channel?.readyState !== "open" ||
      !activeVoiceTurnRef.current
    )
      return;

    const signal = snapshotActiveVoiceTurn();
    const action = stuckFreeTopicTurnAction(signal);
    if (action === "commit") {
      completeActiveVoiceTurn();
      channel.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      setState("thinking");
      forcedTranscriptFallbackTimerRef.current = window.setTimeout(() => {
        forcedTranscriptFallbackTimerRef.current = null;
        completedVoiceTurnSignalsRef.current = [];
        pendingUserTextRef.current = "";
        setLatestCaption("Hold the red button to talk.");
        setState("listening");
      }, 5_000);
    } else {
      const discardedItemId = activeVoiceTurnItemIdRef.current;
      if (discardedItemId) {
        discardedVoiceTurnItemIdsRef.current.add(discardedItemId);
        if (discardedVoiceTurnItemIdsRef.current.size > 8) {
          const oldestItemId = discardedVoiceTurnItemIdsRef.current
            .values()
            .next().value;
          if (oldestItemId)
            discardedVoiceTurnItemIdsRef.current.delete(oldestItemId);
        }
      }
      activeVoiceTurnRef.current = null;
      activeVoiceTurnItemIdRef.current = null;
      completedVoiceTurnSignalsRef.current = [];
      ignoreNextSpeechStoppedRef.current = true;
      channel.send(JSON.stringify({ type: "input_audio_buffer.clear" }));
      setLatestCaption("Hold the red button to talk.");
      setState("listening");
    }
    // Continuous music can keep server VAD open even after its buffered bytes
    // are cleared. A tiny real silence boundary lets VAD reset without making
    // the learner press Stop or restart the conversation.
    createBriefInputSilenceBoundary();
  }

  const stopMedia = useCallback(() => {
    if (sessionTimerRef.current != null)
      window.clearInterval(sessionTimerRef.current);
    if (sessionConfigurationTimerRef.current != null)
      window.clearTimeout(sessionConfigurationTimerRef.current);
    if (naturalCloseTimerRef.current != null)
      window.clearTimeout(naturalCloseTimerRef.current);
    sessionTimerRef.current = null;
    sessionConfigurationTimerRef.current = null;
    pendingSessionActivationRef.current = null;
    pendingSessionInstructionsRef.current = null;
    naturalCloseTimerRef.current = null;
    if (closingPlaybackTimerRef.current != null)
      window.clearTimeout(closingPlaybackTimerRef.current);
    closingPlaybackTimerRef.current = null;
    if (turnPlaybackTimerRef.current != null)
      window.clearTimeout(turnPlaybackTimerRef.current);
    turnPlaybackTimerRef.current = null;
    if (bargeInConfirmationTimerRef.current != null)
      window.clearTimeout(bargeInConfirmationTimerRef.current);
    bargeInConfirmationTimerRef.current = null;
    clearUnclosedTurnTimer();
    if (audioInputResetTimerRef.current != null)
      window.clearTimeout(audioInputResetTimerRef.current);
    audioInputResetTimerRef.current = null;
    if (forcedTranscriptFallbackTimerRef.current != null)
      window.clearTimeout(forcedTranscriptFallbackTimerRef.current);
    forcedTranscriptFallbackTimerRef.current = null;
    if (evidenceReviewTimerRef.current != null)
      window.clearTimeout(evidenceReviewTimerRef.current);
    evidenceReviewTimerRef.current = null;
    const channel = dataChannelRef.current;
    if (channel?.readyState === "open") {
      channel.send(JSON.stringify({ type: "response.cancel" }));
      channel.send(JSON.stringify({ type: "output_audio_buffer.clear" }));
    }
    channel?.close();
    dataChannelRef.current = null;
    peerRef.current
      ?.getReceivers()
      .forEach((receiver) => receiver.track?.stop());
    peerRef.current?.getSenders().forEach((sender) => sender.track?.stop());
    peerRef.current?.close();
    peerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
      audioRef.current.load();
    }
    audioRef.current = null;
    remotePlaybackSuppressedRef.current = false;
    remoteAudioAudibleRef.current = false;
    stopVoiceSignalAnalysis();
    stopRemoteAudioAnalysis();
    pendingUserTextRef.current = "";
    openingTurnRef.current = false;
    replyNeedsAssessmentRef.current = false;
    remainingPracticeTargetsRef.current = null;
    pendingTurnInstructionsRef.current = "";
    lastTutorTurnInstructionsRef.current = "";
    tutorContinuationCountRef.current = 0;
    ephemeralTurnGuardItemIdRef.current = null;
    closingTurnRef.current = false;
    closeRequestedRef.current = false;
    closeAfterReplyRef.current = false;
    activeResponseRef.current = false;
    outputPlaybackActiveRef.current = false;
    pushToTalkInterruptedResponseRef.current = false;
    pushToTalkInterruptedPlaybackRef.current = false;
    confirmedBargeInRef.current = false;
    ignoreNextSpeechStoppedRef.current = false;
    activeVoiceTurnItemIdRef.current = null;
    discardedVoiceTurnItemIdsRef.current.clear();
    closingResponseDoneAtRef.current = null;
    closingAudioObservedRef.current = false;
    closingLastAudibleAtRef.current = null;
    closingPlaybackStoppedRef.current = false;
    turnResponseDoneAtRef.current = null;
    turnAudioObservedRef.current = false;
    turnLastAudibleAtRef.current = null;
    turnPlaybackStoppedRef.current = false;
    pronunciationPracticeRef.current = null;
    sessionLevelRef.current = null;
    speakingEvidenceRef.current = [];
    evidenceReviewPendingRef.current = false;
    evidenceReviewTextRef.current = "";
    pushToTalkActiveRef.current = false;
    onActiveChange(false);
    setPushToTalkActive(false);
    setState("idle");
  }, [onActiveChange, stopRemoteAudioAnalysis, stopVoiceSignalAnalysis]);

  const completeConversationAfterEvidence = useCallback(async () => {
    const transcript = [...transcriptRef.current];
    const speakingEvidence = [...speakingEvidenceRef.current];
    const diagnostics = {
      learnerTurnConfidences: [...learnerTurnConfidencesRef.current],
      speakingEvidence,
    };
    const finalContext = contextRef.current;
    if (
      finalContext.rolePlay &&
      !finalContext.rolePlay.isFreeTopic &&
      finalContext.lessonTitle &&
      speakingEvidence.length > 0
    ) {
      const save = saveRealtimeSpeakingEvidenceAction(
        speakingEvidence,
        finalContext,
      );
      pendingSavesRef.current.push(save);
      void save.catch(() => undefined);
    }
    stopMedia();
    await Promise.allSettled(pendingSavesRef.current);
    pendingSavesRef.current = [];
    await onComplete?.(transcript, diagnostics);
  }, [onComplete, stopMedia]);

  const finishConversation = useCallback(async () => {
    if (finishStartedRef.current) return;
    finishStartedRef.current = true;
    const rolePlay = contextRef.current.rolePlay;
    const channel = dataChannelRef.current;
    if (
      rolePlay &&
      completionPolicy === "timer" &&
      speakingEvidenceRef.current.length > 0 &&
      channel?.readyState === "open" &&
      !activeResponseRef.current
    ) {
      evidenceReviewPendingRef.current = true;
      evidenceReviewTextRef.current = "";
      closingTurnRef.current = false;
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      setState("thinking");
      setLatestCaption("Preparing your speaking feedback…");
      channel.send(
        JSON.stringify({
          type: "response.create",
          response: {
            output_modalities: ["text"],
            instructions: buildSpeakingEvidenceReviewInstructions(
              rolePlay,
              speakingEvidenceRef.current,
            ),
            tools: [],
            tool_choice: "none",
            metadata: { hango_phase: "speaking_evidence" },
            max_output_tokens: 600,
          },
        }),
      );
      evidenceReviewTimerRef.current = window.setTimeout(() => {
        if (!evidenceReviewPendingRef.current) return;
        evidenceReviewPendingRef.current = false;
        evidenceReviewTimerRef.current = null;
        void completeConversationAfterEvidence();
      }, 8_000);
      return;
    }
    await completeConversationAfterEvidence();
  }, [completeConversationAfterEvidence, completionPolicy]);

  const finishAfterClosingPlayback = useCallback(() => {
    if (closingPlaybackTimerRef.current != null)
      window.clearTimeout(closingPlaybackTimerRef.current);
    const checkPlayback = () => {
      if (
        shouldFinishClosingPlayback(
          {
            responseDoneAt: closingResponseDoneAtRef.current,
            audioObserved: closingAudioObservedRef.current,
            lastAudibleAt: closingLastAudibleAtRef.current,
            playbackStoppedEvent: closingPlaybackStoppedRef.current,
          },
          performance.now(),
        )
      ) {
        closingPlaybackTimerRef.current = null;
        void finishConversation();
        return;
      }
      closingPlaybackTimerRef.current = window.setTimeout(checkPlayback, 50);
    };
    checkPlayback();
  }, [finishConversation]);

  const requestNaturalClose = useCallback(() => {
    const rolePlay = contextRef.current.rolePlay ?? context.rolePlay;
    const channel = dataChannelRef.current;
    if (!rolePlay || channel?.readyState !== "open") {
      void finishConversation();
      return;
    }
    closingTurnRef.current = true;
    closeRequestedRef.current = false;
    closingResponseDoneAtRef.current = null;
    closingAudioObservedRef.current = false;
    closingLastAudibleAtRef.current = null;
    closingPlaybackStoppedRef.current = false;
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    setState("thinking");
    setLatestCaption("Finishing the scene…");
    channel.send(
      JSON.stringify({
        type: "response.create",
        response: {
          instructions: buildRealtimeClosingInstructions(rolePlay),
          tools: [],
          tool_choice: "none",
          metadata: { hango_phase: "closing" },
          max_output_tokens: realtimeRolePlayOutputTokenLimit(
            rolePlay,
            "closing",
          ),
        },
      }),
    );
  }, [context.rolePlay, finishConversation]);

  function resumeRolePlayListening() {
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    pushToTalkActiveRef.current = false;
    setPushToTalkActive(false);
    setLatestCaption("Hold the red button to talk.");
    setState("listening");
  }

  function completeRolePlayResponseAfterPlayback() {
    turnResponseDoneAtRef.current = null;
    turnAudioObservedRef.current = false;
    turnLastAudibleAtRef.current = null;
    turnPlaybackStoppedRef.current = false;
    if (openingTurnRef.current) openingTurnRef.current = false;
    if (closeAfterReplyRef.current) {
      closeAfterReplyRef.current = false;
      replyNeedsAssessmentRef.current = false;
      requestNaturalClose();
      return;
    }
    if (replyNeedsAssessmentRef.current) {
      replyNeedsAssessmentRef.current = false;
      resumeRolePlayListening();
      return;
    }
    if (closingTurnRef.current) return;
    if (closeRequestedRef.current) {
      requestNaturalClose();
      return;
    }
    resumeRolePlayListening();
  }

  function finishAfterRolePlayTurnPlayback() {
    if (turnPlaybackTimerRef.current != null)
      window.clearTimeout(turnPlaybackTimerRef.current);
    const checkPlayback = () => {
      if (
        shouldFinishClosingPlayback(
          {
            responseDoneAt: turnResponseDoneAtRef.current,
            audioObserved: turnAudioObservedRef.current,
            lastAudibleAt: turnLastAudibleAtRef.current,
            playbackStoppedEvent: turnPlaybackStoppedRef.current,
          },
          performance.now(),
        )
      ) {
        turnPlaybackTimerRef.current = null;
        completeRolePlayResponseAfterPlayback();
        return;
      }
      turnPlaybackTimerRef.current = window.setTimeout(checkPlayback, 50);
    };
    checkPlayback();
  }

  function sendAssessedRolePlayReply(
    rolePlay: RolePlayContext,
    assessment: ConversationCompletionAssessment | null,
  ) {
    if (closingTurnRef.current) return;
    if (closeRequestedRef.current) {
      requestNaturalClose();
      return;
    }
    const channel = dataChannelRef.current;
    if (channel?.readyState !== "open") return;
    if (assessment) {
      const assessmentGuard = buildRealtimeAssessmentTurnGuard(
        assessment,
        transcriptRef.current,
        rolePlay,
      );
      pendingTurnInstructionsRef.current =
        shouldHoldRealtimeLearnerAction(
          assessment,
          rolePlay,
          transcriptRef.current,
        ) || Boolean(assessment.nextCharacterUtterance)
          ? assessmentGuard
          : `${pendingTurnInstructionsRef.current} ${assessmentGuard}`;
    } else {
      // Do not fall back to an unconstrained Realtime reply. If the private
      // planner is temporarily unavailable, a deterministic guard keeps the
      // model from asking for an established fact such as the learner's name.
      pendingTurnInstructionsRef.current = buildRealtimeAssessmentFallbackGuard(
        transcriptRef.current,
      );
    }
    replyNeedsAssessmentRef.current = true;
    resumeRemotePlaybackForNextResponse();
    const guardItemId = `item_guard_${crypto.randomUUID().replaceAll("-", "").slice(0, 21)}`;
    ephemeralTurnGuardItemIdRef.current = guardItemId;
    channel.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          id: guardItemId,
          type: "message",
          role: "system",
          content: [
            {
              type: "input_text",
              text: `One-turn override. Follow this instruction for the next assistant audio only: ${pendingTurnInstructionsRef.current}`,
            },
          ],
        },
      }),
    );
    channel.send(
      JSON.stringify({
        type: "response.create",
        response: {
          instructions: pendingTurnInstructionsRef.current,
          tools: [],
          tool_choice: "none",
          max_output_tokens: realtimeRolePlayOutputTokenLimit(rolePlay, "turn"),
        },
      }),
    );
  }

  /**
   * Same low-latency response path used by Han's own live conversation. The
   * temporary system item adds only this turn's constraints while preserving
   * the Realtime session identity, history, level, and role-play context.
   */
  function sendSessionPreservingRealtimeReply(
    turnInstructions: string,
    maxOutputTokens?: number,
  ) {
    const channel = dataChannelRef.current;
    if (channel?.readyState !== "open") return;
    if (activeResponseRef.current) {
      // Realtime accepts only one active response. Keep the newest learner
      // turn queued until the current response is cancelled/completed.
      pendingTurnInstructionsRef.current = turnInstructions;
      interruptActiveRealtimeResponse();
      setState("thinking");
      return;
    }
    resumeRemotePlaybackForNextResponse();
    // Mark synchronously, before response.created comes back. Otherwise two
    // transcription events in the same network window can both request a
    // response and the API rejects the second one.
    activeResponseRef.current = true;
    if (mode === "TUTOR" && !contextRef.current.rolePlay)
      lastTutorTurnInstructionsRef.current = turnInstructions;
    const guardItemId = `item_guard_${crypto.randomUUID().replaceAll("-", "").slice(0, 21)}`;
    ephemeralTurnGuardItemIdRef.current = guardItemId;
    const { guardEvent, responseEvent } =
      buildSessionPreservingRealtimeTurnEvents(turnInstructions, guardItemId);
    channel.send(JSON.stringify(guardEvent));
    channel.send(
      JSON.stringify(
        maxOutputTokens
          ? {
              ...responseEvent,
              response: { max_output_tokens: maxOutputTokens },
            }
          : responseEvent,
      ),
    );
  }

  useEffect(() => () => stopMedia(), [stopMedia]);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);
  useEffect(() => {
    if (open) return;
    const timeout = window.setTimeout(stopMedia, 0);
    return () => window.clearTimeout(timeout);
  }, [open, stopMedia]);

  async function handleRealtimeEvent(message: MessageEvent<string>) {
    let event: RealtimeEvent;
    try {
      event = JSON.parse(message.data) as RealtimeEvent;
    } catch {
      return;
    }
    const activeContext = contextRef.current;
    const allowsBargeIn = allowsRealtimeBargeIn(activeContext.rolePlay);
    if (event.type === "session.updated") {
      const expectedInstructions = pendingSessionInstructionsRef.current;
      if (!expectedInstructions) return;
      if (sessionConfigurationTimerRef.current != null)
        window.clearTimeout(sessionConfigurationTimerRef.current);
      sessionConfigurationTimerRef.current = null;
      pendingSessionInstructionsRef.current = null;
      if (event.session?.instructions !== expectedInstructions) {
        pendingSessionActivationRef.current = null;
        setError("Han's live voice identity could not be confirmed.");
        stopMedia();
        onUnavailable?.();
        return;
      }
      const activateSession = pendingSessionActivationRef.current;
      pendingSessionActivationRef.current = null;
      activateSession?.();
      return;
    }
    if (event.type === "input_audio_buffer.speech_started") {
      clearUnclosedTurnTimer();
      ignoreNextSpeechStoppedRef.current = false;
      if (bargeInConfirmationTimerRef.current != null)
        window.clearTimeout(bargeInConfirmationTimerRef.current);
      bargeInConfirmationTimerRef.current = null;
      confirmedBargeInRef.current = false;
      const now = performance.now();
      activeVoiceTurnRef.current = {
        startedAt: now,
        lastSampleAt: now,
        voicedMs: 0,
        peakRms: 0,
        noiseFloorRms: ambientNoiseFloorRef.current,
        sampleCount: 0,
        rmsSum: 0,
        rmsSquareSum: 0,
      };
      activeVoiceTurnItemIdRef.current = event.item_id ?? null;
      if (activeContext.rolePlay?.isFreeTopic) {
        unclosedTurnTimerRef.current = window.setTimeout(
          recoverUnclosedFreeTopicTurn,
          freeTopicUnclosedTurnTimeoutMs(activeContext.rolePlay.level),
        );
      }
      if (allowsBargeIn && activeResponseRef.current) {
        // OpenAI VAD may label music as speech. Keep Han talking until the
        // browser sees sustained, foreground, speech-like energy; only then
        // cancel the active answer to allow a genuine learner interruption.
        bargeInConfirmationTimerRef.current = window.setTimeout(() => {
          bargeInConfirmationTimerRef.current = null;
          if (
            activeResponseRef.current &&
            isConfidentLearnerBargeIn(snapshotActiveVoiceTurn())
          ) {
            interruptActiveRealtimeResponse();
            setState("listening");
          }
        }, REALTIME_BARGE_IN_CONFIRMATION_MS);
        return;
      }
      setState("listening");
    }
    if (
      event.type === "input_audio_buffer.speech_stopped" ||
      event.type === "response.created"
    ) {
      if (event.type === "input_audio_buffer.speech_stopped") {
        clearUnclosedTurnTimer();
        if (bargeInConfirmationTimerRef.current != null)
          window.clearTimeout(bargeInConfirmationTimerRef.current);
        bargeInConfirmationTimerRef.current = null;
        if (ignoreNextSpeechStoppedRef.current) {
          ignoreNextSpeechStoppedRef.current = false;
          activeVoiceTurnRef.current = null;
          activeVoiceTurnItemIdRef.current = null;
          setState("listening");
          return;
        }
        const signal = completeActiveVoiceTurn();
        if (
          allowsBargeIn &&
          activeResponseRef.current &&
          !confirmedBargeInRef.current
        ) {
          if (isConfidentLearnerBargeIn(signal)) {
            interruptActiveRealtimeResponse();
          } else {
            // Unconfirmed music/noise must not change a speaking answer into
            // an indefinite "Thinking" state.
            return;
          }
        }
      }
      setState("thinking");
    }
    if (event.type === "response.created") {
      activeResponseRef.current = true;
      pushToTalkActiveRef.current = false;
      setPushToTalkActive(false);
      setMicrophoneInputEnabled(false);
      if (activeContext.rolePlay && !allowsBargeIn) {
        if (!closingTurnRef.current) {
          if (turnPlaybackTimerRef.current != null)
            window.clearTimeout(turnPlaybackTimerRef.current);
          turnPlaybackTimerRef.current = null;
          turnResponseDoneAtRef.current = null;
          turnAudioObservedRef.current = false;
          turnLastAudibleAtRef.current = null;
          turnPlaybackStoppedRef.current = false;
        }
        streamRef.current?.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      }
    }
    if (event.type === "response.output_audio.delta") {
      // A few already-in-flight audio events may arrive after response.cancel.
      // They belong to the interrupted answer and must never restart playback,
      // switch the UI back to speaking, or disable the learner's held mic.
      if (remotePlaybackSuppressedRef.current) return;
      activeResponseRef.current = true;
      outputPlaybackActiveRef.current = true;
      pushToTalkActiveRef.current = false;
      setPushToTalkActive(false);
      setMicrophoneInputEnabled(false);
      setState("speaking");
    }
    if (event.type === "output_audio_buffer.cleared") {
      outputPlaybackActiveRef.current = false;
      remoteAudioAudibleRef.current = false;
      pushToTalkInterruptedPlaybackRef.current = false;
    }
    if (event.type === "output_audio_buffer.stopped") {
      outputPlaybackActiveRef.current = false;
      if (pushToTalkInterruptedPlaybackRef.current) {
        pushToTalkInterruptedPlaybackRef.current = false;
        turnResponseDoneAtRef.current = null;
        turnAudioObservedRef.current = false;
        turnLastAudibleAtRef.current = null;
        turnPlaybackStoppedRef.current = true;
        return;
      }
      if (closingTurnRef.current && closingResponseDoneAtRef.current != null) {
        closingPlaybackStoppedRef.current = true;
        finishAfterClosingPlayback();
        return;
      }
      turnPlaybackStoppedRef.current = true;
      if (turnResponseDoneAtRef.current != null) {
        finishAfterRolePlayTurnPlayback();
        return;
      }
      if (!activeContext.rolePlay && !pushToTalkActiveRef.current) {
        setLatestCaption("Hold the red button to talk.");
        setState("listening");
      }
    }
    if (
      event.type === "conversation.item.input_audio_transcription.completed"
    ) {
      if (
        event.item_id &&
        discardedVoiceTurnItemIdsRef.current.delete(event.item_id)
      ) {
        pendingUserTextRef.current = "";
        setLatestCaption("Hold the red button to talk.");
        setState("listening");
        return;
      }
      if (forcedTranscriptFallbackTimerRef.current != null)
        window.clearTimeout(forcedTranscriptFallbackTimerRef.current);
      forcedTranscriptFallbackTimerRef.current = null;
      if (
        completedVoiceTurnSignalsRef.current.length === 0 &&
        activeVoiceTurnRef.current
      )
        completeActiveVoiceTurn();
      const voiceSignal = completedVoiceTurnSignalsRef.current.shift() ?? null;
      const rawTranscript = event.transcript?.trim();
      if (!rawTranscript || isNonSpeechNoiseTranscript(rawTranscript)) {
        setLatestCaption("Hold the red button to talk.");
        setState(
          allowsBargeIn && activeResponseRef.current ? "speaking" : "listening",
        );
        return;
      }

      const transcriptConfidence = confidenceFromLogprobs(event.logprobs);
      const assessment = activeContext.rolePlay
        ? assessMandarinRolePlayTranscript(
            rawTranscript,
            transcriptConfidence,
            transcriptHintsFromContext(activeContext),
          )
        : assessHanTranscript(
            rawTranscript,
            transcriptConfidence,
            transcriptHintsFromContext(activeContext),
          );
      if (!assessment.ok && assessment.reason === "prompt_leak") {
        pendingUserTextRef.current = "";
        setError(null);
        setLatestCaption("Hold the red button to talk.");
        setState(
          allowsBargeIn && activeResponseRef.current ? "speaking" : "listening",
        );
        return;
      }
      if (!assessment.ok) {
        pendingUserTextRef.current = "";
        if (allowsBargeIn && activeResponseRef.current) {
          // A low-confidence fragment while Han is speaking is usually room
          // audio, not a learner turn that deserves an alarming retry banner.
          setState("speaking");
          return;
        }
        const repeatMessage = activeContext.rolePlay
          ? "I couldn't recognize clear Mandarin. Please say it again."
          : HAN_STT_REPEAT_MESSAGE;
        setLatestCaption(repeatMessage);
        setError(repeatMessage);
        setState("listening");
        return;
      }

      const transcript = assessment.transcript;
      const isLikelyLearnerTurn = activeContext.rolePlay?.isFreeTopic
        ? isLikelyFreeTopicLearnerUtterance(
            voiceSignal,
            transcript,
            transcriptConfidence,
          )
        : isLikelyLearnerUtterance(voiceSignal, transcript);
      if (!isLikelyLearnerTurn) {
        pendingUserTextRef.current = "";
        setError(null);
        if (allowsBargeIn && activeResponseRef.current) {
          setState("speaking");
          return;
        }
        setLatestCaption("Hold the red button to talk.");
        setState("listening");
        return;
      }
      setError(null);
      {
        tutorContinuationCountRef.current = 0;
        if (activeContext.rolePlay && completionPolicy === "timer") {
          const learnerTurnIndex = speakingEvidenceRef.current.length + 1;
          speakingEvidenceRef.current.push(
            createSpeakingTurnEvidence(
              learnerTurnIndex,
              rawTranscript,
              transcript,
              transcriptConfidence,
            ),
          );
        }
        if (transcriptConfidence != null)
          learnerTurnConfidencesRef.current.push(transcriptConfidence);
        const requestedSessionLevel = detectExplicitHskSessionLevel(transcript);
        if (requestedSessionLevel)
          sessionLevelRef.current = requestedSessionLevel;
        const tutorControlCommand =
          !activeContext.rolePlay && mode === "TUTOR"
            ? buildHanTutorControlCommandInstruction(transcript)
            : null;
        const pronunciation = tutorControlCommand
          ? { state: pronunciationPracticeRef.current, progress: null }
          : advancePronunciationPractice(
              transcript,
              transcriptRef.current,
              pronunciationPracticeRef.current,
            );
        pronunciationPracticeRef.current = pronunciation.state;
        const currentTutorMessages = [
          ...transcriptRef.current
            .filter((message) => message.role === "user")
            .map((message) => message.content),
          transcript,
        ];
        const tutorSessionPreferences =
          deriveHanTutorSessionPreferences(currentTutorMessages);
        const requiredLanguage =
          !activeContext.rolePlay && mode === "PRACTICE"
            ? "Chinese"
            : !activeContext.rolePlay && mode === "TUTOR"
              ? resolveHanTutorConversationLanguage(
                  currentTutorMessages,
                  explanationLanguageRef.current,
                  tutorSessionPreferences,
                  {
                    latestIsPronunciationAttempt: Boolean(
                      pronunciation.progress,
                    ),
                  },
                )
              : nextHanExplanationLanguage(
                  transcript,
                  explanationLanguageRef.current,
                );
        explanationLanguageRef.current = requiredLanguage;
        pendingUserTextRef.current = transcript;
        transcriptRef.current.push({ role: "user", content: transcript });
        setLatestCaption(transcript);
        appendMessage({ role: "user", content: transcript });
        if (dataChannelRef.current?.readyState === "open") {
          const blocksForAssessment = activeContext.rolePlay
            ? shouldBlockForRolePlayAssessment(completionPolicy)
            : false;
          const turnInstructions = buildRealtimeTurnInstructions(
            requiredLanguage,
            activeContext.rolePlay,
            pronunciation.progress,
            transcript,
            sessionLevelRef.current,
            mode,
            blocksForAssessment ? "assessed" : "direct",
            transcriptRef.current,
          );
          if (activeContext.rolePlay && blocksForAssessment) {
            pendingTurnInstructionsRef.current = turnInstructions;
            setState("thinking");
            const rolePlay = activeContext.rolePlay;
            void requestRolePlayAssessment(
              rolePlay,
              transcript,
              "before_reply",
              transcriptRef.current,
              remainingPracticeTargetsRef.current,
              completionPolicy === "timer",
              minimumLearnerTurns,
              maximumLearnerTurns,
            )
              .then((assessment) => {
                remainingPracticeTargetsRef.current =
                  assessment.remainingPracticeTargets;
                if (
                  completionPolicy === "objective" &&
                  assessment.decision === "end"
                ) {
                  requestNaturalClose();
                  return;
                }
                if (
                  completionPolicy === "objective" &&
                  assessment.closeAfterReply
                )
                  closeAfterReplyRef.current = true;
                sendAssessedRolePlayReply(rolePlay, assessment);
              })
              .catch(() => sendAssessedRolePlayReply(rolePlay, null));
          } else if (activeContext.rolePlay) {
            // Timed lesson/Lab Speaking is evaluated from the saved transcript
            // in Reflection. Let Realtime answer immediately so the learner
            // gets the same fluid turn-taking as Han; only Placement keeps the
            // blocking private planner above.
            if (allowsBargeIn && activeResponseRef.current) {
              // The completed transcript proves this was a learner turn even
              // if the stricter early signal test could not. Stop the current
              // answer and send the reply after its response.done event.
              pendingTurnInstructionsRef.current = turnInstructions;
              interruptActiveRealtimeResponse();
              setState("thinking");
            } else {
              sendSessionPreservingRealtimeReply(
                turnInstructions,
                realtimeRolePlayOutputTokenLimit(
                  activeContext.rolePlay,
                  "turn",
                ),
              );
            }
          } else {
            // Keep ordinary Han turns cheap: only a question about HanGo
            // itself reaches the server resolver. Its result is attached to
            // the already-temporary turn guard and deleted after this reply.
            let instructionsForThisTurn = turnInstructions;
            const appIntent = detectHanAppContextIntent(
              transcript,
              activeContext.currentPageName,
            );
            if (appIntent) {
              streamRef.current?.getAudioTracks().forEach((track) => {
                track.enabled = false;
              });
              setState("thinking");
              try {
                const appContext = await getHanOnDemandAppContextAction(
                  transcript,
                  activeContext.currentPageName,
                );
                if (appContext)
                  instructionsForThisTurn = `${turnInstructions}\n\n${appContext}`;
              } catch {
                // App context is optional. Han can still answer normally if
                // this focused lookup is temporarily unavailable.
              }
            }
            if (dataChannelRef.current?.readyState !== "open") return;
            // Realtime response-level instructions override (rather than
            // extend) the session prompt. Keep Han's identity/adaptation in
            // force and add this turn's language rules as a temporary item.
            sendSessionPreservingRealtimeReply(
              instructionsForThisTurn,
              realtimeTutorPronunciationOutputTokenLimit(
                transcript,
                pronunciation.progress,
              ),
            );
          }
        }
      }
    }
    if (event.type === "response.output_audio_transcript.done") {
      const transcript = event.transcript?.trim();
      if (transcript) {
        transcriptRef.current.push({ role: "assistant", content: transcript });
        setLatestCaption(transcript);
        appendMessage({
          role: "assistant",
          content: transcript,
          spokenLive: true,
        });
        const userText = pendingUserTextRef.current;
        pendingUserTextRef.current = "";
        if (userText) {
          const save = saveRealtimeConversationTurnAction(
            userText,
            transcript,
            activeContext,
            mode,
          );
          pendingSavesRef.current.push(save);
          void save.catch(() => undefined);
        } else if (
          (openingTurnRef.current || closingTurnRef.current) &&
          activeContext.rolePlay
        ) {
          const save = saveRealtimeConversationMessageAction(
            "ASSISTANT",
            transcript,
            activeContext,
          );
          pendingSavesRef.current.push(save);
          void save.catch(() => undefined);
        }
      }
    }
    if (
      evidenceReviewPendingRef.current &&
      event.type === "response.output_text.delta" &&
      typeof event.delta === "string"
    ) {
      evidenceReviewTextRef.current += event.delta;
    }
    if (
      evidenceReviewPendingRef.current &&
      event.type === "response.output_text.done" &&
      typeof event.text === "string"
    ) {
      evidenceReviewTextRef.current = event.text;
    }
    if (event.type === "response.done") {
      activeResponseRef.current = false;
      const wasInterruptedByPushToTalk =
        pushToTalkInterruptedResponseRef.current;
      pushToTalkInterruptedResponseRef.current = false;
      if (evidenceReviewPendingRef.current) {
        evidenceReviewPendingRef.current = false;
        if (evidenceReviewTimerRef.current != null)
          window.clearTimeout(evidenceReviewTimerRef.current);
        evidenceReviewTimerRef.current = null;
        speakingEvidenceRef.current = parseSpeakingEvidenceReview(
          evidenceReviewTextRef.current,
          speakingEvidenceRef.current,
        );
        void completeConversationAfterEvidence();
        return;
      }
      if (ephemeralTurnGuardItemIdRef.current) {
        const guardItemId = ephemeralTurnGuardItemIdRef.current;
        ephemeralTurnGuardItemIdRef.current = null;
        if (dataChannelRef.current?.readyState === "open")
          dataChannelRef.current.send(
            JSON.stringify({
              type: "conversation.item.delete",
              item_id: guardItemId,
            }),
          );
      }
      if (closingTurnRef.current) {
        // Generation is complete, but WebRTC playback may still be queued.
        // Prefer output_audio_buffer.stopped when available; otherwise the
        // remote-stream analyser waits for actual audible silence.
        closingResponseDoneAtRef.current = performance.now();
        finishAfterClosingPlayback();
        return;
      }
      if (
        pendingTurnInstructionsRef.current &&
        (!activeContext.rolePlay || allowsBargeIn || wasInterruptedByPushToTalk)
      ) {
        const pendingInstructions = pendingTurnInstructionsRef.current;
        pendingTurnInstructionsRef.current = "";
        turnResponseDoneAtRef.current = null;
        turnAudioObservedRef.current = false;
        turnLastAudibleAtRef.current = null;
        turnPlaybackStoppedRef.current = false;
        confirmedBargeInRef.current = false;
        sendSessionPreservingRealtimeReply(
          pendingInstructions,
          activeContext.rolePlay
            ? realtimeRolePlayOutputTokenLimit(activeContext.rolePlay, "turn")
            : undefined,
        );
        return;
      }
      if (wasInterruptedByPushToTalk) {
        // The learner may still be holding the button, or the committed audio
        // may be awaiting transcription. Do not run the cancelled response's
        // ordinary playback cleanup: it would disable the live microphone and
        // discard the explicit interruption turn.
        return;
      }
      if (mode === "TUTOR" && !activeContext.rolePlay) {
        const status = event.response?.status;
        const reason = event.response?.status_details?.reason;
        if (status === "incomplete" || status === "failed") {
          // Log only transport state, never learner audio or transcript.
          console.warn("Han Tutor response ended early", { status, reason });
          if (
            status === "incomplete" &&
            reason === "max_output_tokens" &&
            tutorContinuationCountRef.current === 0 &&
            lastTutorTurnInstructionsRef.current &&
            !pushToTalkActiveRef.current &&
            !closeRequestedRef.current
          ) {
            tutorContinuationCountRef.current = 1;
            sendSessionPreservingRealtimeReply(
              `${lastTutorTurnInstructionsRef.current}\nThe preceding assistant response was cut off by its output limit. Continue only its unfinished explanation from the exact stopping point, preserving the established explanation language. Finish the thought in one short paragraph. Do not restart, repeat the example, introduce a new drill, or apologize. This completion instruction overrides pronunciation word-count restrictions for this response.`,
              1200,
            );
            return;
          }
          setError(
            explanationLanguageRef.current === "Spanish"
              ? "La respuesta de Han se interrumpió. Puedes pedirle que continúe."
              : "Han's response was interrupted. You can ask Han to continue.",
          );
        }
      }
      if (activeContext.rolePlay) {
        // `response.done` means generation/transport has completed. WebRTC
        // may still have queued audio to play, so keep the microphone muted
        // until the output buffer stops or the remote stream becomes silent.
        turnResponseDoneAtRef.current = performance.now();
        finishAfterRolePlayTurnPlayback();
        return;
      }
      if (closeRequestedRef.current) {
        requestNaturalClose();
        return;
      }
      if (outputPlaybackActiveRef.current) return;
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      pushToTalkActiveRef.current = false;
      setPushToTalkActive(false);
      setLatestCaption("Hold the red button to talk.");
      setState("listening");
    }
    if (event.type === "error" && evidenceReviewPendingRef.current) {
      evidenceReviewPendingRef.current = false;
      if (evidenceReviewTimerRef.current != null)
        window.clearTimeout(evidenceReviewTimerRef.current);
      evidenceReviewTimerRef.current = null;
      void completeConversationAfterEvidence();
      return;
    }
    if (event.type === "error") {
      activeResponseRef.current = false;
      outputPlaybackActiveRef.current = false;
      pushToTalkInterruptedResponseRef.current = false;
      pushToTalkInterruptedPlaybackRef.current = false;
      setError(userFacingRealtimeVoiceError(event.error?.message));
    }
  }

  async function startConversation() {
    setError(null);
    sessionLevelRef.current = context.rolePlay?.level ?? null;
    transcriptRef.current = [];
    learnerTurnConfidencesRef.current = [];
    speakingEvidenceRef.current = [];
    pendingSavesRef.current = [];
    finishStartedRef.current = false;
    evidenceReviewPendingRef.current = false;
    evidenceReviewTextRef.current = "";
    if (evidenceReviewTimerRef.current != null)
      window.clearTimeout(evidenceReviewTimerRef.current);
    evidenceReviewTimerRef.current = null;
    openingTurnRef.current = false;
    replyNeedsAssessmentRef.current = false;
    remainingPracticeTargetsRef.current = null;
    turnResponseDoneAtRef.current = null;
    turnAudioObservedRef.current = false;
    turnLastAudibleAtRef.current = null;
    turnPlaybackStoppedRef.current = false;
    pendingTurnInstructionsRef.current = "";
    ephemeralTurnGuardItemIdRef.current = null;
    closingTurnRef.current = false;
    closeRequestedRef.current = false;
    closeAfterReplyRef.current = false;
    activeResponseRef.current = false;
    outputPlaybackActiveRef.current = false;
    pushToTalkInterruptedResponseRef.current = false;
    pushToTalkInterruptedPlaybackRef.current = false;
    pushToTalkActiveRef.current = false;
    setPushToTalkActive(false);
    activeVoiceTurnRef.current = null;
    activeVoiceTurnItemIdRef.current = null;
    if (bargeInConfirmationTimerRef.current != null)
      window.clearTimeout(bargeInConfirmationTimerRef.current);
    bargeInConfirmationTimerRef.current = null;
    clearUnclosedTurnTimer();
    if (audioInputResetTimerRef.current != null)
      window.clearTimeout(audioInputResetTimerRef.current);
    audioInputResetTimerRef.current = null;
    if (forcedTranscriptFallbackTimerRef.current != null)
      window.clearTimeout(forcedTranscriptFallbackTimerRef.current);
    forcedTranscriptFallbackTimerRef.current = null;
    ignoreNextSpeechStoppedRef.current = false;
    confirmedBargeInRef.current = false;
    setLatestCaption("Connecting to the scene…");
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      setError("Live voice conversation isn't supported in this browser.");
      onUnavailable?.();
      return;
    }
    setState("connecting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      // Do not let an early utterance trigger a response before the explicit
      // session.update carrying Han's full identity/tutor prompt is confirmed.
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      startVoiceSignalAnalysis(stream);
      const peer = new RTCPeerConnection();
      peerRef.current = peer;
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;
      peer.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          remoteStreamRef.current = remoteStream;
          audio.srcObject = remoteStream;
          startRemoteAudioAnalysis(remoteStream);
        }
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed") {
          setError(
            "The live voice connection ended. Use the text fallback or try again.",
          );
          stopMedia();
          onUnavailable?.();
        }
      };
      const dataChannel = peer.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;
      dataChannel.onmessage = handleRealtimeEvent;
      let realtimeSessionInstructions = "";
      let realtimeSessionSpeechSpeed = 1;
      const activateRealtimeSession = () => {
        const activeRolePlay = contextRef.current.rolePlay;
        onActiveChange(true);
        // A periodic wall-clock check, not a single long setTimeout
        // (2026-09-05 cost audit fix) - a single multi-minute setTimeout
        // can fire late if the tab is backgrounded (browsers throttle
        // background-tab timers), letting a costly Realtime session run
        // past its intended budget. Re-checking Date.now() every 15s is
        // far more resistant to that drift. Note this still can't help
        // against a genuinely frozen/suspended tab - OpenAI's own
        // server-side 60-minute hard session cap (not configurable via
        // the API) is the real backstop for that case, independent of
        // anything this client does.
        const sessionStartedAt = Date.now();
        sessionTimerRef.current = window.setInterval(() => {
          if (Date.now() - sessionStartedAt < maxSessionMs) return;
          if (sessionTimerRef.current != null) {
            window.clearInterval(sessionTimerRef.current);
            sessionTimerRef.current = null;
          }
          void finishConversation();
        }, 15_000);
        if (activeRolePlay && naturalCloseAfterMs) {
          naturalCloseTimerRef.current = window.setTimeout(() => {
            closeRequestedRef.current = true;
            stream.getAudioTracks().forEach((track) => {
              track.enabled = false;
            });
            if (!activeResponseRef.current) requestNaturalClose();
          }, naturalCloseAfterMs);
        }
        if (activeRolePlay) {
          openingTurnRef.current = true;
          stream.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
          setState("thinking");
          const openingGuard = buildRealtimeOpeningTurnGuard(activeRolePlay);
          if (openingGuard) {
            const guardItemId = `item_guard_${crypto.randomUUID().replaceAll("-", "").slice(0, 21)}`;
            ephemeralTurnGuardItemIdRef.current = guardItemId;
            dataChannel.send(
              JSON.stringify({
                type: "conversation.item.create",
                item: {
                  id: guardItemId,
                  type: "message",
                  role: "system",
                  content: [
                    {
                      type: "input_text",
                      text: `One-turn opening override: ${openingGuard}`,
                    },
                  ],
                },
              }),
            );
          }
          setLatestCaption("Your conversation partner is starting the scene…");
          dataChannel.send(
            JSON.stringify({
              type: "response.create",
              response: {
                instructions:
                  openingGuard ??
                  buildRealtimeOpeningInstructions(activeRolePlay),
                max_output_tokens: realtimeRolePlayOutputTokenLimit(
                  activeRolePlay,
                  "opening",
                ),
              },
            }),
          );
        } else {
          stream.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
          setState("listening");
          setLatestCaption("Hold the red button to talk.");
        }
      };
      dataChannel.onopen = () => {
        if (!realtimeSessionInstructions) {
          setError("Han's live voice configuration was not received.");
          stopMedia();
          onUnavailable?.();
          return;
        }
        pendingSessionActivationRef.current = activateRealtimeSession;
        pendingSessionInstructionsRef.current = realtimeSessionInstructions;
        dataChannel.send(
          JSON.stringify(
            buildRealtimeSessionUpdateEvent(
              realtimeSessionInstructions,
              realtimeSessionSpeechSpeed,
            ),
          ),
        );
        sessionConfigurationTimerRef.current = window.setTimeout(() => {
          if (!pendingSessionActivationRef.current) return;
          pendingSessionActivationRef.current = null;
          pendingSessionInstructionsRef.current = null;
          setError("Han's live voice configuration could not be confirmed.");
          stopMedia();
          onUnavailable?.();
        }, 8_000);
      };
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const response = await fetch(
        `/api/han/realtime?voice=${encodeURIComponent(voice)}&mode=${encodeURIComponent(mode)}`,
        {
          method: "POST",
          body: offer.sdp,
          headers: {
            "content-type": "application/sdp",
            "x-han-context": encodeURIComponent(JSON.stringify(context)),
          },
        },
      );
      const responseBody = await response.text();
      if (!response.ok)
        throw new Error(
          realtimeSessionStartErrorMessage(responseBody, response.status),
        );
      const payload = JSON.parse(responseBody) as {
        sdp?: unknown;
        instructions?: unknown;
        speechSpeed?: unknown;
        rolePlayLevel?: unknown;
      };
      if (
        typeof payload.sdp !== "string" ||
        typeof payload.instructions !== "string" ||
        !payload.instructions ||
        typeof payload.speechSpeed !== "number" ||
        !Number.isFinite(payload.speechSpeed)
      )
        throw new Error("Han's live voice configuration was incomplete.");
      realtimeSessionInstructions = payload.instructions;
      realtimeSessionSpeechSpeed = payload.speechSpeed;
      if (
        context.rolePlay?.isFreeTopic &&
        !context.rolePlay.level &&
        typeof payload.rolePlayLevel === "string" &&
        payload.rolePlayLevel
      ) {
        contextRef.current = {
          ...context,
          rolePlay: { ...context.rolePlay, level: payload.rolePlayLevel },
        };
        sessionLevelRef.current = payload.rolePlayLevel;
      }
      await peer.setRemoteDescription({
        type: "answer",
        sdp: payload.sdp,
      });
    } catch (caught) {
      stopMedia();
      setError(
        caught instanceof Error && caught.message
          ? caught.message
          : "Allow microphone access to start a live conversation.",
      );
      onUnavailable?.();
    }
  }

  const status =
    state === "connecting"
      ? "Connecting…"
      : state === "listening"
        ? pushToTalkActive
          ? "Listening… release to send"
          : "Hold to talk"
        : state === "thinking"
          ? "Analyzing…"
          : state === "speaking"
            ? "Speaking…"
            : "Ready to practice";

  function renderPushToTalkButton(className: string, iconClassName = "size-6") {
    const available = state === "listening" || state === "speaking";
    return (
      <button
        type="button"
        aria-label={
          pushToTalkActive
            ? "Release to send your voice"
            : state === "speaking"
              ? "Hold to interrupt Han and speak"
              : "Hold to talk, then release to send"
        }
        aria-pressed={pushToTalkActive}
        disabled={!available}
        onPointerDown={handlePushToTalkPointerDown}
        onPointerUp={handlePushToTalkPointerEnd}
        onPointerCancel={handlePushToTalkPointerEnd}
        onLostPointerCapture={handlePushToTalkPointerEnd}
        onKeyDown={handlePushToTalkKeyDown}
        onKeyUp={handlePushToTalkKeyUp}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => event.preventDefault()}
        className={`${className} touch-none select-none disabled:cursor-not-allowed disabled:opacity-45`}
      >
        {pushToTalkActive ? (
          <Square className={iconClassName} aria-hidden="true" />
        ) : state === "thinking" || state === "connecting" ? (
          <Loader2
            className={`${iconClassName} animate-spin`}
            aria-hidden="true"
          />
        ) : state === "speaking" ? (
          <Volume2 className={iconClassName} aria-hidden="true" />
        ) : (
          <Mic className={iconClassName} aria-hidden="true" />
        )}
        <span>{pushToTalkActive ? "Release to send" : "Hold to talk"}</span>
      </button>
    );
  }

  if (variant === "orb") {
    const active = state !== "idle";
    const orbTone =
      state === "speaking"
        ? "from-primary-300 via-primary-500 to-accent-500"
        : state === "listening"
          ? "from-secondary-300 via-secondary-500 to-primary-700"
          : state === "connecting" || state === "thinking"
            ? "from-accent-300 via-accent-500 to-primary-700"
            : "from-primary-400 via-primary-600 to-primary-900";

    return (
      <div className="relative grid min-h-[32rem] place-items-center overflow-hidden rounded-panel border border-border/60 bg-page px-5 py-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-80 [background:radial-gradient(circle_at_50%_45%,color-mix(in_srgb,var(--color-primary-500)_9%,transparent),transparent_48%)]"
          aria-hidden="true"
        />

        <button
          ref={orbRef}
          type="button"
          onClick={() => {
            if (state === "idle") void startConversation();
          }}
          disabled={disabled && state === "idle"}
          aria-label={
            state === "idle"
              ? `Start voice conversation with ${roleLabel}`
              : `Voice conversation with ${roleLabel} is active`
          }
          tabIndex={active ? -1 : 0}
          className="group relative grid size-64 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-primary-400 disabled:cursor-not-allowed disabled:opacity-50 sm:size-72"
        >
          <span
            className="absolute inset-[1%] scale-[var(--learner-scale,1)] rounded-full border-2 border-secondary-300/70 opacity-[var(--learner-glow,0.12)] shadow-[0_0_var(--learner-blur,22px)_var(--learner-spread,2px)_color-mix(in_srgb,var(--color-secondary-500)_65%,transparent)] transition-[transform,opacity,box-shadow] duration-75 ease-out"
            aria-hidden="true"
          />
          <span
            className="absolute inset-[7%] scale-[var(--han-scale,1)] rounded-full border-2 border-primary-300/75 opacity-[var(--han-glow,0.2)] shadow-[0_0_var(--han-blur,26px)_var(--han-spread,3px)_color-mix(in_srgb,var(--color-primary-500)_68%,transparent)] transition-[transform,opacity,box-shadow] duration-75 ease-out"
            aria-hidden="true"
          />
          <span
            className="absolute inset-[10%] animate-[han-orb-breathe_5s_ease-in-out_infinite] rounded-full border border-neutral-0/10 bg-primary-500/5 blur-[1px]"
            aria-hidden="true"
          />
          <span
            data-speaking={state === "speaking"}
            className={`relative grid size-44 place-items-center overflow-hidden rounded-full bg-linear-to-br ${orbTone} shadow-[inset_-18px_-22px_40px_rgba(0,0,0,0.28),inset_14px_14px_30px_rgba(255,255,255,0.16),0_24px_70px_rgba(0,0,0,0.32)] transition-[transform,filter,background-color] duration-100 ease-out data-[speaking=true]:scale-[var(--han-core-scale,1)] data-[speaking=true]:brightness-[var(--han-brightness,1)] sm:size-52`}
          >
            <span
              className="absolute -top-[24%] left-[5%] size-[82%] rounded-full bg-neutral-0/20 blur-2xl"
              aria-hidden="true"
            />
            <span
              className="absolute right-[4%] -bottom-[26%] size-[74%] rounded-full bg-accent-300/25 blur-2xl"
              aria-hidden="true"
            />
            <span className="relative grid size-16 place-items-center rounded-full border border-neutral-0/20 bg-neutral-950/10 text-neutral-0/90 shadow-inner backdrop-blur-sm transition-opacity duration-base group-hover:bg-neutral-950/20">
              {state === "connecting" ? (
                <Loader2 className="size-7 animate-spin" aria-hidden="true" />
              ) : !active ? (
                <Mic className="size-7" aria-hidden="true" />
              ) : null}
            </span>
          </span>
        </button>

        {active && (
          <div className="absolute inset-x-4 bottom-5 z-10 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              {renderPushToTalkButton(
                "flex h-14 items-center gap-2 rounded-full bg-error-500 px-5 font-interface text-body font-semibold text-neutral-0 shadow-lg transition active:scale-[0.98] enabled:hover:bg-error-600",
                "size-5",
              )}
              <button
                type="button"
                onClick={() => void finishConversation()}
                className="h-11 rounded-full border border-border bg-surface px-4 font-interface text-caption font-semibold text-text-primary shadow-sm transition hover:bg-surface-raised"
              >
                End
              </button>
            </div>
            <span
              className="font-interface text-caption font-medium text-text-secondary"
              role="status"
            >
              {status}
            </span>
          </div>
        )}

        <span className="sr-only" role="status" aria-live="polite">
          {status}
          {error ? ` ${error}` : ""}
        </span>
      </div>
    );
  }

  if (variant === "immersive") {
    return (
      <div className="relative flex min-h-[32rem] flex-col items-center justify-between overflow-hidden rounded-panel bg-linear-to-br from-primary-900 via-primary-700 to-accent-700 px-5 py-8 text-center shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.14),transparent_42%)]" />
        <div className="relative flex flex-col items-center gap-2">
          <Caption className="uppercase tracking-[0.18em] text-neutral-0/65">
            You&apos;re talking to
          </Caption>
          <h3 className="font-display text-2xl font-semibold text-neutral-0">
            {roleLabel}
          </h3>
        </div>
        <div className="relative flex max-w-xl flex-col items-center gap-5">
          <div className="grid size-32 place-items-center rounded-full border-4 border-neutral-0/35 bg-neutral-0/15 shadow-[0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur">
            <UserRound className="size-16 text-neutral-0" aria-hidden="true" />
          </div>
          <div
            className="flex items-center gap-2 text-neutral-0/85"
            role="status"
          >
            {(state === "connecting" || state === "thinking") && (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            )}
            {state === "speaking" && (
              <Volume2 className="size-4" aria-hidden="true" />
            )}
            <span className="font-interface text-body font-medium">
              {status}
            </span>
          </div>
          <p className="min-h-14 max-w-lg font-interface text-lg leading-relaxed text-neutral-0">
            {latestCaption}
          </p>
          {error && (
            <InformationBanner variant="error" className="text-left">
              {error}
            </InformationBanner>
          )}
        </div>
        <div className="relative flex items-center gap-5">
          {state === "idle" ? (
            <Button
              type="button"
              onClick={() => void startConversation()}
              disabled={disabled}
              className="rounded-full bg-neutral-0 px-6 text-primary-900 hover:bg-neutral-0/90"
            >
              <Mic className="size-5" aria-hidden="true" /> Start conversation
            </Button>
          ) : (
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              {renderPushToTalkButton(
                "flex min-h-16 min-w-48 items-center justify-center gap-3 rounded-full bg-error-500 px-7 font-interface text-body font-semibold text-neutral-0 shadow-lg transition active:scale-[0.98] enabled:hover:bg-error-600",
                "size-6",
              )}
              <button
                type="button"
                onClick={() => void finishConversation()}
                aria-label="End conversation"
                className="h-12 rounded-full border border-neutral-0/35 bg-neutral-0/10 px-5 font-interface text-caption font-semibold text-neutral-0 backdrop-blur transition hover:bg-neutral-0/20"
              >
                End conversation
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {state === "idle" ? (
        <Button
          type="button"
          variant="secondary"
          className="w-full gap-2"
          disabled={disabled}
          onClick={() => void startConversation()}
        >
          <Mic className="size-4" />
          Start live conversation
        </Button>
      ) : (
        <div className="flex items-stretch gap-2">
          {renderPushToTalkButton(
            "flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control bg-error-500 px-4 font-interface text-body font-semibold text-neutral-0 shadow-sm transition active:scale-[0.99] enabled:hover:bg-error-600",
            "size-5",
          )}
          <button
            type="button"
            onClick={() => void finishConversation()}
            className="rounded-control border border-border bg-surface px-3 font-interface text-caption font-semibold text-text-secondary transition hover:bg-surface-raised hover:text-text-primary"
          >
            End
          </button>
        </div>
      )}
      {state !== "idle" && (
        <span
          className="font-interface text-caption text-text-secondary"
          role="status"
        >
          {status}
        </span>
      )}
      {error && <InformationBanner variant="error">{error}</InformationBanner>}
    </div>
  );
}
