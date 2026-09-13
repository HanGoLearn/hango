"use client";

import { useRef, useState } from "react";
import { Loader2, Pause, Play, Square } from "lucide-react";
import {
  ChineseText,
  Pinyin,
  Translation,
  Caption,
} from "@/components/ui/typography";
import { AskAiButton } from "@/components/lesson/ask-ai-button";
import { useLessonDisplayPrefs } from "@/components/lesson/lesson-display-prefs";
import {
  getDialogueLineAudioAction,
  getDialogueAudioAction,
} from "@/lib/actions/dialogue-audio";
import { cn } from "@/lib/cn";
import type { LessonWithContent } from "@/lib/content/lesson-data";
import { useLessonMessages } from "@/components/lesson/lesson-messages";
import { formatMessage } from "@/i18n/format";

type LineAudioState = "idle" | "loading" | "playing" | "error";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * The branded "play conversation" bar - a real, seekable player (not a
 * hand-rolled play/pause sequence, and not the bare native `<audio
 * controls>` this replaced): a learner who wants to rewind to an earlier
 * line drags the range scrubber, instead of restarting from the beginning
 * (user feedback, 2026-08-08). The range input *is* the native scrubber,
 * just restyled - dragging/keyboard seeking still works for free.
 */
export function ConversationPlayer({
  dialogueId,
  messages,
}: {
  dialogueId: string;
  messages: {
    play: string;
    pause: string;
    seek: string;
    unavailable: string;
  };
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handlePlayClick() {
    if (!url) {
      setStatus("loading");
      const result = await getDialogueAudioAction(dialogueId);
      if (!result.ok) {
        setStatus("error");
        return;
      }
      setStatus("idle");
      setUrl(result.url);
      return;
    }
    if (isPlaying) audioRef.current?.pause();
    else void audioRef.current?.play();
  }

  function handleSeek(event: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(event.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 rounded-panel bg-elevated px-4 py-3">
      <button
        type="button"
        onClick={() => void handlePlayClick()}
        disabled={status === "loading"}
        aria-label={isPlaying ? messages.pause : messages.play}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-500 text-on-color-light transition-transform duration-fast ease-standard hover:scale-105 disabled:opacity-60"
      >
        {status === "loading" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : isPlaying ? (
          <Pause className="size-4" aria-hidden="true" />
        ) : (
          <Play className="size-4 translate-x-0.5" aria-hidden="true" />
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="font-interface text-supporting font-semibold text-text-primary">
          {messages.play}
        </span>
        {url ? (
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              aria-label={messages.seek}
              className={cn(
                "h-1.5 flex-1 cursor-pointer appearance-none rounded-full",
                "[&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-accent-300",
                "[&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-300",
              )}
              style={{
                background: `linear-gradient(to right, var(--color-primary-500) ${progressPercent}%, var(--color-border-strong) ${progressPercent}%)`,
              }}
            />
            <span className="font-interface text-caption text-text-secondary tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        ) : (
          <div className="h-1.5 rounded-full bg-border" />
        )}
        {status === "error" && (
          <span
            className="font-interface text-caption text-error-500"
            role="alert"
          >
            {messages.unavailable}
          </span>
        )}
      </div>

      {url && (
        <audio
          ref={audioRef}
          src={url}
          autoPlay
          className="hidden"
          onLoadedMetadata={(event) =>
            setDuration(event.currentTarget.duration)
          }
          onTimeUpdate={(event) =>
            setCurrentTime(event.currentTarget.currentTime)
          }
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(duration);
          }}
          onError={() => setStatus("error")}
        />
      )}
    </div>
  );
}

/**
 * The interactive dialogue list - chat bubbles alternating by speaker
 * (DESIGN_TASKS-style option combining "A" chat/voice-note direction with
 * numbered goals from "C", agreed with the user 2026-08-08), each with a
 * tap-to-play voice-note button, plus the branded ConversationPlayer above
 * for the full, seekable conversation. Shared between the standalone
 * Dialogue step and SituationStep's merged Situation+Dialogue screen.
 */
export function DialogueLines({
  dialogues,
}: {
  dialogues: LessonWithContent["dialogues"];
}) {
  const { showPinyin, showTranslation } = useLessonDisplayPrefs();
  const messages = useLessonMessages();
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [audioStates, setAudioStates] = useState<
    Record<string, LineAudioState>
  >({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  function setLineState(lineId: string, state: LineAudioState) {
    setAudioStates((previous) => ({ ...previous, [lineId]: state }));
  }

  async function playLine(lineId: string) {
    const existing = audioRefs.current[lineId];
    if (existing) {
      setLineState(lineId, "playing");
      void existing.play();
      return;
    }

    setLineState(lineId, "loading");
    const result = await getDialogueLineAudioAction(lineId);
    if (!result.ok) {
      setLineState(lineId, "error");
      return;
    }

    const audio = new Audio(result.url);
    audio.onplay = () => setLineState(lineId, "playing");
    audio.onended = () => setLineState(lineId, "idle");
    audio.onpause = () => setLineState(lineId, "idle");
    audio.onerror = () => setLineState(lineId, "error");
    audioRefs.current[lineId] = audio;
    void audio.play();
  }

  function toggleLine(lineId: string) {
    const state = audioStates[lineId] ?? "idle";
    if (state === "playing") {
      audioRefs.current[lineId]?.pause();
      return;
    }
    if (state === "loading") return;
    void playLine(lineId);
  }

  const selectedLine = dialogues
    .flatMap((dialogue) => dialogue.lines)
    .find((line) => line.id === selectedLineId);

  return (
    <div className="flex flex-col gap-6">
      {dialogues.map((dialogue) => (
        <div key={dialogue.id} className="flex flex-col gap-3">
          {dialogue.contextDescription && (
            <Caption>{dialogue.contextDescription}</Caption>
          )}

          {dialogue.lines.length > 0 && (
            <ConversationPlayer
              dialogueId={dialogue.id}
              messages={messages.audio.conversation}
            />
          )}

          <div className="flex flex-col gap-3">
            {dialogue.lines.map((line) => {
              const isSelected = selectedLineId === line.id;
              const isRight = line.speaker.order % 2 === 1;
              const initial = line.speaker.name.charAt(0);
              const audioState = audioStates[line.id] ?? "idle";

              return (
                <div
                  key={line.id}
                  className={cn(
                    "flex items-end gap-2",
                    isRight && "flex-row-reverse",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full font-chinese text-caption font-semibold text-on-color-light",
                      isRight ? "bg-primary-500" : "bg-secondary-500",
                    )}
                    aria-hidden="true"
                  >
                    {initial}
                  </span>

                  <div
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() =>
                      setSelectedLineId(isSelected ? null : line.id)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedLineId(isSelected ? null : line.id);
                      }
                    }}
                    className={cn(
                      "flex max-w-[80%] cursor-pointer items-start gap-2 rounded-panel px-3 py-2.5 transition-colors duration-fast ease-standard",
                      isRight
                        ? "rounded-br-sm bg-primary-900"
                        : "rounded-bl-sm bg-elevated",
                      isSelected && "ring-2 ring-primary-500",
                    )}
                  >
                    <button
                      type="button"
                      aria-label={
                        audioState === "playing"
                          ? formatMessage(messages.audio.stopLine, {
                              speaker: line.speaker.name,
                            })
                          : formatMessage(messages.audio.playLine, {
                              speaker: line.speaker.name,
                            })
                      }
                      disabled={audioState === "loading"}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleLine(line.id);
                      }}
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-300 text-page transition-opacity duration-fast ease-standard hover:opacity-90 disabled:opacity-60"
                    >
                      {audioState === "loading" ? (
                        <Loader2
                          className="size-3 animate-spin"
                          aria-hidden="true"
                        />
                      ) : audioState === "playing" ? (
                        <Square className="size-3" aria-hidden="true" />
                      ) : (
                        <Play
                          className="size-3 translate-x-0.5"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                    <div className="flex flex-col gap-0.5">
                      {/* isRight bubbles fill with bg-primary-900, a fixed
                          dark brand color that doesn't invert between
                          themes - Caption/ChineseText/Pinyin/Translation's
                          default text colors DO invert (they're neutral-
                          scale), so the on-color-light override is required
                          here. Measured 12.65:1 dark / 1.06:1 light (nearly
                          invisible) before this fix - left bubbles sit on
                          the inverting bg-elevated and need no override. */}
                      <Caption
                        className={isRight ? "text-on-color-light" : undefined}
                      >
                        {line.speaker.name}
                      </Caption>
                      <ChineseText
                        className={isRight ? "text-on-color-light" : undefined}
                      >
                        {line.chineseText}
                      </ChineseText>
                      {showPinyin && (
                        <Pinyin
                          className={
                            isRight ? "text-on-color-light/85" : undefined
                          }
                        >
                          {line.pinyin}
                        </Pinyin>
                      )}
                      {showTranslation && (
                        <Translation
                          className={
                            isRight ? "text-on-color-light/85" : undefined
                          }
                        >
                          {line.translation}
                        </Translation>
                      )}
                      {audioState === "error" && (
                        <span
                          className="font-interface text-caption text-error-500"
                          role="alert"
                        >
                          {messages.common.audioUnavailable}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {selectedLine && (
        <AskAiButton
          label={messages.ai.aboutLine}
          contextPatch={{
            selectedDialogueLine: {
              chineseText: selectedLine.chineseText,
              pinyin: selectedLine.pinyin,
              translation: selectedLine.translation,
            },
          }}
        />
      )}
    </div>
  );
}
