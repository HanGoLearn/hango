"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Textarea } from "@/components/ui/textarea";
import { Body, Supporting } from "@/components/ui/typography";
import { InformationBanner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { sendMissionMessageAction } from "@/lib/actions/mission";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let messageIdCounter = 0;
function nextId(): string {
  messageIdCounter += 1;
  return `mission-msg-${messageIdCounter}`;
}

/**
 * Self-contained mission conversation - deliberately NOT the FASE 8 AI
 * Teacher chat: a mission's transcript has to stay isolated and boundable
 * so it can be evaluated as one clean unit when the mission ends (see
 * MissionAttempt.transcript), not mixed into the ongoing AiConversation.
 */
export function MissionChat({ attemptId }: { attemptId: string }) {
  const lessonMessages = useLessonMessages();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null,
  );
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setDraft("");
    setMessages((current) => [
      ...current,
      { id: nextId(), role: "user", content: trimmed },
    ]);
    setSending(true);
    setError(null);

    const result = await sendMissionMessageAction(attemptId, trimmed);
    setSending(false);

    if (result.ok) {
      setMessages((current) => [
        ...current,
        { id: nextId(), role: "assistant", content: result.reply },
      ]);
      setLastFailedMessage(null);
    } else {
      setError(result.error);
      setLastFailedMessage(trimmed);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend(draft);
    }
  }

  return (
    <div className="flex h-[26rem] flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto"
      >
        {messages.length === 0 && (
          <Body className="text-text-secondary">
            {lessonMessages.mission.ready}
          </Body>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[85%] rounded-card px-3 py-2 font-interface text-body",
              message.role === "user"
                ? "self-end bg-primary-500 text-neutral-0"
                : "self-start bg-elevated text-text-primary",
            )}
          >
            {message.content}
          </div>
        ))}
        {sending && (
          <div
            className="flex items-center gap-2 self-start text-text-secondary"
            role="status"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <Supporting>{lessonMessages.mission.thinking}</Supporting>
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
                {lessonMessages.mission.retryMessage}
              </Button>
            )}
          </div>
        </InformationBanner>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={lessonMessages.mission.responsePlaceholder}
          aria-label={lessonMessages.mission.yourMessage}
          className="min-h-11 flex-1"
          rows={1}
        />
        <IconButton
          icon={<Send className="size-4" aria-hidden="true" />}
          aria-label={lessonMessages.mission.sendMessage}
          disabled={sending || !draft.trim()}
          onClick={() => void handleSend(draft)}
        />
      </div>
    </div>
  );
}
