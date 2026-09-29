"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InformationBanner } from "@/components/ui/banner";
import { Body, Caption, CardTitle } from "@/components/ui/typography";
import { AudioRecorder } from "@/components/speaking/audio-recorder";
import { CharacterToneFeedback } from "@/components/speaking/character-tone-feedback";
import { ConversationPlayer } from "@/components/lesson/dialogue-lines";
import {
  createSpeakingSessionAction,
  submitTextFallbackAction,
  completeSpeakingSessionAction,
} from "@/lib/actions/speaking";
import { submitSpeakingRecording } from "@/lib/speaking-upload-client";
import { getDialogueLineAudioAction } from "@/lib/actions/dialogue-audio";
import type { SyllableScore } from "@/lib/tone-analysis";
import type { ShadowingLine } from "@/lib/content/speaking-prompts";
import { cn } from "@/lib/cn";
import type { SpeakingLabMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";
import { localizeSpeakingError } from "@/i18n/speaking";

interface CompletedLine {
  overallScore: number | null;
  syllableScores: SyllableScore[] | null;
}

/**
 * "Conversation" Shadowing sub-mode (project/TASKS.md Speaking Lab
 * redesign, 2026-08-08): the lesson's real dialogue, presented turn by turn
 * as a chat thread (same bubble language as DialogueLines) instead of one
 * flat block of text. Each line is its own SpeakingSession under the hood -
 * no schema change needed, just several small sessions orchestrated
 * client-side instead of one big one.
 */
export function ConversationShadowing({
  lines,
  lessonId,
  dialogueId,
  onExit,
  messages,
}: {
  lines: ShadowingLine[];
  lessonId?: string;
  dialogueId: string;
  onExit: () => void;
  messages: SpeakingLabMessages;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [attemptDone, setAttemptDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPinyin, setShowPinyin] = useState(true);
  const [syllableScores, setSyllableScores] = useState<SyllableScore[] | null>(
    null,
  );
  const [completed, setCompleted] = useState<Record<string, CompletedLine>>({});
  const [lineAudioState, setLineAudioState] = useState<
    Record<string, "idle" | "loading" | "playing">
  >({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const creatingRef = useRef(false);

  const currentLine = lines[currentIndex];
  const finished = currentIndex >= lines.length;

  useEffect(() => {
    if (finished || !currentLine || creatingRef.current) return;
    creatingRef.current = true;
    setSessionId(null);
    setAttemptDone(false);
    setSyllableScores(null);
    setError(null);
    void createSpeakingSessionAction("SHADOWING", currentLine.chineseText, {
      lessonId,
    }).then(({ sessionId: newSessionId }) => {
      setSessionId(newSessionId);
      creatingRef.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  async function playLineAudio(lineId: string) {
    const existing = audioRefs.current[lineId];
    if (existing) {
      setLineAudioState((s) => ({ ...s, [lineId]: "playing" }));
      void existing.play();
      return;
    }
    setLineAudioState((s) => ({ ...s, [lineId]: "loading" }));
    const result = await getDialogueLineAudioAction(lineId);
    if (!result.ok) {
      setLineAudioState((s) => ({ ...s, [lineId]: "idle" }));
      return;
    }
    const audio = new Audio(result.url);
    audio.onplay = () =>
      setLineAudioState((s) => ({ ...s, [lineId]: "playing" }));
    audio.onended = () =>
      setLineAudioState((s) => ({ ...s, [lineId]: "idle" }));
    audio.onpause = () =>
      setLineAudioState((s) => ({ ...s, [lineId]: "idle" }));
    audioRefs.current[lineId] = audio;
    void audio.play();
  }

  async function handleSubmitRecording(formData: FormData) {
    if (!sessionId || !currentLine) return false;
    const attemptResult = await submitSpeakingRecording(sessionId, formData);
    if (!attemptResult.ok) {
      setError(localizeSpeakingError(attemptResult.error, messages.errors));
      return false;
    }
    setError(null);
    setAttemptDone(true);
    setCompleted((previous) => ({
      ...previous,
      [currentLine.id]: {
        overallScore: attemptResult.result.feedback.toneScore ?? null,
        syllableScores,
      },
    }));
    return true;
  }

  async function handleSubmitText(text: string) {
    if (!sessionId || !currentLine) return false;
    const attemptResult = await submitTextFallbackAction(sessionId, text);
    if (!attemptResult.ok) {
      setError(localizeSpeakingError(attemptResult.error, messages.errors));
      return false;
    }
    setError(null);
    setAttemptDone(true);
    setCompleted((previous) => ({
      ...previous,
      [currentLine.id]: { overallScore: null, syllableScores: null },
    }));
    return true;
  }

  function handleNext() {
    if (sessionId) void completeSpeakingSessionAction(sessionId);
    setCurrentIndex((index) => index + 1);
  }

  function handleRetryLine() {
    setAttemptDone(false);
    setSyllableScores(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <CardTitle>{messages.shadowing.title}</CardTitle>
        <Button
          type="button"
          variant="tertiary"
          className="gap-1.5 px-0"
          onClick={() => setShowPinyin((value) => !value)}
        >
          {showPinyin ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
          {showPinyin ? messages.common.hidePinyin : messages.common.showPinyin}
        </Button>
      </div>

      <ConversationPlayer
        dialogueId={dialogueId}
        messages={messages.picker.player}
      />

      <div
        className="flex items-center gap-1.5"
        aria-label={messages.shadowing.progress}
      >
        {lines.map((line, index) => (
          <span
            key={line.id}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              index < currentIndex
                ? completed[line.id]?.overallScore !== null &&
                  (completed[line.id]?.overallScore ?? 0) >= 55
                  ? "bg-success-500"
                  : "bg-error-500"
                : index === currentIndex
                  ? "bg-primary-500"
                  : "bg-elevated",
            )}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {lines.slice(0, currentIndex).map((line) => {
          const isRight = line.speakerOrder % 2 === 1;
          const lineResult = completed[line.id];
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
                {line.speakerName.charAt(0)}
              </span>
              <div
                className={cn(
                  "flex max-w-[80%] flex-col gap-1 rounded-panel px-3 py-2.5 opacity-80",
                  isRight
                    ? "rounded-br-sm bg-primary-900"
                    : "rounded-bl-sm bg-elevated",
                )}
              >
                {/* isRight sits on the fixed bg-primary-900 fill, same
                    non-inverting-background issue fixed in
                    dialogue-lines.tsx's right bubble - Caption/
                    CharacterToneFeedback both need the on-color override
                    here, not their default inverting text tokens. */}
                <Caption
                  className={isRight ? "text-on-color-light/85" : undefined}
                >
                  {line.speakerName}
                </Caption>
                <CharacterToneFeedback
                  text={line.chineseText}
                  pinyin={line.pinyin}
                  syllableScores={lineResult?.syllableScores ?? null}
                  showPinyin={showPinyin}
                  onColorFill={isRight}
                />
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <InformationBanner variant="error">
          <Body>{error}</Body>
        </InformationBanner>
      )}

      {!finished && currentLine && (
        <Card className="flex flex-col gap-3">
          <div
            className={cn(
              "flex items-end gap-2",
              currentLine.speakerOrder % 2 === 1 && "flex-row-reverse",
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full font-chinese text-caption font-semibold text-on-color-light",
                currentLine.speakerOrder % 2 === 1
                  ? "bg-primary-500"
                  : "bg-secondary-500",
              )}
              aria-hidden="true"
            >
              {currentLine.speakerName.charAt(0)}
            </span>
            <div className="flex flex-col gap-1">
              <Caption>{currentLine.speakerName}</Caption>
              <CharacterToneFeedback
                text={currentLine.chineseText}
                pinyin={currentLine.pinyin}
                syllableScores={syllableScores}
                showPinyin={showPinyin}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="tertiary"
            className="w-fit gap-1.5 px-0"
            disabled={lineAudioState[currentLine.id] === "loading"}
            onClick={() => void playLineAudio(currentLine.id)}
          >
            {lineAudioState[currentLine.id] === "loading" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : lineAudioState[currentLine.id] === "playing" ? (
              <Square className="size-4" aria-hidden="true" />
            ) : (
              <Play className="size-4" aria-hidden="true" />
            )}
            {messages.shadowing.listenLine}
          </Button>

          {sessionId && !attemptDone && (
            <AudioRecorder
              onSubmitRecording={handleSubmitRecording}
              onSubmitText={handleSubmitText}
              expectedPinyin={currentLine.pinyin}
              onToneAnalysis={(analysis) =>
                setSyllableScores(analysis.perSyllable)
              }
              messages={messages.recorder}
            />
          )}

          {attemptDone && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleRetryLine}
              >
                {messages.common.tryAgain}
              </Button>
              <Button type="button" onClick={handleNext}>
                {currentIndex === lines.length - 1
                  ? messages.common.finish
                  : messages.shadowing.nextLine}
              </Button>
            </div>
          )}
        </Card>
      )}

      {finished && (
        <div className="flex flex-col items-start gap-3 rounded-panel border border-success-500/40 bg-success-500/10 p-5">
          <Body className="font-semibold text-text-primary">
            {lines.length === 1
              ? messages.shadowing.completeOne
              : formatMessage(messages.shadowing.completeMany, {
                  count: lines.length,
                })}
          </Body>
          <Button type="button" onClick={onExit}>
            {messages.common.backToLab}
          </Button>
        </div>
      )}
    </div>
  );
}
