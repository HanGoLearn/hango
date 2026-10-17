"use client";

import { useState, useTransition } from "react";
import { updateDailyUsageCapAction } from "@/lib/actions/admin-ai-usage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Caption } from "@/components/ui/typography";

export function AiUsageCapInput({
  feature,
  label = feature,
  initialValue,
}: {
  feature: string;
  label?: string;
  initialValue: number;
}) {
  const [value, setValue] = useState(String(initialValue));
  const [savedValue, setSavedValue] = useState(String(initialValue));
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const dirty = value !== savedValue;

  function handleSave() {
    const parsed = Number(value);
    startTransition(async () => {
      const result = await updateDailyUsageCapAction(feature, parsed);
      if (result.ok) {
        setStatus("saved");
        setError(null);
        setSavedValue(value);
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-text-muted">$</span>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setStatus("idle");
          }}
          className="w-24"
          aria-label={`Límite diario para ${label}`}
        />
        <Button
          type="button"
          size="md"
          variant="secondary"
          onClick={handleSave}
          disabled={!dirty || isPending}
          loading={isPending}
        >
          Guardar
        </Button>
      </div>
      {status === "saved" && (
        <Caption className="text-secondary-500">Guardado.</Caption>
      )}
      {status === "error" && (
        <Caption className="text-error-500">{error}</Caption>
      )}
    </div>
  );
}
