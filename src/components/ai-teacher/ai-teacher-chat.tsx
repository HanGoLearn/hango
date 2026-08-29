"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Send, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import { Body, Caption, Supporting } from "@/components/ui/typography";
import { InformationBanner } from "@/components/ui/banner";
import { HanAvatar } from "@/components/ui/han-mascot";
import { cn } from "@/lib/cn";
import { useAiTeacher } from "@/components/ai-teacher/ai-teacher-provider";
import { HanVoiceInput } from "@/components/ai-teacher/han-voice-input";
import { HanVoiceConversation } from "@/components/ai-teacher/han-voice-conversation";
import { HanSpeechButton } from "@/components/ai-teacher/han-speech-button";
import type { AiTeacherContext, AiTeacherMode } from "@/lib/ai-context";

const MODES: { value: AiTeacherMode; label: string }[] = [
  { value: "TUTOR", label: "Tutor" },
  { value: "PRACTICE", label: "Practice" },
];

function suggestedPromptsFor(context: AiTeacherContext): string[] {
  const prompts: string[] = [];
  if (context.selectedVocabulary) {
    prompts.push(
      `Explain "${context.selectedVocabulary.chineseForm}" in more detail`,
    );
  }
  if (context.selectedGrammarPoint) {
    prompts.push(
      `Give me another example of ${context.selectedGrammarPoint.name}`,
    );
  }
  if (context.selectedDialogueLine) {
    prompts.push("Why is this line phrased this way?");
  }
  if (context.recentLearnerAnswer && !context.recentLearnerAnswer.wasCorrect) {
    prompts.push("Why was my answer wrong?");
  }
  if (prompts.length === 0) {
    prompts.push("What should I focus on in this lesson?");
  }
  return prompts.slice(0, 3);
}

/** The chat body shared by the desktop panel (expanded) and the mobile drawer (8.3). */
export function AiTeacherChat({
  voiceEnabled = true,
  rolePlayEnabled = true,
}: {
  voiceEnabled?: boolean;
  /** The floating Han tutor must never inherit Speaking's Mandarin-only persona. */
  rolePlayEnabled?: boolean;
}) {
  const {
    context,
    mode,
    setMode,
    messages,
    sending,
    resetting,
    error,
    responseMode,
    voice,
    explanationLanguage,
    open,
    sendMessage,
    appendRealtimeMessage,
    resetConversation,
  } = useAiTeacher();
  const [draft, setDraft] = useState("");
  const [voiceConversationActive, setVoiceConversationActive] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null,
  );
  const listRef = useRef<HTMLDivElement>(null);
  const activeContext = useMemo(
    () =>
      rolePlayEnabled
        ? context
        : {
            ...context,
            rolePlay: undefined,
          },
    [context, rolePlayEnabled],
  );

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending || resetting) return;
    setDraft("");
    const reply = await sendMessage(trimmed, activeContext);
    setLastFailedMessage(reply ? null : trimmed);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend(draft);
    }
  }

  const contextLabel =
    [activeContext.lessonTitle, activeContext.lessonStepType]
      .filter(Boolean)
      .join(" · ") ||
    "No active lesson context";

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Caption>{contextLabel}</Caption>
        <div className="flex gap-1" role="tablist" aria-label="Han mode">
          {MODES.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={mode === option.value}
              onClick={() => setMode(option.value)}
              className={cn(
                "rounded-full px-3 py-1 font-interface text-caption font-semibold",
                mode === option.value
                  ? "bg-primary-500 text-on-color-light"
                  : "bg-elevated text-text-secondary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={listRef}
        className="flex min-h-40 flex-1 flex-col gap-3 overflow-y-auto"
      >
        {messages.length === 0 && (
          <Body className="text-text-secondary">
            Ask Han anything about this lesson — vocabulary, grammar, or why an
            answer was right or wrong.
          </Body>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex max-w-[85%] items-end gap-2",
              message.role === "user" ? "self-end" : "self-start",
            )}
          >
            {message.role === "assistant" && (
              <HanAvatar pose="idle" size={26} className="mb-0.5" />
            )}
            <div className="min-w-0">
              {/* Han always writes a reply internally regardless of mode -
                  AUDIO_ONLY just hides this bubble for assistant messages,
                  it doesn't change what gets generated. The learner's own
                  messages always stay visible (this setting is specifically
                  "Han replies", not the whole conversation). */}
              {!(message.role === "assistant" && responseMode === "AUDIO_ONLY") && (
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-card px-3 py-2 font-interface text-body leading-relaxed",
                    message.role === "user"
                      ? "bg-primary-500 text-on-color-light"
                      : "bg-elevated text-text-primary",
                  )}
                >
                  {message.content}
                </div>
              )}
              {message.role === "assistant" && (
                <HanSpeechButton
                  text={message.content}
                  voice={voice}
                  responseLanguage={message.responseLanguage}
                  autoPlay={
                    (responseMode === "TEXT_AND_AUDIO" ||
                      responseMode === "AUDIO_ONLY") &&
                    !voiceConversationActive &&
                    !message.spokenLive &&
                    message.id.startsWith("local-")
                  }
                />
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div
            className="flex items-center gap-2 self-start text-text-secondary"
            role="status"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <Supporting>Han is thinking...</Supporting>
          </div>
        )}
      </div>

      {error && (
        <InformationBanner variant="error">
          <div className="flex flex-col items-start gap-1">
            <span>{error}</span>
            {lastFailedMessage && (
              <Button
                type="button"
                variant="tertiary"
                className="px-0"
                onClick={() => void handleSend(lastFailedMessage)}
              >
                Retry
              </Button>
            )}
          </div>
        </InformationBanner>
      )}

      <div className="flex flex-wrap gap-1.5">
        {suggestedPromptsFor(activeContext).map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void handleSend(prompt)}
            className="rounded-full border border-border px-2.5 py-1 font-interface text-caption text-text-secondary hover:border-primary-500 hover:bg-primary-500 hover:text-on-color-light"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Han..."
          aria-label="Message Han"
          className="min-h-11 flex-1"
          rows={1}
        />
        <HanVoiceInput
          disabled={sending || resetting || voiceConversationActive}
          context={activeContext}
          onTranscript={(transcript) => setDraft(transcript)}
        />
        <IconButton
          icon={<Send className="size-4" aria-hidden="true" />}
          aria-label="Send message"
          disabled={sending || resetting || !draft.trim()}
          onClick={() => void handleSend(draft)}
        />
      </div>

      {voiceEnabled && (
        <HanVoiceConversation
          disabled={sending || resetting}
          voice={voice}
          explanationLanguage={explanationLanguage}
          mode={mode}
          context={activeContext}
          open={open}
          appendMessage={appendRealtimeMessage}
          onActiveChange={setVoiceConversationActive}
        />
      )}

      <Button
        type="button"
        variant="tertiary"
        className="w-fit gap-1.5 self-start px-0"
        onClick={() => void resetConversation()}
      >
        <RotateCcw className="size-3.5" aria-hidden="true" />
        Reset conversation
      </Button>
    </div>
  );
}
