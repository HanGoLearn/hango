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

const RETENTION_OPTIONS = [
  { value: "forever", label: "Keep indefinitely" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
];

export function RecordingRetentionSelect({
  initialDays,
}: {
  initialDays: number | null;
}) {
  const [value, setValue] = useState(
    initialDays === null ? "forever" : String(initialDays),
  );
  const [saving, setSaving] = useState(false);

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
      <Caption>Speaking Lab recording retention</Caption>
      <Select
        value={value}
        onValueChange={(v) => void handleChange(v)}
        disabled={saving}
      >
        <SelectTrigger aria-label="Recording retention" className="max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RETENTION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Caption>
        Stores your preference only — automatic deletion on a schedule
        isn&apos;t built yet.
      </Caption>
    </div>
  );
}
