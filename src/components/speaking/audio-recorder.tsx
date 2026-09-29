"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, RotateCcw, Send, Keyboard, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Caption } from "@/components/ui/typography";
import { InformationBanner } from "@/components/ui/banner";
import { cn } from "@/lib/cn";
import {
  extractPitchContourFromSamples,
  scoreToneMatch,
  scoreToneMatchPerSyllable,
  type SyllableScore,
} from "@/lib/tone-analysis";
import type { SpeakingLabMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

export interface ToneAnalysisResult {
  overall: number | null;
  perSyllable: SyllableScore[] | null;
}

/**
 * Decodes the recorded Blob to PCM and scores its tone contour against the
 * expected pinyin - entirely in the browser, no server round trip and no AI
 * tokens (project/TASKS.md Speaking Lab redesign, 2026-08-08). Returns null
 * scores if decoding fails or there isn't enough voiced signal to judge,
 * rather than a fabricated score.
 */
async function analyzeToneMatch(
  blob: Blob,
  expectedPinyin: string,
): Promise<ToneAnalysisResult> {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioContext = new AudioContextClass();
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(arrayBuffer);
    const samples = decoded.getChannelData(0);
    const contour = extractPitchContourFromSamples(samples, decoded.sampleRate);
    await audioContext.close();
    return {
      overall: scoreToneMatch(contour, expectedPinyin),
      perSyllable: scoreToneMatchPerSyllable(contour, expectedPinyin),
    };
  } catch {
    return { overall: null, perSyllable: null };
  }
}

type RecorderState =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "recorded"
  | "permission-denied"
  | "submitting";

const MAX_RECORDING_SECONDS = 5 * 60;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Recording controls (10.2): request mic permission, record/stop with a
 * timer, play back the recording, retry, or submit. Falls back to a text
 * input automatically on permission denial (10.2 "Provide text fallback"),
 * and can be switched to manually at any time via the keyboard icon.
 */
