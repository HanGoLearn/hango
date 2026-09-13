"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { Caption } from "@/components/ui/typography";
import { setAiConversationStorageEnabledAction } from "@/lib/actions/settings";
import type { SettingsMessages } from "@/i18n/messages/types";

export function AiConversationStorageToggle({
  initialEnabled,
  messages,
}: {
  initialEnabled: boolean;
  messages: SettingsMessages["han"];
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: boolean) {
    setEnabled(next);
    setSaving(true);
    await setAiConversationStorageEnabledAction(next);
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Toggle
        label={messages.memoryLabel}
        checked={enabled}
        disabled={saving}
        onCheckedChange={(next) => void handleChange(next)}
      />
      <Caption>{messages.memoryDescription}</Caption>
    </div>
  );
}
