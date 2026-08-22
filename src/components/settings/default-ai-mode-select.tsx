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
import { updateDefaultAiModeAction } from "@/lib/actions/settings";

const MODE_OPTIONS = [
  { value: "TUTOR", label: "Tutor" },
  { value: "PRACTICE", label: "Practice" },
];

export function DefaultAiModeSelect({ initialMode }: { initialMode: string }) {
  const [mode, setMode] = useState(initialMode);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    setMode(next);
    setSaving(true);
    await updateDefaultAiModeAction(next);
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Caption>Default Han mode</Caption>
      <Select
        value={mode}
        onValueChange={(v) => void handleChange(v)}
        disabled={saving}
      >
        <SelectTrigger aria-label="Default Han mode" className="max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MODE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
