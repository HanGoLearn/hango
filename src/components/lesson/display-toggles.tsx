"use client";

import { Toggle } from "@/components/ui/toggle";
import { useLessonDisplayPrefs } from "@/components/lesson/lesson-display-prefs";

export function DisplayToggles() {
  const {
    showPinyin,
    showTranslation,
    toggleShowPinyin,
    toggleShowTranslation,
  } = useLessonDisplayPrefs();

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Toggle
        label="Pinyin"
        checked={showPinyin}
        onCheckedChange={toggleShowPinyin}
      />
      <Toggle
        label="Translation"
        checked={showTranslation}
        onCheckedChange={toggleShowTranslation}
      />
    </div>
  );
}
