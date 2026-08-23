"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Square,
  UserRound,
  Volume2,
} from "lucide-react";
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
  advancePronunciationPractice,
  allowsRealtimeBargeIn,
  buildRealtimeAssessmentFallbackGuard,
  buildRealtimeAssessmentTurnGuard,
  buildRealtimeClosingInstructions,
  buildRealtimeOpeningInstructions,
  buildRealtimeOpeningTurnGuard,
  buildRealtimeSessionUpdateEvent,
  buildSessionPreservingRealtimeTurnEvents,
  buildRealtimeTurnInstructions,
  isNonSpeechNoiseTranscript,
  nextHanExplanationLanguage,
  realtimeRolePlayOutputTokenLimit,
  shouldHoldRealtimeLearnerAction,
  shouldBlockForRolePlayAssessment,
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
  response?: { output?: unknown[] };
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
  variant?: "compact" | "immersive";
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
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
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

  function interruptActiveRealtimeResponse() {
    const channel = dataChannelRef.current;
    if (channel?.readyState !== "open" || !activeResponseRef.current) return;
    confirmedBargeInRef.current = true;
    turnPlaybackStoppedRef.current = true;
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
        mutedRef.current
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
        setLatestCaption("I'm listening — begin whenever you're ready.");
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
      setLatestCaption("I'm listening — begin whenever you're ready.");
      setState("listening");
    }
    // Continuous music can keep server VAD open even after its buffered bytes
    // are cleared. A tiny real silence boundary lets VAD reset without making
    // the learner press Stop or restart the conversation.
    createBriefInputSilenceBoundary();
  }

  const stopMedia = useCallback(() => {
    if (sessionTimerRef.current != null)
      window.clearTimeout(sessionTimerRef.current);
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
    stopVoiceSignalAnalysis();
    stopRemoteAudioAnalysis();
    pendingUserTextRef.current = "";
    openingTurnRef.current = false;
    replyNeedsAssessmentRef.current = false;
    remainingPracticeTargetsRef.current = null;
    pendingTurnInstructionsRef.current = "";
    ephemeralTurnGuardItemIdRef.current = null;
    closingTurnRef.current = false;
    closeRequestedRef.current = false;
    closeAfterReplyRef.current = false;
    activeResponseRef.current = false;
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
    mutedRef.current = false;
    onActiveChange(false);
    setMuted(false);
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
      track.enabled = !muted;
    });
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
      activeResponseRef.current = true;
      if (activeContext.rolePlay && !allowsBargeIn)
        streamRef.current?.getAudioTracks().forEach((track) => {
          track.enabled = false;
        });
      setState("speaking");
    }
    if (event.type === "output_audio_buffer.stopped") {
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
    }
    if (
      event.type === "conversation.item.input_audio_transcription.completed"
    ) {
      if (
        event.item_id &&
        discardedVoiceTurnItemIdsRef.current.delete(event.item_id)
      ) {
        pendingUserTextRef.current = "";
        setLatestCaption("I'm listening — begin whenever you're ready.");
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
        setLatestCaption("I'm listening — begin whenever you're ready.");
        setState("listening");
        return;
      }
      setError(null);
      {
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
        const pronunciation = advancePronunciationPractice(
          transcript,
          transcriptRef.current,
          pronunciationPracticeRef.current,
        );
        pronunciationPracticeRef.current = pronunciation.state;
        const requiredLanguage = nextHanExplanationLanguage(
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
            sendSessionPreservingRealtimeReply(instructionsForThisTurn);
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
        allowsBargeIn &&
        activeContext.rolePlay &&
        pendingTurnInstructionsRef.current
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
          realtimeRolePlayOutputTokenLimit(activeContext.rolePlay, "turn"),
        );
        return;
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
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
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
    if (event.type === "error")
      setError(event.error?.message ?? "The live voice session had a problem.");
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
        sessionTimerRef.current = window.setTimeout(
          () => void finishConversation(),
          maxSessionMs,
        );
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
            track.enabled = allowsRealtimeBargeIn(activeRolePlay)
              ? !muted
              : false;
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
            track.enabled = !muted;
          });
          setState("listening");
          setLatestCaption("I'm listening — begin whenever you're ready.");
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
      if (!response.ok) throw new Error(await response.text());
      const payload = (await response.json()) as {
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

  function toggleMute() {
    const nextMuted = !muted;
    streamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    mutedRef.current = nextMuted;
    setMuted(nextMuted);
  }

  const status =
    state === "connecting"
      ? "Connecting…"
      : state === "listening"
        ? muted
          ? "Microphone muted"
          : "Listening…"
        : state === "thinking"
          ? "Thinking…"
          : state === "speaking"
            ? "Speaking…"
            : "Ready to practice";

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
            <>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                className="grid size-14 place-items-center rounded-full border border-neutral-0/35 bg-neutral-0/15 text-neutral-0 backdrop-blur transition hover:bg-neutral-0/25"
              >
                {muted ? (
                  <MicOff className="size-5" />
                ) : (
                  <Mic className="size-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => void finishConversation()}
                aria-label="End conversation"
                className="flex h-14 items-center gap-2 rounded-full bg-error-500 px-6 font-interface text-body font-semibold text-neutral-0 shadow-lg transition hover:bg-error-600"
              >
                <PhoneOff className="size-5" aria-hidden="true" />
                End conversation
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant={state === "idle" ? "secondary" : "primary"}
        className="w-full gap-2"
        disabled={disabled && state === "idle"}
        onClick={() =>
          void (state === "idle" ? startConversation() : finishConversation())
        }
      >
        {state === "idle" ? (
          <Mic className="size-4" />
        ) : state === "connecting" || state === "thinking" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : state === "speaking" ? (
          <Volume2 className="size-4" />
        ) : (
          <Square className="size-4" />
        )}
        {state === "idle" ? "Start live conversation" : "End conversation"}
      </Button>
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
