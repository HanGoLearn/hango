"use client";

import { useState, useTransition } from "react";
import { aiFeatureDescriptor } from "@/lib/ai-feature-catalog";
import { AI_EXPERIENCES, experienceForLimitKey } from "@/lib/ai-experiences";
import { ShieldBan } from "lucide-react";
import { updateUserAiUsageCapAction } from "@/lib/actions/admin-ai-usage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LimitMode = "GENERAL" | "CUSTOM" | "BLOCKED";

export interface UserAiUsageLimitRow {
  feature: string;
  label: string;
  mode: LimitMode;
  generalLimitUsd: number;
  customLimitUsd: number | null;
  effectiveLimitUsd: number;
  todayCostUsd: number;
  todayCallCount: number;
}

function usd(value: number): string {
  return `$${value.toFixed(value < 1 ? 4 : 2)}`;
}

export function UserAiUsageLimits({
  userId,
  rows,
}: {
  userId: string;
  rows: UserAiUsageLimitRow[];
}) {
  const exceptionCount = rows.filter((row) => row.mode !== "GENERAL").length;

  return (
    <section
      id="ai-user-limits"
      className="rounded-panel border border-border bg-surface"
    >
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-warning-500/15 text-warning-500">
          <ShieldBan className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-section-title font-semibold">
            Límites personalizados de IA
          </h2>
          <p className="mt-1 max-w-3xl font-interface text-caption text-text-muted">
            Una excepción afecta únicamente a este usuario. Si eliges “usar
            límite general”, la experiencia vuelve a heredar la configuración de
            Límites de IA. Voz, texto y evaluación comparten ese único saldo;
            reinicia cada día en UTC.
          </p>
        </div>
      </div>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-interface text-supporting font-semibold hover:bg-elevated">
          <span>Administrar presupuestos por experiencia</span>
          <span className="rounded-full bg-elevated px-3 py-1 text-caption text-text-secondary group-open:bg-primary-500/15 group-open:text-primary-400">
            {exceptionCount} excepción{exceptionCount === 1 ? "" : "es"}
          </span>
        </summary>
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[920px] text-left font-interface text-supporting">
            <thead className="bg-elevated text-caption uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-5 py-3">Experiencia</th>
                <th className="px-4 py-3 text-right">Consumido hoy</th>
                <th className="px-4 py-3 text-right">Límite general</th>
                <th className="px-5 py-3">Configuración para este usuario</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <LimitControlRow key={row.feature} userId={userId} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

function LimitControlRow({
  userId,
  row,
}: {
  userId: string;
  row: UserAiUsageLimitRow;
}) {
  const initialValue = String(row.customLimitUsd ?? row.generalLimitUsd);
  const [mode, setMode] = useState<LimitMode>(row.mode);
  const [value, setValue] = useState(initialValue);
  const [savedMode, setSavedMode] = useState<LimitMode>(row.mode);
  const [savedValue, setSavedValue] = useState(initialValue);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dirty =
    mode !== savedMode || (mode === "CUSTOM" && value !== savedValue);

  function save() {
    const parsed = mode === "CUSTOM" ? Number(value) : undefined;
    startTransition(async () => {
      const result = await updateUserAiUsageCapAction(
        userId,
        row.feature,
        mode,
        parsed,
      );
      if (result.ok) {
        setSavedMode(mode);
        setSavedValue(value);
        setStatus("saved");
        setError(null);
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  return (
    <tr className="border-t border-border align-top">
      <td className="px-5 py-4">
        <p className="font-semibold">{row.label}</p>
        <p className="mt-1 max-w-md text-caption text-text-muted">
          {experienceForLimitKey(row.feature)
            ? AI_EXPERIENCES[experienceForLimitKey(row.feature)!].description
            : aiFeatureDescriptor(row.feature)?.description}
        </p>
      </td>
      <td className="px-4 py-4 text-right">
        <p>{usd(row.todayCostUsd)}</p>
        <p className="text-caption text-text-muted">
          {row.todayCallCount} solicitud{row.todayCallCount === 1 ? "" : "es"}
        </p>
      </td>
      <td className="px-4 py-4 text-right font-semibold">
        {usd(row.generalLimitUsd)}
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap items-start gap-2">
          <Select
            value={mode}
            onValueChange={(nextMode) => {
              setMode(nextMode as LimitMode);
              setStatus("idle");
            }}
          >
            <SelectTrigger
              className="w-52"
              aria-label={`Configuración de ${row.label}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GENERAL">Usar límite general</SelectItem>
              <SelectItem value="CUSTOM">Límite personalizado</SelectItem>
              <SelectItem value="BLOCKED">Bloquear experiencia</SelectItem>
            </SelectContent>
          </Select>
          {mode === "CUSTOM" && (
            <div className="flex items-center gap-1">
              <span className="text-text-muted">$</span>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  setStatus("idle");
                }}
                className="w-24"
                aria-label={`Límite personalizado para ${row.label}`}
              />
            </div>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={save}
            disabled={!dirty || isPending}
            loading={isPending}
          >
            Guardar
          </Button>
        </div>
        <p className="mt-1 font-interface text-caption text-text-muted">
          {mode === "GENERAL"
            ? `Límite efectivo: ${usd(row.generalLimitUsd)} al día.`
            : mode === "BLOCKED"
              ? "La experiencia quedará bloqueada solo para este usuario."
              : `Límite efectivo: ${usd(Number(value) || 0)} al día.`}
        </p>
        <p aria-live="polite" className="mt-1 font-interface text-caption">
          {status === "saved" && (
            <span className="text-success-500">Configuración guardada.</span>
          )}
          {status === "error" && (
            <span className="text-error-500">{error}</span>
          )}
        </p>
      </td>
    </tr>
  );
}
