import { randomUUID } from "node:crypto";
import { Archive, Coins, Megaphone } from "lucide-react";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { CoinGrantForm } from "@/components/admin/coin-grant-form";
import { archiveAnnouncementAction } from "@/lib/actions/admin-communications";
import { getAdminCommunications } from "@/lib/admin-communications";

type SearchParams = Promise<{ compose?: string }>;
const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export default async function AdminCommunicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ compose }, data] = await Promise.all([
    searchParams,
    getAdminCommunications(),
  ]);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-interface text-caption font-semibold uppercase tracking-[0.12em] text-primary-400">
            Relación con usuarios
          </p>
          <h1 className="mt-1 font-display text-page-title font-semibold">
            Comunicaciones y recompensas
          </h1>
          <p className="mt-1 max-w-2xl font-interface text-supporting text-text-secondary">
            Publica novedades al iniciar HanGo u otorga HanCoins con un mensaje
            personal y trazabilidad completa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CoinGrantForm
            users={data.users}
            requestId={randomUUID()}
            initialOpen={compose === "coins"}
          />
          <AnnouncementForm initialOpen={compose === "announcement"} />
        </div>
      </div>

      <section className="rounded-panel border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Megaphone className="size-5 text-primary-400" />
          <div>
            <h2 className="font-display text-section-title font-semibold">
              Anuncios
            </h2>
            <p className="font-interface text-caption text-text-muted">
              {data.announcements.length} anuncios entre publicados, borradores
              y archivados
            </p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {data.announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-interface text-card-title font-semibold">
                    {announcement.title}
                  </h3>
                  <Badge>
                    {announcement.status === "PUBLISHED"
                      ? "Publicado"
                      : announcement.status === "DRAFT"
                        ? "Borrador"
                        : "Archivado"}
                  </Badge>
                  <Badge>
                    {announcement.priority === "NORMAL"
                      ? "Normal"
                      : announcement.priority === "IMPORTANT"
                        ? "Importante"
                        : "Urgente"}
                  </Badge>
                  <Badge>
                    {announcement.locale === "ES"
                      ? "Español"
                      : announcement.locale === "EN"
                        ? "English"
                        : "Todos los idiomas"}
                  </Badge>
                </div>
                <p className="mt-2 max-w-3xl whitespace-pre-wrap font-interface text-supporting text-text-secondary">
                  {announcement.message}
                </p>
                <p className="mt-3 font-interface text-caption text-text-muted">
                  Inicio: {dateFormatter.format(announcement.startsAt)}
                  {announcement.endsAt
                    ? ` · Fin: ${dateFormatter.format(announcement.endsAt)}`
                    : " · Sin fecha de fin"}{" "}
                  · Mostrado a {announcement.shownCount} · Confirmado por{" "}
                  {announcement.acknowledgedCount}
                </p>
              </div>
              {announcement.status !== "ARCHIVED" && (
                <form
                  action={archiveAnnouncementAction.bind(null, announcement.id)}
                >
                  <button className="inline-flex items-center gap-2 rounded-control border border-border px-3 py-2 font-interface text-supporting text-text-secondary hover:bg-elevated">
                    <Archive className="size-4" /> Archivar
                  </button>
                </form>
              )}
            </article>
          ))}
          {!data.announcements.length && (
            <Empty text="Todavía no has creado anuncios." />
          )}
        </div>
      </section>

      <section className="rounded-panel border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Coins className="size-5 text-accent-300" />
          <div>
            <h2 className="font-display text-section-title font-semibold">
              HanCoins otorgados
            </h2>
            <p className="font-interface text-caption text-text-muted">
              Historial administrativo inmutable
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left font-interface text-supporting">
            <thead className="bg-elevated text-caption uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Mensaje</th>
                <th className="px-4 py-3">Nota interna</th>
              </tr>
            </thead>
            <tbody>
              {data.grants.map((grant) => (
                <tr key={grant.id} className="border-t border-border">
                  <td className="px-5 py-4 text-text-secondary">
                    {dateFormatter.format(grant.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold">
                      {grant.recipient.learnerProfile?.displayName ??
                        grant.recipient.name ??
                        grant.recipient.email}
                    </span>
                    <span className="block text-caption text-text-muted">
                      {grant.recipient.email}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-accent-300">
                    +{grant.amount.toLocaleString("es-CO")}
                  </td>
                  <td className="max-w-sm px-4 py-4">{grant.message}</td>
                  <td className="max-w-xs px-4 py-4 text-text-muted">
                    {grant.internalNote ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.grants.length && (
            <Empty text="Todavía no has otorgado HanCoins manualmente." />
          )}
        </div>
      </section>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-elevated px-2.5 py-1 font-interface text-caption font-semibold text-text-secondary">
      {children}
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="p-8 text-center font-interface text-supporting text-text-muted">
      {text}
    </p>
  );
}
