import Link from "next/link";
import { MessageSquareText, Star } from "lucide-react";
import { FeedbackReviewForm } from "@/components/admin/feedback-review-form";
import {
  BETA_FEEDBACK_STATUSES,
  getAdminBetaFeedback,
  type BetaFeedbackCategory,
  type BetaFeedbackStatus,
} from "@/lib/beta-feedback";

type SearchParams = Promise<{ status?: string }>;

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

const statusLabels: Record<BetaFeedbackStatus, string> = {
  NEW: "Nuevo",
  REVIEWING: "Revisando",
  RESOLVED: "Resuelto",
};

const categoryLabels: Record<BetaFeedbackCategory, string> = {
  BUG: "Error",
  IDEA: "Idea",
  CONFUSING: "Confuso",
  LESSON_CONTENT: "Contenido de lección",
  HAN: "Han / práctica oral",
  OTHER: "Otro",
};

function parseStatus(
  value: string | undefined,
): BetaFeedbackStatus | undefined {
  return BETA_FEEDBACK_STATUSES.includes(value as BetaFeedbackStatus)
    ? (value as BetaFeedbackStatus)
    : undefined;
}

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status: rawStatus } = await searchParams;
  const status = parseStatus(rawStatus);
  const data = await getAdminBetaFeedback(status);

  return (
    <div className="flex flex-col gap-7">
      <header>
        <p className="font-interface text-caption font-semibold uppercase tracking-[0.12em] text-primary-400">
          Voz de la cohorte
        </p>
        <h1 className="mt-1 font-display text-page-title font-semibold">
          Feedback de la beta
        </h1>
        <p className="mt-1 max-w-3xl font-interface text-supporting text-text-secondary">
          Reportes enviados desde cualquier pantalla de HanGo, con ruta, idioma
          y seguimiento visible para el usuario.
        </p>
      </header>

      <nav aria-label="Filtrar feedback" className="flex flex-wrap gap-2">
        <FilterLink href="/admin/feedback" active={!status}>
          Todos (
          {data.counts.NEW + data.counts.REVIEWING + data.counts.RESOLVED})
        </FilterLink>
        {BETA_FEEDBACK_STATUSES.map((value) => (
          <FilterLink
            key={value}
            href={`/admin/feedback?status=${value}`}
            active={status === value}
          >
            {statusLabels[value]} ({data.counts[value]})
          </FilterLink>
        ))}
      </nav>

      <section className="flex flex-col gap-4">
        {data.items.map((item) => {
          const author =
            item.user.learnerProfile?.displayName ??
            item.user.name ??
            item.user.email ??
            "Usuario sin nombre";
          return (
            <article
              key={item.id}
              className="rounded-panel border border-border bg-surface p-5"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{statusLabels[item.status]}</Badge>
                      <Badge>{categoryLabels[item.category]}</Badge>
                      <Badge>
                        {item.locale === "ES" ? "Español" : "English"}
                      </Badge>
                      {item.rating && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-300/15 px-2.5 py-1 font-interface text-caption font-semibold text-accent-300">
                          <Star
                            className="size-3.5 fill-current"
                            aria-hidden="true"
                          />
                          {item.rating}/5
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/admin/users/${item.user.id}`}
                      className="mt-3 block w-fit font-interface text-body font-semibold text-text-primary hover:underline"
                    >
                      {author}
                    </Link>
                    <p className="font-interface text-caption text-text-muted">
                      {item.user.email ?? "Sin correo"} ·{" "}
                      {dateFormatter.format(item.createdAt)}
                    </p>
                  </div>
                  <code className="max-w-full break-all rounded-control bg-elevated px-2.5 py-1.5 font-mono text-caption text-text-secondary">
                    {item.path}
                  </code>
                </div>

                <p className="whitespace-pre-wrap font-interface text-body text-text-primary">
                  {item.message}
                </p>

                <FeedbackReviewForm
                  feedbackId={item.id}
                  status={item.status}
                  adminResponse={item.adminResponse}
                  internalNote={item.internalNote}
                />
              </div>
            </article>
          );
        })}
        {!data.items.length && (
          <div className="rounded-panel border border-dashed border-border bg-surface p-10 text-center">
            <MessageSquareText
              className="mx-auto size-8 text-text-muted"
              aria-hidden="true"
            />
            <p className="mt-3 font-interface text-supporting text-text-muted">
              No hay reportes en este filtro.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-2 font-interface text-supporting font-semibold transition-colors ${
        active
          ? "bg-primary-500 text-on-color-light"
          : "border border-border bg-surface text-text-secondary hover:bg-elevated"
      }`}
    >
      {children}
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-elevated px-2.5 py-1 font-interface text-caption font-semibold text-text-secondary">
      {children}
    </span>
  );
}
