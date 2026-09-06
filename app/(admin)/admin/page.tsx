import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Coins,
  DollarSign,
  Megaphone,
  UserPlus,
  Users,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { getAdminOverview } from "@/lib/admin-dashboard";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

function usd(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);
}

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-interface text-caption font-semibold uppercase tracking-[0.12em] text-primary-400">
            Estado del producto
          </p>
          <h1 className="mt-1 font-display text-page-title font-semibold">
            Resumen ejecutivo
          </h1>
          <p className="mt-1 max-w-2xl font-interface text-supporting text-text-secondary">
            Usuarios, aprendizaje, economía y consumo de IA en una sola vista.
          </p>
        </div>
        <p className="font-interface text-caption text-text-muted">
          Actualizado {dateFormatter.format(overview.generatedAt)}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Usuarios registrados"
          value={overview.users.total}
          detail={`${overview.users.verified} con correo verificado`}
          icon={<Users className="size-5" aria-hidden="true" />}
        />
        <AdminStatCard
          label="Nuevos usuarios"
          value={overview.users.newSevenDays}
          detail={`${overview.users.newToday} hoy · ${overview.users.newThirtyDays} en 30 días`}
          icon={<UserPlus className="size-5" aria-hidden="true" />}
        />
        <AdminStatCard
          label="Activos hoy"
          value={overview.users.activeToday}
          detail={`${overview.users.activeSevenDays} accedieron en 7 días`}
          icon={<Activity className="size-5" aria-hidden="true" />}
        />
        <AdminStatCard
          label="Costo IA del mes"
          value={usd(overview.ai.monthCostUsd)}
          detail={`${overview.ai.monthCalls} solicitudes · hoy ${usd(overview.ai.todayCostUsd)}`}
          icon={<DollarSign className="size-5" aria-hidden="true" />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-panel border border-border bg-surface p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-section-title font-semibold">
                Actividad de aprendizaje hoy
              </h2>
              <p className="font-interface text-caption text-text-muted">
                Acciones completadas, separadas por sistema.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Lecciones", overview.activityToday.lessons],
              ["Escenarios", overview.activityToday.scenarios],
              ["Speaking Lab", overview.activityToday.speaking],
              ["Writing Lab", overview.activityToday.writing],
            ].map(([label, value]) => (
              <div key={label} className="rounded-card bg-elevated p-4">
                <p className="font-display text-section-title font-semibold">
                  {value}
                </p>
                <p className="font-interface text-caption text-text-secondary">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2 font-interface text-supporting text-text-secondary">
              <Coins className="size-4 text-accent-300" aria-hidden="true" />
              <span>
                {overview.economy.circulation.toLocaleString("es-CO")} HanCoins
                en circulación
              </span>
            </div>
            <div className="font-interface text-supporting text-text-secondary">
              {overview.users.onboarded} usuarios completaron onboarding
            </div>
          </div>
        </div>

        <div className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Acciones rápidas
          </h2>
          <div className="mt-4 grid gap-3">
            <Link
              href="/admin/communications?compose=announcement"
              className="group flex items-center justify-between rounded-card border border-border bg-elevated p-4 transition-colors hover:border-primary-500"
            >
              <span className="flex items-center gap-3 font-interface text-supporting font-semibold">
                <Megaphone
                  className="size-5 text-primary-400"
                  aria-hidden="true"
                />
                Publicar un anuncio
              </span>
              <ArrowRight className="size-4 text-text-muted transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/admin/communications?compose=coins"
              className="group flex items-center justify-between rounded-card border border-border bg-elevated p-4 transition-colors hover:border-accent-500"
            >
              <span className="flex items-center gap-3 font-interface text-supporting font-semibold">
                <Coins className="size-5 text-accent-300" aria-hidden="true" />
                Otorgar HanCoins
              </span>
              <ArrowRight className="size-4 text-text-muted transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <AdminList
          title="Mayor progreso"
          empty="Aún no hay progreso registrado."
        >
          {overview.topProgress.map((learner, index) => (
            <Link
              key={learner.id}
              href={`/admin/users/${learner.id}`}
              className="flex items-center justify-between gap-3 rounded-control px-2 py-2 hover:bg-elevated"
            >
              <span className="min-w-0 font-interface text-supporting">
                <span className="mr-2 text-text-muted">#{index + 1}</span>
                <span className="font-medium">{learner.name}</span>
              </span>
              <span className="shrink-0 font-interface text-caption text-accent-300">
                {Math.round(learner.points)} pts
              </span>
            </Link>
          ))}
        </AdminList>

        <AdminList
          title="Mayor consumo IA · 30 días"
          empty="Aún no hay consumo registrado."
        >
          {overview.topAiUsers.map((learner) => (
            <Link
              key={learner.id}
              href={`/admin/users/${learner.id}`}
              className="flex items-center justify-between gap-3 rounded-control px-2 py-2 hover:bg-elevated"
            >
              <span className="min-w-0 truncate font-interface text-supporting font-medium">
                {learner.name}
              </span>
              <span className="shrink-0 text-right font-interface text-caption text-text-secondary">
                {usd(learner.costUsd)}
                <br />
                {learner.calls} solicitudes
              </span>
            </Link>
          ))}
        </AdminList>

        <AdminList
          title="Registros recientes"
          empty="Aún no hay usuarios registrados."
        >
          {overview.latestUsers.map((user) => (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-control px-2 py-2 hover:bg-elevated"
            >
              <span className="min-w-0">
                <span className="block truncate font-interface text-supporting font-medium">
                  {user.name ?? user.email ?? "Sin nombre"}
                </span>
                <span className="block font-interface text-caption text-text-muted">
                  {user.learnerProfile?.onboardingCompletedAt
                    ? "Onboarding completo"
                    : "Onboarding pendiente"}
                </span>
              </span>
              <span className="whitespace-nowrap text-right font-interface text-caption text-text-muted">
                {dateFormatter.format(user.createdAt)}
              </span>
            </Link>
          ))}
        </AdminList>
      </section>
    </div>
  );
}

function AdminList({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : Boolean(children);
  return (
    <section className="min-w-0 overflow-hidden rounded-panel border border-border bg-surface p-5">
      <h2 className="font-display text-section-title font-semibold">{title}</h2>
      <div className="mt-3 grid min-w-0 gap-1">
        {hasChildren ? (
          children
        ) : (
          <p className="py-4 font-interface text-supporting text-text-muted">
            {empty}
          </p>
        )}
      </div>
    </section>
  );
}
