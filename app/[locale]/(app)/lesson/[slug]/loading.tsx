"use client";

import { LoadingState } from "@/components/ui/states";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

export default function LessonLoading() {
  const messages = useLessonMessages();
  return <LoadingState message={messages.loading} />;
}
