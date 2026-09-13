"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LessonMessages } from "@/i18n/messages/types";

const LessonMessagesContext = createContext<LessonMessages | null>(null);

export function LessonMessagesProvider({
  messages,
  children,
}: {
  messages: LessonMessages;
  children: ReactNode;
}) {
  return (
    <LessonMessagesContext.Provider value={messages}>
      {children}
    </LessonMessagesContext.Provider>
  );
}

export function useLessonMessages() {
  const messages = useContext(LessonMessagesContext);
  if (!messages) {
    throw new Error("LessonMessagesProvider is missing from the app shell.");
  }
  return messages;
}
