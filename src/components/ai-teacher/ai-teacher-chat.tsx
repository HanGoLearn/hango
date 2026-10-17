"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Send, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import { Body, Caption, Supporting } from "@/components/ui/typography";
import { InformationBanner } from "@/components/ui/banner";
import { HanAvatar, type HanPose } from "@/components/ui/han-mascot";
import { cn } from "@/lib/cn";
import {
  useAiTeacher,
  type AiTeacherInputModality,
} from "@/components/ai-teacher/ai-teacher-provider";
import { HanVoiceInput } from "@/components/ai-teacher/han-voice-input";
import { HanVoiceConversation } from "@/components/ai-teacher/han-voice-conversation";
import { HanSpeechButton } from "@/components/ai-teacher/han-speech-button";
import type { AiTeacherContext } from "@/lib/ai-context";
import {
  extractHanPronunciationTarget,
  type HanPronunciationAttemptEvidence,
} from "@/lib/speech/han-pronunciation";

/**
 * Reactive avatar (2026-08-31, Han Companion) - a lightweight, always-
 * reliable visual complement to Practice mode's spoken warmth, which
 * depends on the realtime model actually executing tone instructions well.
 * Keyword-based, best-effort - not a claim of real sentiment analysis, just
 * enough to make Han's face feel alive instead of permanently neutral.
 */
function inferHanPose(content: string): HanPose {
  if (
    /[!！]|太好了|加油|做得好|genial|excelente|great job|nice one|awesome|well done/iu.test(
      content,
    )
  ) {
    return "celebrating";
  }
  if (
    /lo siento|perdón|抱歉|不好意思|\bsorry\b|my (?:mistake|bad)/iu.test(
      content,
    )
  ) {
    return "wrong";
  }
  if (/[?？]/u.test(content)) {
    return "curious";
  }
  return "idle";
}

function suggestedPromptsFor(context: AiTeacherContext): string[] {
  const prompts: string[] = [];
  if (context.selectedVocabulary) {
    prompts.push(
      `Explain "${context.selectedVocabulary.chineseForm}" in more detail`,
      `Help me pronounce ${context.selectedVocabulary.chineseForm}`,
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

/** The chat body shared by the desktop panel (expanded), the mobile drawer (8.3), and Han Tutor's full-page view (/han). */
export function AiTeacherChat({
  voiceEnabled = true,
  rolePlayEnabled = true,
  spacious = false,
}: {
  voiceEnabled?: boolean;
  /** The floating Han tutor must never inherit Speaking's Mandarin-only persona. */
  rolePlayEnabled?: boolean;
  /**
   * A taller, larger-text input (2026-08-31, user report) - the default
   * sizing was tuned for the small floating bubble/mobile drawer, where a
   * single compact line makes sense. Han Tutor's full-page view (/han) has
   * a whole empty page around it, and the same tiny input looked
   * disproportionate there. Bubble/drawer callers stay at the original
   * size; only the /han page opts in.
   */
  spacious?: boolean;
}) {
  const {
    context,
    mode,
    messages,
    sending,
    resetting,
    error,
    autoPlayVoiceReplies,
    voice,
    explanationLanguage,
    open,
    sendMessage,
    appendRealtimeMessage,
    resetConversation,
  } = useAiTeacher();
  const [draft, setDraft] = useState("");
  const [voiceConversationActive, setVoiceConversationActive] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<{
    text: string;
    modality: AiTeacherInputModality;
    pronunciationAttempt: HanPronunciationAttemptEvidence | null;
  } | null>(null);
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
  const pronunciationTarget = useMemo(() => {
    if (mode !== "TUTOR" || activeContext.rolePlay) return null;
    const latestAssistant = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    return extractHanPronunciationTarget(latestAssistant?.content);
  }, [activeContext.rolePlay, messages, mode]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending]);

  async function handleSend(
    text: string,
    modality: AiTeacherInputModality = "text",
    pronunciationAttempt: HanPronunciationAttemptEvidence | null = null,
    preserveAttemptNumber = false,
  ) {
    const trimmed = text.trim();
    if (!trimmed || sending || resetting) return;
    setDraft("");
    const numberedAttempt = pronunciationAttempt
      ? {
          ...pronunciationAttempt,
          attempt: preserveAttemptNumber
            ? pronunciationAttempt.attempt
            : Math.min(
                4,
                1 +
                  messages.filter(
                    (message) =>
                      message.role === "user" &&
                      message.pronunciationAttempt?.targetHanzi ===
                        pronunciationAttempt.targetHanzi,
                  ).length,
              ),
        }
      : null;
    const turnContext: AiTeacherContext = {
      ...activeContext,
      pronunciationAttempt: numberedAttempt ?? undefined,
    };
    const reply = await sendMessage(
      trimmed,
      turnContext,
      modality,
      numberedAttempt,
    );
    setLastFailedMessage(
      reply
        ? null
        : {
            text: trimmed,
            modality,
            pronunciationAttempt: numberedAttempt,
          },
    );
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
      .join(" · ") || "No active lesson context";

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Caption>{contextLabel}</Caption>
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
              <HanAvatar
                pose={inferHanPose(message.content)}
                size={26}
                className="mb-0.5"
              />
            )}
            <div className="min-w-0">
              {/* Every response remains visible. Input modality now decides
                  only whether Han also speaks automatically: typed turns stay
                  quiet; recorded/live voice turns play once and retain their
                  transcript for accessibility and review. */}
              {
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
              }
              {message.role === "assistant" && (
                <HanSpeechButton
                  text={message.content}
                  voice={voice}
                  responseLanguage={message.responseLanguage}
                  speechStyle={mode === "TUTOR" ? "tutor" : "companion"}
                  experience={mode === "TUTOR" ? "HAN_TUTOR" : "HAN_COMPANION"}
                  autoPlay={
                    autoPlayVoiceReplies &&
                    Boolean(message.autoPlayAudio) &&
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
                onClick={() =>
                  void handleSend(
                    lastFailedMessage.text,
                    lastFailedMessage.modality,
                    lastFailedMessage.pronunciationAttempt,
                    true,
                  )
                }
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
        {/* Textarea's own root element is a wrapper <div> (label/error/
            character-count row), not the <textarea> itself - a className
            of just "flex-1" lands on the inner <textarea> and never
            reaches that outer wrapper, so it never actually grew to fill
            this row (2026-08-31, real bug found verifying the user's "still
            looks the same" report - not just a re-apply-the-same-fix case).
            Wrapping it here is what actually makes it take the row's
            width, matching the full-width "Start live conversation"
            button below it. */}
        <div className="min-w-0 flex-1">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Han..."
            aria-label="Message Han"
            className={cn(
              "w-full",
              spacious ? "min-h-24 text-body sm:min-h-28" : "min-h-11",
            )}
            rows={spacious ? 3 : 1}
          />
        </div>
        <HanVoiceInput
          experience={mode === "TUTOR" ? "HAN_TUTOR" : "HAN_COMPANION"}
          disabled={sending || resetting || voiceConversationActive}
          context={activeContext}
          pronunciationTarget={pronunciationTarget}
          onTranscript={(transcript, pronunciationAttempt) =>
            void handleSend(transcript, "voice", pronunciationAttempt)
          }
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
