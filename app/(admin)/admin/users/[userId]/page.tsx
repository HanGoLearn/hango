import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Coins,
  MessageCircle,
  Mic2,
  PenLine,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { getAdminUserDetail } from "@/lib/admin-dashboard";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const detail = await getAdminUserDetail(userId);
  if (!detail) notFound();
  const { user } = detail;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/users"
          className="mb-3 inline-flex items-center gap-2 font-interface text-supporting text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="size-4" /> Volver a usuarios
        </Link>
        <h1 className="font-display text-page-title font-semibold">
          {user.learnerProfile?.displayName ??
            user.name ??
            "Usuario sin nombre"}
        </h1>
        <p className="font-interface text-supporting text-text-secondary">
          {user.email ?? "Sin correo"}
          {user.learnerProfile?.nickname
            ? ` · @${user.learnerProfile.nickname}`
            : ""}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="HanCoins"
          value={detail.coinBalance.toLocaleString("es-CO")}
          detail="Saldo actual del ledger"
          icon={<Coins className="size-5" />}
        />
        <AdminStatCard
          label="Progreso"
          value={`${Math.round(user.learnerProfile?.generalLevelPoints ?? 0)} pts`}
          detail={
            user.learnerProfile?.currentLevel?.replaceAll("_", " ") ??
            "Nivel sin definir"
          }
          icon={<BookOpen className="size-5" />}
        />
        <AdminStatCard
          label="Costo IA del mes"
          value={`$${detail.monthAiCostUsd.toFixed(4)}`}
          detail={`${detail.monthAiCalls} solicitudes`}
          icon={<MessageCircle className="size-5" />}
        />
        <AdminStatCard
          label="Actividad completada"
          value={
            user._count.lessonCompletions + user._count.scenarioCompletions
          }
          detail={`${user._count.lessonCompletions} lecciones · ${user._count.scenarioCompletions} escenarios`}
          icon={<BookOpen className="size-5" />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Perfil y aprendizaje
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 font-interface text-supporting">
            <Info
              label="Registro"
              value={dateFormatter.format(user.createdAt)}
            />
            <Info
              label="Correo"
              value={user.emailVerified ? "Verificado" : "Sin verificar"}
            />
            <Info
              label="Onboarding"
              value={
                user.learnerProfile?.onboardingCompletedAt
                  ? "Completo"
                  : "Pendiente"
              }
            />
            <Info
              label="Meta diaria"
              value={
                user.learnerProfile?.dailyStudyTargetMinutes
                  ? `${user.learnerProfile.dailyStudyTargetMinutes} min`
                  : "Sin definir"
              }
            />
            <Info
              label="Speaking Lab"
              value={`${user._count.speakingSessions} sesiones`}
              icon={<Mic2 className="size-4" />}
            />
            <Info
              label="Writing Lab"
              value={`${user._count.writingAttempts} intentos`}
              icon={<PenLine className="size-4" />}
            />
          </dl>
        </div>
        <div className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Movimientos recientes
          </h2>
          <div className="mt-3 grid gap-2">
            {detail.recentCoins.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-control bg-elevated px-3 py-2 font-interface text-supporting"
              >
                <span>{entry.reason.replaceAll("_", " ")}</span>
                <span
                  className={
                    entry.amount >= 0
                      ? "text-secondary-400"
                      : "text-primary-400"
                  }
                >
                  {entry.amount > 0 ? "+" : ""}
                  {entry.amount}
                </span>
              </div>
            ))}
            {!detail.recentCoins.length && (
              <p className="py-4 font-interface text-supporting text-text-muted">
                No hay movimientos.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-panel border border-border bg-surface p-5">
        <h2 className="font-display text-section-title font-semibold">
          Uso reciente de IA
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left font-interface text-supporting">
            <thead className="text-caption uppercase text-text-muted">
              <tr>
                <th className="py-2">Fecha</th>
                <th>Función</th>
                <th>Modelo</th>
                <th className="text-right">Costo</th>
              </tr>
            </thead>
            <tbody>
              {detail.recentAi.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="py-3">
                    {dateFormatter.format(entry.createdAt)}
                  </td>
                  <td>{entry.feature}</td>
                  <td className="text-text-secondary">{entry.model}</td>
                  <td className="text-right">
                    ${entry.estimatedCostUsd.toFixed(5)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!detail.recentAi.length && (
            <p className="py-4 font-interface text-supporting text-text-muted">
              No hay consumo de IA registrado.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-caption uppercase tracking-wide text-text-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-medium text-text-primary">{value}</dd>
    </div>
  );
}
