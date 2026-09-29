"use client";

import { useActionState, useState } from "react";
import { UserPlus } from "lucide-react";
import {
  createBetaInvitationAction,
  type BetaInvitationFormState,
} from "@/lib/actions/admin-beta-invitations";
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

const initialState: BetaInvitationFormState = { ok: false, message: "" };

export function BetaInvitationForm() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    createBetaInvitationAction,
    initialState,
  );

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button>
          <UserPlus className="size-4" aria-hidden="true" /> Invitar usuario
        </Button>
      </ModalTrigger>
      <ModalContent className="max-w-xl">
        <ModalTitle className="pr-12">Nueva invitación de beta</ModalTitle>
        <ModalDescription className="mt-1">
          Solo este correo podrá crear una cuenta. La misma autorización sirve
          para registro con contraseña o con Google.
        </ModalDescription>
        <form action={action} className="mt-5 grid gap-4">
          <Input
            name="email"
            type="email"
            label="Correo invitado"
            autoComplete="off"
            required
            error={state.fieldErrors?.email?.[0]}
            placeholder="persona@ejemplo.com"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="cohort"
              label="Cohorte (opcional)"
              maxLength={60}
              error={state.fieldErrors?.cohort?.[0]}
              placeholder="Ola 1"
            />
            <Input
              name="expiresOn"
              type="date"
              label="Vence al finalizar (opcional)"
              error={state.fieldErrors?.expiresOn?.[0]}
            />
          </div>
          <Textarea
            name="note"
            label="Nota interna (opcional)"
            maxLength={300}
            error={state.fieldErrors?.note?.[0]}
            placeholder="De dónde viene el participante o qué deseas observar."
          />
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
              Guardar invitación
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