export function AudioRecorder({
  onSubmitRecording,
  onSubmitText,
  expectedPinyin,
  onToneAnalysis,
  messages,
}: {
  onSubmitRecording: (formData: FormData) => Promise<boolean>;
  onSubmitText: (text: string) => Promise<boolean>;
  /** When present, enables local (no-AI-cost) tone-contour scoring against this pinyin. */
  expectedPinyin?: string;
  /** Fires with the full per-syllable breakdown as soon as local analysis finishes - lets a parent shade the prompt text (CharacterToneFeedback) before the recording is even submitted. */
  onToneAnalysis?: (result: ToneAnalysisResult) => void;
  messages: SpeakingLabMessages["recorder"];
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [useTextFallback, setUseTextFallback] = useState(false);
  const [textDraft, setTextDraft] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [toneScore, setToneScore] = useState<number | null | "analyzing">(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      timerRef.current && clearInterval(timerRef.current);
      stopTimeoutRef.current && clearTimeout(stopTimeoutRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      audioUrl && URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    setState("requesting-permission");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start();

      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((value) => value + 1);
      }, 1000);
      stopTimeoutRef.current = setTimeout(
        () => stopRecording(),
        MAX_RECORDING_SECONDS * 1000,
      );
      setState("recording");
    } catch {
      setState("permission-denied");
      setUseTextFallback(true);
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || chunksRef.current[0]?.type || "audio/webm",
      });
      recordedBlobRef.current = blob;
      setAudioUrl(URL.createObjectURL(blob));
      setState("recorded");
      if (expectedPinyin) {
        setToneScore("analyzing");
        void analyzeToneMatch(blob, expectedPinyin).then((result) => {
          setToneScore(result.overall);
          onToneAnalysis?.(result);
        });
      }
    };
    recorder.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
  }

  function handleRetry() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setElapsedSeconds(0);
    setToneScore(null);
    recordedBlobRef.current = null;
    setState("idle");
    onToneAnalysis?.({ overall: null, perSyllable: null });
  }

  async function handleSubmit() {
    if (!recordedBlobRef.current) return;
    setState("submitting");
    const formData = new FormData();
    const mimeType = recordedBlobRef.current.type;
    const extension = mimeType.includes("mp4")
      ? "m4a"
      : mimeType.includes("ogg")
        ? "ogg"
        : "webm";
    formData.append("audio", recordedBlobRef.current, `recording.${extension}`);
    formData.append("durationSeconds", String(elapsedSeconds));
    if (typeof toneScore === "number") {
      formData.append("toneScore", String(toneScore));
    }
    try {
      const submitted = await onSubmitRecording(formData);
      if (!submitted) setState("recorded");
    } catch {
      setState("recorded");
    }
  }

  async function handleSubmitText() {
    if (!textDraft.trim()) return;
    setState("submitting");
    try {
      const submitted = await onSubmitText(textDraft.trim());
      if (!submitted) setState("idle");
    } catch {
      setState("idle");
    }
  }

  if (useTextFallback) {
    return (
      <div className="flex flex-col gap-3">
        {state === "permission-denied" && (
          <InformationBanner
            variant="warning"
            title={messages.microphoneDenied}
          >
            {messages.typeInsteadDescription}
          </InformationBanner>
        )}
        <Textarea
          value={textDraft}
          onChange={(event) => setTextDraft(event.target.value)}
          placeholder={messages.textPlaceholder}
          aria-label={messages.yourAnswer}
          disabled={state === "submitting"}
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => void handleSubmitText()}
            disabled={!textDraft.trim() || state === "submitting"}
            loading={state === "submitting"}
            className="w-fit"
          >
            <Send className="size-4" aria-hidden="true" />
            {messages.submit}
          </Button>
          {state !== "permission-denied" && (
            <Button
              type="button"
              variant="tertiary"
              onClick={() => setUseTextFallback(false)}
            >
              <Mic className="size-4" aria-hidden="true" />
              {messages.useMicrophone}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-3">
        {(state === "idle" || state === "recording") && (
          <button
            type="button"
            aria-label={
              state === "recording"
                ? messages.stopRecording
                : messages.startRecording
            }
            onClick={() =>
              void (state === "recording" ? stopRecording() : startRecording())
            }
            className={cn(
              "flex size-19 items-center justify-center rounded-full bg-primary-500 text-on-color-light transition-transform duration-fast ease-standard hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500",
              state === "recording"
                ? "animate-pulse shadow-[0_0_0_6px_rgba(192,32,61,0.18),0_0_0_12px_rgba(192,32,61,0.09)]"
                : "shadow-lg shadow-primary-500/30",
            )}
          >
            {state === "recording" ? (
              <Square className="size-7" aria-hidden="true" />
            ) : (
              <Mic className="size-7" aria-hidden="true" />
            )}
          </button>
        )}
        {state === "requesting-permission" && (
          <Caption>{messages.requestingAccess}</Caption>
        )}
        {state === "recording" && (
          <Caption role="status">
            {formatMessage(messages.recording, {
              time: formatTime(elapsedSeconds),
            })}
          </Caption>
        )}
        {(state === "recorded" || state === "submitting") && audioUrl && (
          <div className="flex flex-col gap-2">
            <audio controls src={audioUrl} className="h-10">
              <track kind="captions" />
            </audio>
            {expectedPinyin && (
              <div className="flex items-center gap-1.5 text-text-secondary">
                <Waves className="size-4" aria-hidden="true" />
                {toneScore === "analyzing" && (
                  <Caption>{messages.analyzingTones}</Caption>
                )}
                {toneScore === null && (
                  <Caption>{messages.insufficientAudio}</Caption>
                )}
                {typeof toneScore === "number" && (
                  <Caption className="font-semibold text-text-primary">
                    {formatMessage(messages.toneMatch, { score: toneScore })}
                  </Caption>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={state === "submitting"}
                loading={state === "submitting"}
              >
                <Send className="size-4" aria-hidden="true" />
                {messages.submit}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleRetry}
                disabled={state === "submitting"}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                {messages.retry}
              </Button>
            </div>
          </div>
        )}
      </div>

      {state === "idle" && (
        <Button
          type="button"
          variant="tertiary"
          className="w-fit gap-1.5 px-0"
          onClick={() => setUseTextFallback(true)}
        >
          <Keyboard className="size-4" aria-hidden="true" />
          {messages.typeInstead}
        </Button>
      )}
    </div>
  );
}
