import Link from "next/link";
import { Search } from "lucide-react";
import { getAdminUsers, type AdminUserStatus } from "@/lib/admin-dashboard";

type SearchParams = Promise<{ q?: string; status?: string; page?: string }>;

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeZone: "America/Bogota",
});

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status: AdminUserStatus = [
    "onboarded",
    "pending",
    "unverified",
  ].includes(params.status ?? "")
    ? (params.status as AdminUserStatus)
    : "all";
  const result = await getAdminUsers({
    query: params.q,
    status,
    page: Number(params.page ?? 1),
  });

  function pageHref(page: number) {
    const next = new URLSearchParams();
    if (params.q) next.set("q", params.q);
    if (status !== "all") next.set("status", status);
    next.set("page", String(page));
    return `/admin/users?${next.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="font-interface text-caption font-semibold uppercase tracking-[0.12em] text-primary-400">
          Comunidad
        </p>
        <h1 className="mt-1 font-display text-page-title font-semibold">
          Usuarios
        </h1>
        <p className="mt-1 font-interface text-supporting text-text-secondary">
          Busca una cuenta y revisa su onboarding, progreso, HanCoins y gasto
          estimado de IA.
        </p>
      </div>

      <form className="grid gap-3 rounded-panel border border-border bg-surface p-4 sm:grid-cols-[1fr_210px_auto]">
        <label className="relative">
          <span className="sr-only">Buscar usuario</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Nombre, correo o nickname"
            className="w-full rounded-control border border-border bg-page py-2 pr-3 pl-10 font-interface text-body outline-none focus:border-primary-500"
          />
        </label>
        <select
          name="status"
          defaultValue={status}
          className="rounded-control border border-border bg-page px-3 py-2 font-interface text-body outline-none focus:border-primary-500"
        >
          <option value="all">Todos los estados</option>
          <option value="onboarded">Onboarding completo</option>
          <option value="pending">Onboarding pendiente</option>
          <option value="unverified">Correo sin verificar</option>
        </select>
        <button className="rounded-control bg-primary-500 px-5 py-2 font-interface text-body font-semibold text-on-color-light hover:bg-primary-600">
          Filtrar
        </button>
      </form>

      <section className="overflow-hidden rounded-panel border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-interface text-card-title font-semibold">
            {result.total} usuarios encontrados
          </h2>
          <span className="font-interface text-caption text-text-muted">
            Página {result.page} de {result.pageCount}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-elevated font-interface text-caption uppercase tracking-[0.08em] text-text-muted">
              <tr>
                <th className="px-5 py-3">Usuario</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Progreso</th>
                <th className="px-4 py-3">HanCoins</th>
                <th className="px-4 py-3">IA este mes</th>
                <th className="px-4 py-3">Último acceso</th>
              </tr>
            </thead>
            <tbody>
              {result.users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-border font-interface text-supporting hover:bg-elevated/60"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="font-semibold text-text-primary hover:text-primary-400"
                    >
                      {user.learnerProfile?.displayName ??
                        user.name ??
                        "Sin nombre"}
                    </Link>
                    <span className="block text-caption text-text-muted">
                      {user.email ?? "Sin correo"}
                      {user.learnerProfile?.nickname
                        ? ` · @${user.learnerProfile.nickname}`
                        : ""}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge
                      verified={Boolean(user.emailVerified)}
                      onboarded={Boolean(
                        user.learnerProfile?.onboardingCompletedAt,
                      )}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold">
                      {Math.round(user.learnerProfile?.generalLevelPoints ?? 0)}{" "}
                      pts
                    </span>
                    <span className="block text-caption text-text-muted">
                      {user.learnerProfile?.currentLevel?.replaceAll(
                        "_",
                        " ",
                      ) ?? "Nivel sin definir"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-accent-300">
                    {user.coinBalance.toLocaleString("es-CO")}
                  </td>
                  <td className="px-4 py-4">
                    ${user.monthAiCostUsd.toFixed(4)}
                  </td>
                  <td className="px-4 py-4 text-text-secondary">
                    {user.lastAccessAt
                      ? dateFormatter.format(user.lastAccessAt)
                      : "Sin registro"}
                  </td>
                </tr>
              ))}
              {!result.users.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center font-interface text-supporting text-text-muted"
                  >
                    No hay usuarios que coincidan con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        {result.page > 1 && (
          <Link
            href={pageHref(result.page - 1)}
            className="rounded-control border border-border-strong px-4 py-2 font-interface text-supporting"
          >
            Anterior
          </Link>
        )}
        {result.page < result.pageCount && (
          <Link
            href={pageHref(result.page + 1)}
            className="rounded-control border border-border-strong px-4 py-2 font-interface text-supporting"
          >
            Siguiente
          </Link>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  verified,
  onboarded,
}: {
  verified: boolean;
  onboarded: boolean;
}) {
  const label = !verified
    ? "Sin verificar"
    : onboarded
      ? "Activo"
      : "En onboarding";
  const color = !verified
    ? "bg-warning-500/15 text-warning-500"
    : onboarded
      ? "bg-secondary-500/15 text-secondary-400"
      : "bg-info-500/15 text-info-500";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-caption font-semibold ${color}`}
    >
      {label}
    </span>
  );
}
