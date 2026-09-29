"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { updateGlobalAiBudgetPolicyAction } from "@/lib/actions/admin-ai-usage";

type FamilyState = {
  textEnabled: boolean;
  sttEnabled: boolean;
  ttsEnabled: boolean;
  realtimeEnabled: boolean;
};

export function GlobalAiBudgetControl({
  dailyLimitUsd,
  ...initialFamilies
}: FamilyState & { dailyLimitUsd: number }) {
  const [limit, setLimit] = useState(String(dailyLimitUsd));
  const [families, setFamilies] = useState<FamilyState>(initialFamilies);
  const [saved, setSaved] = useState({
    limit: String(dailyLimitUsd),
    families: initialFamilies,
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty =
    limit !== saved.limit ||
    Object.keys(families).some(
      (key) =>
        families[key as keyof FamilyState] !==
        saved.families[key as keyof FamilyState],
    );

  function setFamily(key: keyof FamilyState, checked: boolean) {
    setFamilies((current) => ({ ...current, [key]: checked }));
    setStatus("idle");
  }

  function save() {
    startTransition(async () => {
      const result = await updateGlobalAiBudgetPolicyAction({
        dailyLimitUsd: Number(limit),
        ...families,
      });
      if (result.ok) {
        setSaved({ limit, families });
        setStatus("saved");
        setError(null);
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(20rem,1.3fr)]">
      <div>
        <label
          htmlFor="global-ai-daily-budget"
          className="font-interface text-body font-semibold text-text-primary"
        >
          Presupuesto global diario
        </label>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-text-muted">$</span>
          <Input
            id="global-ai-daily-budget"
            type="number"
            min="0.01"
            max="2000"
            step="0.01"
            value={limit}
            onChange={(event) => {
              setLimit(event.target.value);
              setStatus("idle");
            }}
            className="w-28"
          />
          <span className="font-interface text-supporting text-text-muted">
            USD/día
          </span>
        </div>
        <p className="mt-2 font-interface text-caption text-text-muted">
          Protege el gasto total de todos los usuarios. Reinicia cada día a las
          00:00 UTC.
        </p>
      </div>

      <fieldset>
        <legend className="font-interface text-body font-semibold text-text-primary">
          Familias disponibles
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <Checkbox
            checked={families.textEnabled}
            onCheckedChange={(checked) =>
              setFamily("textEnabled", checked === true)
            }
            label="Texto y evaluaciones"
          />
          <Checkbox
            checked={families.sttEnabled}
            onCheckedChange={(checked) =>
              setFamily("sttEnabled", checked === true)
            }
            label="Transcripción (STT)"
          />
          <Checkbox
            checked={families.ttsEnabled}
            onCheckedChange={(checked) =>
              setFamily("ttsEnabled", checked === true)
            }
            label="Voces y audios (TTS)"
          />
          <Checkbox
            checked={families.realtimeEnabled}
            onCheckedChange={(checked) =>
              setFamily("realtimeEnabled", checked === true)
            }
            label="Conversación en vivo"
          />
        </div>
        <p className="mt-2 font-interface text-caption text-text-muted">
          Desmarcar una familia la pausa de inmediato sin apagar el resto de
          HanGo ni cambiar la configuración pedagógica de Han.
        </p>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
        <Button
          type="button"
          onClick={save}
          disabled={!dirty || isPending}
          loading={isPending}
        >
          Guardar protección global
        </Button>
        <p aria-live="polite" className="font-interface text-supporting">
          {status === "saved" && (
            <span className="text-success-500">Configuración guardada.</span>
          )}
          {status === "error" && (
            <span className="text-error-500">{error}</span>
          )}
        </p>
      </div>
    </div>
  );
}
