"use client";

import { useActionState, useState } from "react";
import { Megaphone } from "lucide-react";
import {
  createAnnouncementAction,
  type AdminFormState,
} from "@/lib/actions/admin-communications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

const initialState: AdminFormState = { ok: false, message: "" };

export function AnnouncementForm({
  initialOpen = false,
}: {
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [state, action, pending] = useActionState(
    createAnnouncementAction,
    initialState,
  );

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button>
          <Megaphone className="size-4" aria-hidden="true" /> Crear anuncio
        </Button>
      </ModalTrigger>
      <ModalContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <ModalTitle>Nuevo anuncio para usuarios</ModalTitle>
        <ModalDescription className="mt-1">
          Se mostrará al entrar a HanGo durante el periodo que definas. Puedes
          guardarlo como borrador antes de publicarlo.
        </ModalDescription>
        <form action={action} className="mt-5 grid gap-4">
          <Input
            name="title"
            label="Título"
            maxLength={90}
            required
            error={state.fieldErrors?.title?.[0]}
            placeholder="Por ejemplo: ¡Nueva práctica disponible!"
          />
          <Textarea
            name="message"
            label="Mensaje"
            maxLength={1200}
            required
            error={state.fieldErrors?.message?.[0]}
            placeholder="Explica qué cambió y por qué le importa al estudiante."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <NativeSelect
              name="type"
              label="Tipo"
              defaultValue="UPDATE"
              options={[
                ["INFO", "Información"],
                ["UPDATE", "Novedad"],
                ["MAINTENANCE", "Mantenimiento"],
                ["CELEBRATION", "Celebración"],
                ["IMPORTANT", "Importante"],
              ]}
            />
            <NativeSelect
              name="priority"
              label="Prioridad"
              defaultValue="NORMAL"
              options={[
                ["NORMAL", "Normal"],
                ["IMPORTANT", "Importante"],
                ["URGENT", "Urgente"],
              ]}
            />
            <NativeSelect
              name="locale"
              label="Idioma"
              defaultValue="ALL"
              options={[
                ["ALL", "Todos"],
                ["ES", "Español"],
                ["EN", "English"],
              ]}
            />
            <NativeSelect
              name="publication"
              label="Publicación"
              defaultValue="PUBLISHED"
              options={[
                ["PUBLISHED", "Publicar"],
                ["DRAFT", "Guardar borrador"],
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="datetime-local"
              name="startsAt"
              label="Inicio (opcional)"
              hint="Vacío significa ahora."
            />
            <Input
              type="datetime-local"
              name="endsAt"
              label="Finalización (opcional)"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="ctaLabel"
              label="Texto del botón (opcional)"
              maxLength={40}
              error={state.fieldErrors?.ctaLabel?.[0]}
              placeholder="Probar ahora"
            />
            <Input
              name="ctaHref"
              label="Ruta del botón (opcional)"
              maxLength={200}
              error={state.fieldErrors?.ctaHref?.[0]}
              placeholder="/learn"
            />
          </div>
          {state.message && (
            <p
              role="status"
              className={`rounded-control px-3 py-2 font-interface text-supporting ${state.ok ? "bg-secondary-500/15 text-secondary-400" : "bg-error-500/15 text-error-500"}`}
            >
              {state.message}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>
              Guardar anuncio
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}

function NativeSelect({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: [string, string][];
}) {
  return (
    <label className="flex flex-col gap-1.5 font-interface text-supporting font-medium">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="rounded-control border border-border bg-surface px-3 py-2 text-body outline-none focus:border-primary-500"
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}
