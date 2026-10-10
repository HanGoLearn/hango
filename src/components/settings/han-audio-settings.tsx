"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { Caption } from "@/components/ui/typography";
import { updateHanAudioSettingsAction } from "@/lib/actions/settings";
import type { SettingsMessages } from "@/i18n/messages/types";

/** Restricted to "cedar" only (2026-08-21, user request) - see HAN_VOICES in actions/settings.ts for the enforced allow-list. */
const VOICE = "cedar";

export function HanVoiceReplyToggle({
  initialEnabled,
  messages,
}: {
  initialEnabled: boolean;
  messages: SettingsMessages["han"];
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleChange(next: boolean) {
    const previous = enabled;
    setEnabled(next);
    setSaving(true);
    setFailed(false);
    try {
      // The legacy enum remains in the database until a later safe schema
      // cleanup. Its old display-mode semantics are retired: TEXT_ONLY now
      // means muted automatic playback, either audio value means enabled.
      await updateHanAudioSettingsAction(
        next ? "AUDIO_ONLY" : "TEXT_ONLY",
        VOICE,
      );
    } catch {
      setEnabled(previous);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Toggle
        label={messages.autoPlayVoiceReplies}
        checked={enabled}
        disabled={saving}
        onCheckedChange={(next) => void handleChange(next)}
      />
      <Caption>{messages.autoPlayVoiceRepliesDescription}</Caption>
      {failed && (
        <Caption className="text-error-500" role="alert">
          {messages.saveError}
        </Caption>
      )}
    </div>
  );
}
