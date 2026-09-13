"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Caption } from "@/components/ui/typography";
import { updateRecordingRetentionAction } from "@/lib/actions/settings";
import type { SettingsMessages } from "@/i18n/messages/types";

export function RecordingRetentionSelect({
  initialDays,
  messages,
}: {
  initialDays: number | null;
  messages: SettingsMessages["privacy"];
}) {
  const [value, setValue] = useState(
    initialDays === null ? "forever" : String(initialDays),
  );
  const [saving, setSaving] = useState(false);
  const retentionOptions = [
    { value: "forever", label: messages.forever },
    { value: "30", label: messages.days30 },
    { value: "90", label: messages.days90 },
    { value: "365", label: messages.year },
  ];

  async function handleChange(next: string) {
    setValue(next);
    setSaving(true);
    await updateRecordingRetentionAction(
      next === "forever" ? null : Number(next),
    );
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Caption>{messages.recordingRetention}</Caption>
      <Select
        value={value}
        onValueChange={(v) => void handleChange(v)}
        disabled={saving}
      >
        <SelectTrigger aria-label={messages.ariaLabel} className="max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {retentionOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Caption>{messages.note}</Caption>
    </div>
  );
}
