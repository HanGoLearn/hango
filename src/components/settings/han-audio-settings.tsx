"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Caption, Supporting } from "@/components/ui/typography";
import { InformationBanner } from "@/components/ui/banner";
import { updateHanAudioSettingsAction } from "@/lib/actions/settings";
import type { SettingsMessages } from "@/i18n/messages/types";

/** Restricted to "cedar" only (2026-08-21, user request) - see HAN_VOICES in actions/settings.ts for the enforced allow-list. */
const VOICE = "cedar";

export function HanAudioSettings({
  initialResponseMode,
  initialVoice: _initialVoice,
  messages,
}: {
  initialResponseMode: "TEXT_ONLY" | "TEXT_AND_AUDIO" | "AUDIO_ONLY";
  /** Unused now that voice is fixed to "cedar" - every profile was already
      backfilled to it (migration 20260821223212), kept as a prop so the
      caller (Settings page) doesn't need its own special-case. */
  initialVoice: string;
  messages: SettingsMessages["han"];
}) {
  const router = useRouter();
  const [responseMode, setResponseMode] = useState(initialResponseMode);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      await updateHanAudioSettingsAction(responseMode, VOICE);
      router.refresh();
      setMessage(messages.saved);
    } catch {
      setMessage(messages.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function preview() {
    setPreviewing(true);
    setMessage(null);
    try {
      const response = await fetch("/api/han/speech", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          voice: VOICE,
          text: "Hola, soy Han. Aprenderemos mandarín de forma clara y natural.",
          responseLanguage: "Spanish",
        }),
      });
      if (!response.ok) throw new Error("preview failed");
      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch {
      setMessage(messages.previewError);
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {message && <InformationBanner>{message}</InformationBanner>}

      <div className="flex flex-col gap-2">
        <Caption>{messages.replies}</Caption>
        <RadioGroup
          value={responseMode}
          onValueChange={(value) => {
            if (
              value === "TEXT_ONLY" ||
              value === "TEXT_AND_AUDIO" ||
              value === "AUDIO_ONLY"
            ) {
              setResponseMode(value);
            }
          }}
        >
          <RadioGroupItem value="TEXT_ONLY" label={messages.textOnly} />
          <RadioGroupItem
            value="TEXT_AND_AUDIO"
            label={messages.textAndAudio}
          />
          <RadioGroupItem value="AUDIO_ONLY" label={messages.audioOnly} />
        </RadioGroup>
        <Supporting>{messages.replyDescription}</Supporting>
      </div>

      <div className="flex flex-col gap-1.5">
        <Caption>{messages.voice}</Caption>
        <span className="font-interface text-body text-text-primary">
          {messages.voiceName}
        </span>
        <Supporting>{messages.voiceDisclosure}</Supporting>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void preview()}
          loading={previewing}
        >
          <Play className="size-4" aria-hidden="true" />
          {messages.preview}
        </Button>
        <Button type="button" onClick={() => void save()} loading={saving}>
          <Volume2 className="size-4" aria-hidden="true" />
          {messages.save}
        </Button>
      </div>
    </div>
  );
}
