"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  sendAiTeacherMessageAction,
  resetAiTeacherConversationAction,
} from "@/lib/actions/ai-teacher";
import { resolveCurrentPageName } from "@/lib/navigation";
import type {
  AiTeacherContext as AiTeacherContextData,
  AiTeacherMode,
} from "@/lib/ai-context";
import type { HanPronunciationAttemptEvidence } from "@/lib/speech/han-pronunciation";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  responseLanguage?: "English" | "Spanish" | "Chinese";
  /** The Realtime session already played this response as it was generated. */
  spokenLive?: boolean;
  /** A recorded voice message should receive one spoken reply in text chat. */
  autoPlayAudio?: boolean;
  /** Local, audio-derived coaching evidence for this learner turn. */
  pronunciationAttempt?: HanPronunciationAttemptEvidence;
}

export type AiTeacherInputModality = "text" | "voice";

export interface InitialAiMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}

interface AiTeacherState {
  context: AiTeacherContextData;
  mode: AiTeacherMode;
  open: boolean;
  messages: AiChatMessage[];
  sending: boolean;
  /** A conversation-clear (server-side delete) is in flight - input should stay disabled so a message can't be sent with stale history still attached. */
  resetting: boolean;
  error: string | null;
  autoPlayVoiceReplies: boolean;
  voice: string;
  explanationLanguage: string;
  setMode: (mode: AiTeacherMode) => void;
  setContext: (patch: Partial<AiTeacherContextData>) => void;
  clearSelection: () => void;
  setOpen: (open: boolean) => void;
  /** Opens the floating Han bubble - used by "Ask AI" buttons everywhere. */
  openTeacher: (patch?: Partial<AiTeacherContextData>) => Promise<void>;
  sendMessage: (
    text: string,
    contextOverride?: AiTeacherContextData,
    inputModality?: AiTeacherInputModality,
    pronunciationAttempt?: HanPronunciationAttemptEvidence | null,
  ) => Promise<AiChatMessage | null>;
  appendRealtimeMessage: (message: Omit<AiChatMessage, "id">) => void;
  /**
   * Clears only Han Tutor's client and persisted conversation. Companion is a
   * separate voice surface and invokes its own server-side reset without ever
   * passing through this provider's visible message state.
   */
  resetConversation: () => Promise<void>;
}

const AiTeacherStateContext = createContext<AiTeacherState | null>(null);

let messageIdCounter = 0;
function nextMessageId(): string {
  messageIdCounter += 1;
  return `local-${messageIdCounter}`;
}

