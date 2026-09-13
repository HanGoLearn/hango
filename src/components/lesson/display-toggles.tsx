"use client";

import { Toggle } from "@/components/ui/toggle";
import { useLessonDisplayPrefs } from "@/components/lesson/lesson-display-prefs";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

export function DisplayToggles() {
  const messages = useLessonMessages();
  const {
    showPinyin,
    showTranslation,
    toggleShowPinyin,
    toggleShowTranslation,
  } = useLessonDisplayPrefs();

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Toggle
        label={messages.display.pinyin}
        checked={showPinyin}
        onCheckedChange={toggleShowPinyin}
      />
      <Toggle
        label={messages.display.translation}
        checked={showTranslation}
        onCheckedChange={toggleShowTranslation}
      />
    </div>
  );
}
