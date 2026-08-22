"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { Caption } from "@/components/ui/typography";
import { setAiConversationStorageEnabledAction } from "@/lib/actions/settings";

export function AiConversationStorageToggle({
  initialEnabled,
}: {
  initialEnabled: boolean;
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
        label="Remember AI Teacher conversations"
        checked={enabled}
        disabled={saving}
        onCheckedChange={(next) => void handleChange(next)}
      />
      <Caption>
        When off, the AI Teacher still answers but nothing is saved between
        messages or sessions.
      </Caption>
    </div>
  );
}
