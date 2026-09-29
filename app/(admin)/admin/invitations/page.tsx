import { Ban, Check, Clock3, RotateCcw, UserPlus } from "lucide-react";
import { BetaInvitationForm } from "@/components/admin/beta-invitation-form";
import {
  reopenBetaInvitationAction,
  revokeBetaInvitationAction,
} from "@/lib/actions/admin-beta-invitations";
import { getAdminBetaInvitations } from "@/lib/admin-beta-invitations";
import { requireAdministrator } from "@/lib/admin-auth";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export default async function AdminInvitationsPage() {
  await requireAdministrator();
  const data = await getAdminBetaInvitations();
  const now = new Date();

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-interface text-caption font-semibold uppercase tracking-[0.12em] text-primary-400">
            Acceso controlado
          </p>
          <h1 className="mt-1 font-display text-page-title font-semibold">
            Invitaciones de beta
          </h1>
          <p className="mt-1 max-w-2xl font-interface text-supporting text-text-secondary">
            Autoriza correos antes de compartir el enlace. Las cuentas ya
            creadas pueden seguir entrando aunque luego cierres invitaciones.
          </p>
        </div>
        <BetaInvitationForm />
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total" value={data.counts.total} />
        <Metric label="Pendientes" value={data.counts.pending} />
        <Metric label="Activadas" value={data.counts.activated} />
        <Metric label="Revocadas" value={data.counts.revoked} />
        <Metric label="Vencidas" value={data.counts.expired} />
      </section>

      <section className="overflow-hidden rounded-panel border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <UserPlus className="size-5 text-primary-400" aria-hidden="true" />
          <div>
            <h2 className="font-display text-section-title font-semibold">
              Correos autorizados
            </h2>
            <p className="font-interface text-caption text-text-muted">
              Registro con contraseña y nuevas cuentas de Google usan la misma
              lista.
            </p>
          </div>
        </div>

        <div className="divide-y divide-border">
          {data.invitations.map((invitation) => {
            const expired = Boolean(
              invitation.status === "PENDING" &&
              invitation.expiresAt &&
              invitation.expiresAt <= now,
            );
            return (
              <article
                key={invitation.id}
                className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-interface text-body font-semibold">
                      {invitation.email}
                    </h3>
                    <StatusBadge status={invitation.status} expired={expired} />
                    {invitation.cohort && (
                      <span className="rounded-full bg-elevated px-2.5 py-1 font-interface text-caption font-semibold text-text-secondary">
                        {invitation.cohort}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-interface text-caption text-text-muted">
                    Invitada: {dateFormatter.format(invitation.invitedAt)}
                    {invitation.expiresAt
                      ? ` · Vence: ${dateFormatter.format(invitation.expiresAt)}`
                      : " · Sin vencimiento"}
                  </p>
                  {invitation.activatedUser && (
                    <p className="mt-1 font-interface text-supporting text-text-secondary">
                      Cuenta:{" "}
                      {invitation.activatedUser.learnerProfile?.displayName ??
                        invitation.activatedUser.name ??
                        invitation.activatedUser.email}
                      {invitation.activatedAt
                        ? ` · Activada ${dateFormatter.format(invitation.activatedAt)}`
                        : ""}
                    </p>
                  )}
                  {invitation.note && (
                    <p className="mt-2 whitespace-pre-wrap font-interface text-supporting text-text-secondary">
                      {invitation.note}
                    </p>
                  )}
                </div>

                {invitation.status === "PENDING" && !expired && (
                  <form
                    action={revokeBetaInvitationAction.bind(
                      null,
                      invitation.id,
                    )}
                  >
                    <button className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border px-3 py-2 font-interface text-supporting text-text-secondary hover:bg-elevated">
                      <Ban className="size-4" aria-hidden="true" /> Revocar
                    </button>
                  </form>
                )}
                {(invitation.status === "REVOKED" || expired) && (
                  <form
                    action={reopenBetaInvitationAction.bind(
                      null,
                      invitation.id,
                    )}
                  >
                    <button className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border px-3 py-2 font-interface text-supporting text-text-secondary hover:bg-elevated">
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Habilitar de nuevo
                    </button>
                  </form>
                )}
              </article>
            );
          })}
          {!data.invitations.length && (
            <p className="p-10 text-center font-interface text-supporting text-text-muted">
              Todavía no hay invitaciones. Crea la primera antes de compartir el
              enlace de la beta.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-panel border border-border bg-surface p-4">
      <p className="font-interface text-caption text-text-muted">{label}</p>
      <p className="mt-1 font-display text-section-title font-semibold">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  expired,
}: {
  status: "PENDING" | "ACTIVATED" | "REVOKED";
  expired: boolean;
}) {
  const config = expired
    ? {
        label: "Vencida",
        icon: Clock3,
        classes: "bg-warning-500/15 text-warning-500",
      }
    : status === "ACTIVATED"
      ? {
          label: "Activada",
          icon: Check,
          classes: "bg-secondary-500/15 text-secondary-400",
        }
      : status === "REVOKED"
        ? {
            label: "Revocada",
            icon: Ban,
            classes: "bg-error-500/15 text-error-500",
          }
        : {
            label: "Pendiente",
            icon: Clock3,
            classes: "bg-info-500/15 text-info-500",
          };
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-interface text-caption font-semibold ${config.classes}`}
    >
      <Icon className="size-3.5" aria-hidden="true" /> {config.label}
    </span>
  );
}
