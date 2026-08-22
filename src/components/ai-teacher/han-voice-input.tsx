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

type VoiceState = "idle" | "requesting" | "recording" | "transcribing";

export function HanVoiceInput({
  disabled,
  context,
  onTranscript,
}: {
  disabled: boolean;
  context: AiTeacherContext;
  onTranscript: (transcript: string) => void;
}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
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
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
    stopTracks();
  }

  async function transcribeRecording(mimeType: string) {
    setState("transcribing");
    const blob = new Blob(chunksRef.current, {
      type: mimeType || "audio/webm",
    });
    const formData = new FormData();
    formData.append("audio", blob, "han-message.webm");
    try {
      const result = await transcribeHanMessageAction(formData);
      if (result.ok) {
        onTranscript(
          normalizeHanTranscript(
            result.transcript,
            transcriptHintsFromContext(context),
          ),
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
  const busy = state === "requesting" || state === "transcribing";

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
        aria-label={recording ? "Stop recording" : "Speak to Han"}
        aria-pressed={recording}
        className={recording ? "bg-primary-500 text-neutral-0" : undefined}
        disabled={disabled || busy}
        onClick={() => void (recording ? stopRecording() : startRecording())}
      />
      {state !== "idle" && (
        <span className="sr-only" role="status">
          {state === "requesting"
            ? "Requesting microphone access"
            : state === "recording"
              ? "Recording. Press stop when finished."
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
