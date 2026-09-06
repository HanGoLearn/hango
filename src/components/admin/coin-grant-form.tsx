"use client";

import { useActionState, useState } from "react";
import { Coins } from "lucide-react";
import {
  grantHanCoinsAction,
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

export function CoinGrantForm({
  users,
  requestId,
  initialOpen = false,
}: {
  users: {
    id: string;
    name: string;
    email: string | null;
    nickname: string | null;
  }[];
  requestId: string;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [state, action, pending] = useActionState(
    grantHanCoinsAction,
    initialState,
  );

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger asChild>
        <Button variant="secondary">
          <Coins className="size-4 text-accent-300" aria-hidden="true" />{" "}
          Otorgar HanCoins
        </Button>
      </ModalTrigger>
      <ModalContent className="max-w-xl">
        <ModalTitle>Otorgar HanCoins</ModalTitle>
        <ModalDescription className="mt-1">
          El saldo se acredita inmediatamente y el usuario verá tu mensaje al
          volver a HanGo. La entrega quedará registrada.
        </ModalDescription>
        <form action={action} className="mt-5 grid gap-4">
          <input type="hidden" name="requestId" value={requestId} />
          <label className="flex flex-col gap-1.5 font-interface text-supporting font-medium">
            <span>Usuario</span>
            <select
              name="recipientUserId"
              required
              defaultValue=""
              className="rounded-control border border-border bg-surface px-3 py-2 text-body outline-none focus:border-primary-500"
            >
              <option value="" disabled>
                Selecciona una cuenta
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                  {user.nickname ? ` (@${user.nickname})` : ""} —{" "}
                  {user.email ?? "sin correo"}
                </option>
              ))}
            </select>
            {state.fieldErrors?.recipientUserId?.[0] && (
              <span className="text-caption text-error-500">
                {state.fieldErrors.recipientUserId[0]}
              </span>
            )}
          </label>
          <Input
            type="number"
            name="amount"
            label="Cantidad de HanCoins"
            min={1}
            max={10000}
            required
            error={state.fieldErrors?.amount?.[0]}
            placeholder="100"
          />
          <Textarea
            name="message"
            label="Mensaje para el usuario"
            maxLength={300}
            required
            error={state.fieldErrors?.message?.[0]}
            placeholder="Por ejemplo: Gracias por ayudarnos a probar la nueva experiencia."
          />
          <Textarea
            name="internalNote"
            label="Nota interna (opcional)"
            maxLength={300}
            error={state.fieldErrors?.internalNote?.[0]}
            placeholder="Motivo administrativo; el usuario no verá esta nota."
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
              Confirmar entrega
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