export function AiTeacherProvider({
  initialMessages = [],
  initialMode = "TUTOR",
  initialAutoPlayVoiceReplies = true,
  initialVoice = "cedar",
  initialExplanationLanguage = "EN",
  children,
}: {
  /**
   * Deliberately not pre-loaded from the database by AppShell anymore
   * (2026-08-19, project/learning-journey-optimization.md) - the chat
   * always starts visually empty (openTeacher resets it on open anyway),
   * so eagerly fetching old history just to discard it was pure waste.
   * Kept as a prop (not removed) since component tests still exercise the
   * "starts fresh" behavior by passing stale messages in directly.
   */
  initialMessages?: InitialAiMessage[];
  /** From LearnerProfile.defaultAiMode (14.4 "Edit default AI mode"). */
  initialMode?: AiTeacherMode;
  initialAutoPlayVoiceReplies?: boolean;
  initialVoice?: string;
  initialExplanationLanguage?: string;
  children: ReactNode;
}) {
  const [contextState, setContextState] = useState<AiTeacherContextData>({});
  const pathname = usePathname();
  const [mode, setMode] = useState<AiTeacherMode>(initialMode);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>(
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
    })),
  );
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setContext = useCallback((patch: Partial<AiTeacherContextData>) => {
    setContextState((current) => ({ ...current, ...patch }));
  }, []);

  const clearSelection = useCallback(() => {
    setContextState((current) => ({
      scenarioName: current.scenarioName,
      lessonTitle: current.lessonTitle,
      lessonStepType: current.lessonStepType,
      lessonVocabulary: current.lessonVocabulary,
      lessonGrammar: current.lessonGrammar,
    }));
  }, []);

  /**
   * Han-panel page awareness (text and voice, rolePlay unset). Derived at
   * render time from the current route rather than synced via an effect
   * (avoids a setState-in-effect render cascade). Speaking Lab and lesson
   * Speaking provide rolePlay context and remain a separate persona.
   */
  const context = useMemo<AiTeacherContextData>(
    () => ({
      ...contextState,
      currentPageName: resolveCurrentPageName(pathname) ?? undefined,
    }),
    [contextState, pathname],
  );

  const resetConversation = useCallback(async () => {
    setMessages([]);
    setError(null);
    setResetting(true);
    try {
      await resetAiTeacherConversationAction(false);
    } finally {
      setResetting(false);
    }
  }, []);

  /**
   * Opens instantly (2026-08-21) - previously awaited the full server-side
   * reset (a real DB round-trip, `resetConversation` in ai-teacher-data.ts)
   * before revealing the bubble's panel at all, so any slowness there (a
   * cold connection, a slow query) delayed the *click* itself by however
   * long the network call took. The panel now opens the instant it's
   * clicked; the reset keeps running in the background and `resetting`
   * (above) disables sending until it's actually done, so a message can
   * never race ahead of the delete and reach the AI with stale history
   * still attached.
   */
  const openTeacher = useCallback(
    async (patch?: Partial<AiTeacherContextData>) => {
      if (patch) setContext(patch);
      setOpen(true);
      void resetConversation();
    },
    [resetConversation, setContext],
  );

  const sendMessage = useCallback(
    async (
      text: string,
      contextOverride?: AiTeacherContextData,
      inputModality: AiTeacherInputModality = "text",
      pronunciationAttempt: HanPronunciationAttemptEvidence | null = null,
    ) => {
      const userMessage: AiChatMessage = {
        id: nextMessageId(),
        role: "user",
        content: text,
        pronunciationAttempt: pronunciationAttempt ?? undefined,
      };
      setMessages((current) => [...current, userMessage]);
      setSending(true);
      setError(null);

      const result = await sendAiTeacherMessageAction(
        text,
        contextOverride ?? context,
        mode,
      );

      setSending(false);
      if (result.ok) {
        const assistantMessage: AiChatMessage = {
          id: nextMessageId(),
          role: "assistant",
          content: result.reply,
          responseLanguage: result.responseLanguage,
          autoPlayAudio: inputModality === "voice",
        };
        setMessages((current) => [...current, assistantMessage]);
        return assistantMessage;
      }
      setError(result.error);
      return null;
    },
    [context, mode],
  );

  const appendRealtimeMessage = useCallback(
    (message: Omit<AiChatMessage, "id">) => {
      setMessages((current) => [
        ...current,
        { ...message, id: nextMessageId() },
      ]);
    },
    [],
  );

  return (
    <AiTeacherStateContext.Provider
      value={{
        context,
        mode,
        open,
        messages,
        sending,
        resetting,
        error,
        autoPlayVoiceReplies: initialAutoPlayVoiceReplies,
        voice: initialVoice,
        explanationLanguage: initialExplanationLanguage,
        setMode,
        setContext,
        clearSelection,
        setOpen,
        openTeacher,
        sendMessage,
        appendRealtimeMessage,
        resetConversation,
      }}
    >
      {children}
    </AiTeacherStateContext.Provider>
  );
}

export function useAiTeacher(): AiTeacherState {
  const ctx = useContext(AiTeacherStateContext);
  if (!ctx) {
    throw new Error("useAiTeacher must be used within AiTeacherProvider");
  }
  return ctx;
}
