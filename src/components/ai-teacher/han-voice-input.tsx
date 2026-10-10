"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { transcribeHanMessageAction } from "@/lib/actions/ai-teacher";
import type { AiTeacherContext } from "@/lib/ai-context";
import {
  normalizeHanTranscript,
  transcriptHintsFromContext,
} from "@/lib/speech/transcript-quality";
import {
  analyzeHanPronunciationRhythm,
  combineHanPronunciationEvidence,
  type HanPronunciationAttemptEvidence,
  type HanPronunciationTarget,
} from "@/lib/speech/han-pronunciation";
import {
  extractPitchContourFromSamples,
  scoreHanTutorToneMatch,
  scoreHanTutorToneMatchPerSyllable,
} from "@/lib/tone-analysis";

type VoiceState = "idle" | "requesting" | "recording" | "transcribing";

export function HanVoiceInput({
  disabled,
  context,
  pronunciationTarget,
  onTranscript,
}: {
  disabled: boolean;
  context: AiTeacherContext;
  pronunciationTarget: HanPronunciationTarget | null;
  onTranscript: (
    transcript: string,
    pronunciationAttempt: HanPronunciationAttemptEvidence | null,
  ) => void;
}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdActiveRef = useRef(false);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      holdActiveRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Voice recording isn't supported in this browser.");
      return;
    }

    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!holdActiveRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        setState("idle");
        return;
      }

      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => void transcribeRecording(recorder.mimeType);
      recorder.start();
      setState("recording");
      stopTimerRef.current = setTimeout(stopRecording, 60_000);
    } catch {
      stopTracks();
      setState("idle");
      setError(
        "Microphone access was denied. Allow microphone access and try again.",
      );
    }
  }

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function stopRecording() {
    holdActiveRef.current = false;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
    stopTracks();
  }

  function beginHold() {
    if (disabled || state !== "idle" || holdActiveRef.current) return;
    holdActiveRef.current = true;
    void startRecording();
  }

  function endHold() {
    if (!holdActiveRef.current) return;
    holdActiveRef.current = false;
    stopRecording();
  }

  async function transcribeRecording(mimeType: string) {
    setState("transcribing");
    const blob = new Blob(chunksRef.current, {
      type: mimeType || "audio/webm",
    });
    const formData = new FormData();
    formData.append("audio", blob, "han-message.webm");
    try {
      const [result, pronunciationAttempt] = await Promise.all([
        transcribeHanMessageAction(formData),
        pronunciationTarget
          ? analyzePronunciationAttempt(blob, pronunciationTarget)
          : Promise.resolve(null),
      ]);
      if (result.ok) {
        onTranscript(
          normalizeHanTranscript(
            result.transcript,
            transcriptHintsFromContext(context),
          ),
          pronunciationAttempt,
        );
        setError(null);
      } else {
        setError(result.error);
      }
    } catch {
      setError("The recording couldn't be transcribed. Please try again.");
    }
    setState("idle");
  }

  const recording = state === "recording";
  const pressed = state === "requesting" || recording;
  const busy = state === "transcribing";

  return (
    <div className="flex flex-col items-end gap-1">
      <IconButton
        type="button"
        icon={
          busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : recording ? (
            <Square className="size-4" aria-hidden="true" />
          ) : (
            <Mic className="size-4" aria-hidden="true" />
          )
        }
        aria-label={
          pressed ? "Release to stop recording" : "Hold to speak to Han"
        }
        aria-pressed={pressed}
        title={pressed ? "Release to stop recording" : "Hold to speak to Han"}
        className={
          pressed
            ? "touch-none select-none bg-primary-500 text-neutral-0"
            : "touch-none select-none"
        }
        disabled={disabled || busy}
        onClick={(event) => event.preventDefault()}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture?.(event.pointerId);
          beginHold();
        }}
        onPointerUp={(event) => {
          event.preventDefault();
          endHold();
        }}
        onPointerCancel={endHold}
        onLostPointerCapture={endHold}
        onKeyDown={(event) => {
          if ((event.key === " " || event.key === "Enter") && !event.repeat) {
            event.preventDefault();
            beginHold();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            endHold();
          }
        }}
      />
      {state !== "idle" && (
        <span className="sr-only" role="status">
          {state === "requesting"
            ? "Requesting microphone access"
            : state === "recording"
              ? "Recording. Release when finished."
              : "Transcribing your message"}
        </span>
      )}
      {error && (
        <span
          className="max-w-52 text-right font-interface text-caption text-error-500"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  );
}

async function analyzePronunciationAttempt(
  blob: Blob,
  target: HanPronunciationTarget,
): Promise<HanPronunciationAttemptEvidence | null> {
  let audioContext: AudioContext | null = null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
    const decoded = await audioContext.decodeAudioData(
      await blob.arrayBuffer(),
    );
    const contour = extractPitchContourFromSamples(
      decoded.getChannelData(0),
      decoded.sampleRate,
    );
    const syllableCount = target.pinyin.split(/\s+/u).filter(Boolean).length;
    return combineHanPronunciationEvidence(
      target,
      scoreHanTutorToneMatch(contour, target.pinyin),
      scoreHanTutorToneMatchPerSyllable(contour, target.pinyin),
      analyzeHanPronunciationRhythm(contour, decoded.duration, syllableCount),
    );
  } catch {
    return null;
  } finally {
    if (audioContext) await audioContext.close().catch(() => undefined);
  }
}
