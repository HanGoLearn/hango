"use client";

import { useActionState } from "react";
import {
  updateBetaFeedbackAction,
  type AdminFeedbackFormState,
} from "@/lib/actions/beta-feedback";
import type { BetaFeedbackStatus } from "@/lib/beta-feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: AdminFeedbackFormState = { ok: false, message: "" };

export function FeedbackReviewForm({
  feedbackId,
  status,
  adminResponse,
  internalNote,
}: {
  feedbackId: string;
  status: BetaFeedbackStatus;
  adminResponse: string | null;
  internalNote: string | null;
}) {
  const [state, action, pending] = useActionState(
    updateBetaFeedbackAction,
    initialState,
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-3 border-t border-border pt-4"
    >
      <input type="hidden" name="feedbackId" value={feedbackId} />
      <div className="grid gap-3 lg:grid-cols-[180px_1fr_1fr]">
        <label className="flex flex-col gap-1.5 font-interface text-supporting font-medium text-text-primary">
          Estado
          <select
            name="status"
            defaultValue={status}
            className="rounded-control border border-border bg-surface px-3 py-2 text-body outline-none focus:border-primary-500"
          >
            <option value="NEW">Nuevo</option>
            <option value="REVIEWING">Revisando</option>
            <option value="RESOLVED">Resuelto</option>
          </select>
        </label>
        <Textarea
          name="adminResponse"
          label="Respuesta visible para el usuario"
          defaultValue={adminResponse ?? ""}
          maxLength={2000}
          placeholder="Opcional. La verá en su historial de feedback."
        />
        <Textarea
          name="internalNote"
          label="Nota interna"
          defaultValue={internalNote ?? ""}
          maxLength={2000}
          placeholder="Contexto privado para seguimiento."
        />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {state.message && (
          <p
            role="status"
            className={`font-interface text-supporting ${state.ok ? "text-secondary-400" : "text-error-500"}`}
          >
            {state.message}
          </p>
        )}
        <Button type="submit" loading={pending}>
          Guardar seguimiento
        </Button>
      </div>
    </form>
  );
}
