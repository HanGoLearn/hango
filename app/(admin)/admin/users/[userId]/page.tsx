import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Bot,
  CalendarDays,
  Coins,
  Mic2,
  PenLine,
  ShieldBan,
  Target,
  Trophy,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { UserAiUsageLimits } from "@/components/admin/user-ai-usage-limits";
import { getAdminUserDetail } from "@/lib/admin-dashboard";
import { getUserAiUsageLimits } from "@/lib/admin-ai-usage";

const dateFormatter = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

const integerFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

const PROFILE_LABELS: Record<string, string> = {
  EN: "Inglés",
  ES: "Español",
  ZH: "Chino",
  IMMEDIATE: "Corrección inmediata",
  AFTER_CONVERSATION: "Después de conversar",
  ONLY_IMPORTANT: "Solo lo importante",
  SHORT: "Explicaciones breves",
  DETAILED: "Explicaciones detalladas",
  FRIENDLY: "Amigable",
  PROFESSIONAL: "Profesional",
  STRICT_TEACHER: "Tutor estricto",
};

function formatUsd(value: number): string {
  return `$${value.toFixed(value < 1 ? 4 : 2)}`;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0 min";
  if (seconds < 60) return "<1 min";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
}

function formatProfileValue(value: string | null | undefined): string {
  if (!value) return "Sin definir";
  return PROFILE_LABELS[value] ?? value.replaceAll("_", " ").toLowerCase();
}

function formatProfileList(values: string[] | undefined): string {
  if (!values?.length) return "Sin definir";
  return values.map(formatProfileValue).join(", ");
}

function formatAiEvidence(entry: {
  calculationMethod: "TOKEN_RATES" | "PER_MINUTE" | "LEGACY_ESTIMATE";
  inputTokens: number | null;
  outputTokens: number | null;
  inputRateUsdPerMillionTokens: number | null;
  outputRateUsdPerMillionTokens: number | null;
  audioRateUsdPerMinute: number | null;
  durationSeconds: number | null;
  durationSource: string | null;
}): string {
  if (entry.calculationMethod === "PER_MINUTE") {
    const duration = entry.durationSeconds
      ? `${(entry.durationSeconds / 60).toFixed(2)} min`
      : "duración no disponible";
    const rate = entry.audioRateUsdPerMinute
      ? ` · $${entry.audioRateUsdPerMinute.toFixed(4)}/min`
      : "";
    const source = entry.durationSource
      ? ` · ${formatProfileValue(entry.durationSource)}`
      : "";
    return `${duration}${rate}${source}`;
  }
  if (entry.calculationMethod === "TOKEN_RATES") {
    const tokens = `${integerFormatter.format(entry.inputTokens ?? 0)} entrada · ${integerFormatter.format(entry.outputTokens ?? 0)} salida`;
    const rate =
      entry.inputRateUsdPerMillionTokens !== null &&
      entry.outputRateUsdPerMillionTokens !== null
        ? ` · $${entry.inputRateUsdPerMillionTokens}/$${entry.outputRateUsdPerMillionTokens} por M`
        : "";
    return `${tokens}${rate}`;
  }
  return "Estimación histórica sin desglose de tarifa";
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const [detail, userAiLimits] = await Promise.all([
    getAdminUserDetail(userId),
    getUserAiUsageLimits(userId),
  ]);
  if (!detail) notFound();
  const { user } = detail;
  const profile = user.learnerProfile;
  const latestPlacement = detail.learning.latestPlacement;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/users"
          className="mb-3 inline-flex items-center gap-2 font-interface text-supporting text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="size-4" /> Volver a usuarios
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-interface text-caption font-semibold uppercase tracking-[0.12em] text-primary-400">
              Vista operativa 360°
            </p>
            <h1 className="mt-1 break-words font-display text-page-title font-semibold">
              {profile?.displayName ?? user.name ?? "Usuario sin nombre"}
            </h1>
            <p className="break-all font-interface text-supporting text-text-secondary">
              {user.email ?? "Sin correo"}
              {profile?.nickname ? ` · @${profile.nickname}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 font-interface text-caption">
            <Link
              href="#ai-user-limits"
              className="inline-flex items-center gap-1.5 rounded-full border border-warning-500/30 bg-warning-500/10 px-3 py-1 font-semibold text-warning-500 transition-colors hover:bg-warning-500/15"
            >
              <ShieldBan className="size-3.5" aria-hidden="true" />
              Limitar IA
            </Link>
            <StatusPill
              active={Boolean(user.emailVerified)}
              activeText="Correo verificado"
              inactiveText="Correo pendiente"
            />
            <StatusPill
              active={Boolean(profile?.onboardingCompletedAt)}
              activeText="Onboarding completo"
              inactiveText="Onboarding pendiente"
            />
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Actividad real · 30 días"
          value={formatDuration(detail.activity.thirtyDaySeconds)}
          detail={`${detail.activity.activeDaysThirty} días activos · ${detail.activity.thirtyDaySessions} sesiones`}
          icon={<Activity className="size-5" />}
        />
        <AdminStatCard
          label="Racha de estudio"
          value={`${detail.learning.streak.currentStreak} días`}
          detail={
            detail.learning.streak.activeToday
              ? "Registró aprendizaje hoy"
              : "Aún no registra aprendizaje hoy"
          }
          icon={<CalendarDays className="size-5" />}
        />
        <AdminStatCard
          label="Costo IA del mes"
          value={formatUsd(detail.monthAiCostUsd)}
          detail={`${detail.monthAiCalls} solicitudes registradas`}
          icon={<Bot className="size-5" />}
        />
        <AdminStatCard
          label="HanCoins"
          value={detail.coinBalance.toLocaleString("es-CO")}
          detail={`${detail.coinsEarned} obtenidos · ${detail.coinsSpent} gastados`}
          icon={<Coins className="size-5" />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Perfil y preferencias de aprendizaje
          </h2>
          <dl className="mt-4 grid gap-4 font-interface text-supporting sm:grid-cols-2 xl:grid-cols-3">
            <Info
              label="Registro"
              value={dateFormatter.format(user.createdAt)}
            />
            <Info
              label="Última actividad real"
              value={
                detail.activity.lastActiveAt
                  ? dateFormatter.format(detail.activity.lastActiveAt)
                  : "Aún sin actividad medida"
              }
            />
            <Info
              label="Meta diaria"
              value={
                profile?.dailyStudyTargetMinutes
                  ? `${profile.dailyStudyTargetMinutes} min`
                  : "Sin definir"
              }
            />
            <Info
              label="Nivel declarado"
              value={formatProfileValue(profile?.currentLevel)}
            />
            <Info
              label="Nivel demostrado"
              value={`${detail.learning.levelLabel} · ${Math.round(profile?.generalLevelPoints ?? 0)} pts`}
            />
            <Info
              label="Avatar"
              value={user.avatar?.animal ?? "Sin personaje"}
            />
            <Info
              label="Idioma de interfaz"
              value={formatProfileValue(profile?.interfaceLanguage)}
            />
            <Info
              label="Idioma de explicación"
              value={formatProfileValue(profile?.explanationLanguage)}
            />
            <Info
              label="Estilo de corrección"
              value={formatProfileValue(profile?.correctionStyle)}
            />
            <Info
              label="Estilo de explicación"
              value={formatProfileValue(profile?.explanationStyle)}
            />
            <Info
              label="Estilo de conversación"
              value={formatProfileValue(profile?.conversationStyle)}
            />
            <Info
              label="Prioridades"
              value={formatProfileList(profile?.skillPriorities)}
            />
            <Info
              label="Objetivos"
              value={formatProfileList(profile?.learningGoals)}
              wide
            />
          </dl>
        </div>

        <div className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Resumen de aprendizaje
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="Lecciones" value={user._count.lessonCompletions} />
            <Metric
              label="Escenarios"
              value={user._count.scenarioCompletions}
            />
            <Metric
              label="Speaking Lab"
              value={`${detail.learning.completedSpeaking}/${user._count.speakingSessions}`}
              note="completadas/totales"
              icon={<Mic2 className="size-4" />}
            />
            <Metric
              label="Writing Lab"
              value={`${detail.learning.submittedWriting}/${user._count.writingAttempts}`}
              note="enviados/totales"
              icon={<PenLine className="size-4" />}
            />
            <Metric
              label="Missions"
              value={`${detail.learning.completedMissions}/${user._count.missionAttempts}`}
              note="completadas/totales"
              icon={<Target className="size-4" />}
            />
            <Metric
              label="Quizzes"
              value={detail.learning.completedQuizzes}
              note={
                detail.learning.averageQuizScore === null
                  ? "sin promedio"
                  : `${Math.round(detail.learning.averageQuizScore)}% promedio`
              }
            />
            <Metric
              label="Vocabulario explorado"
              value={user._count.vocabularyInteractions}
            />
            <Metric
              label="Logros"
              value={user._count.achievements}
              icon={<Trophy className="size-4" />}
            />
          </div>
        </div>
      </section>

      <section className="rounded-panel border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-section-title font-semibold">
            Actividad por experiencia · últimos 30 días
          </h2>
          <p className="mt-1 font-interface text-caption text-text-muted">
            Tiempo visible con interacción reciente. No representa minutos de
            audio facturados ni actividades completadas.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left font-interface text-supporting">
            <thead className="bg-elevated text-caption uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-5 py-3">Experiencia</th>
                <th className="px-5 py-3">Tiempo activo</th>
                <th className="px-5 py-3 text-right">Sesiones</th>
                <th className="px-5 py-3 text-right">Interacciones</th>
                <th className="px-5 py-3">Última actividad</th>
              </tr>
            </thead>
            <tbody>
              {detail.activity.bySurface.map((surface) => (
                <tr key={surface.surface} className="border-t border-border">
                  <td className="px-5 py-3 font-semibold">{surface.label}</td>
                  <td className="px-5 py-3">
                    {formatDuration(surface.activeSeconds)}
                  </td>
                  <td className="px-5 py-3 text-right">{surface.sessions}</td>
                  <td className="px-5 py-3 text-right">
                    {surface.interactions}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {surface.lastActiveAt
                      ? dateFormatter.format(surface.lastActiveAt)
                      : "Sin uso medido"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 border-t border-border px-5 py-4 font-interface text-caption text-text-muted sm:grid-cols-3">
          <span>
            Total histórico: {formatDuration(detail.activity.allTimeSeconds)}
          </span>
          <span>{detail.activity.allTimeSessions} sesiones históricas</span>
          <span>{detail.activity.allTimeInteractions} interacciones</span>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Placement más reciente
          </h2>
          {latestPlacement ? (
            <>
              <p className="mt-1 font-interface text-caption text-text-muted">
                {latestPlacement.status === "COMPLETED"
                  ? `Completado ${dateFormatter.format(latestPlacement.completedAt ?? latestPlacement.startedAt)}`
                  : `En progreso desde ${dateFormatter.format(latestPlacement.startedAt)}`}
                {` · ${latestPlacement._count.attempts} respuestas`}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric
                  label="Vocabulario"
                  value={placementLevel(latestPlacement.vocabularyHskLevel)}
                />
                <Metric
                  label="Gramática"
                  value={placementLevel(latestPlacement.grammarHskLevel)}
                />
                <Metric
                  label="Lectura"
                  value={placementLevel(latestPlacement.readingHskLevel)}
                />
                <Metric
                  label="Escucha"
                  value={placementLevel(latestPlacement.listeningHskLevel)}
                />
              </div>
            </>
          ) : (
            <EmptyState text="No ha iniciado un examen de ubicación." />
          )}
        </div>

        <div className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Logros recientes
          </h2>
          <div className="mt-3 grid gap-2">
            {detail.learning.recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex min-w-0 items-center justify-between gap-4 rounded-control bg-elevated px-3 py-2 font-interface text-supporting"
              >
                <span className="min-w-0 truncate font-medium">
                  {achievement.title}
                </span>
                <span className="shrink-0 text-caption text-text-muted">
                  {dateFormatter.format(achievement.unlockedAt)}
                </span>
              </div>
            ))}
            {!detail.learning.recentAchievements.length && (
              <EmptyState text="Aún no ha desbloqueado logros." />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-panel border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-section-title font-semibold">
            Costo de IA por función · este mes
          </h2>
          <p className="mt-1 font-interface text-caption text-text-muted">
            Estimación interna del usuario. Tokens y minutos solo aparecen
            cuando esa unidad aplica y fue registrada.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left font-interface text-supporting">
            <thead className="bg-elevated text-caption uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-5 py-3">Función</th>
                <th className="px-5 py-3 text-right">Solicitudes</th>
                <th className="px-5 py-3 text-right">Tokens</th>
                <th className="px-5 py-3 text-right">Audio</th>
                <th className="px-5 py-3 text-right">Costo</th>
              </tr>
            </thead>
            <tbody>
              {detail.aiByFeature.map((row) => (
                <tr key={row.feature} className="border-t border-border">
                  <td className="px-5 py-3">
                    <span className="block font-semibold">{row.label}</span>
                    <span className="text-caption text-text-muted">
                      {row.feature}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">{row.calls}</td>
                  <td className="px-5 py-3 text-right">
                    {row.inputTokens || row.outputTokens
                      ? `${integerFormatter.format(row.inputTokens)} / ${integerFormatter.format(row.outputTokens)}`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {row.durationSeconds
                      ? `${(row.durationSeconds / 60).toFixed(2)} min`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">
                    {formatUsd(row.costUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!detail.aiByFeature.length && (
            <div className="px-5 py-5">
              <EmptyState text="No hay consumo de IA registrado este mes." />
            </div>
          )}
        </div>
      </section>

      <UserAiUsageLimits userId={user.id} rows={userAiLimits} />

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Movimientos recientes de HanCoins
          </h2>
          <div className="mt-3 grid gap-2">
            {detail.recentCoins.map((entry) => (
              <div
                key={entry.id}
                className="flex min-w-0 items-center justify-between gap-4 rounded-control bg-elevated px-3 py-2 font-interface text-supporting"
              >
                <div className="min-w-0">
                  <span className="block truncate">
                    {entry.reason.replaceAll("_", " ")}
                  </span>
                  <span className="text-caption text-text-muted">
                    {dateFormatter.format(entry.createdAt)}
                  </span>
                </div>
                <span
                  className={`shrink-0 font-semibold ${
                    entry.amount >= 0
                      ? "text-secondary-400"
                      : "text-primary-400"
                  }`}
                >
                  {entry.amount > 0 ? "+" : ""}
                  {entry.amount}
                </span>
              </div>
            ))}
            {!detail.recentCoins.length && (
              <EmptyState text="No hay movimientos." />
            )}
          </div>
        </div>

        <div className="rounded-panel border border-border bg-surface p-5">
          <h2 className="font-display text-section-title font-semibold">
            Uso reciente de IA
          </h2>
          <div className="mt-3 grid gap-2">
            {detail.recentAi.map((entry) => (
              <div
                key={entry.id}
                className="rounded-control bg-elevated px-3 py-2 font-interface text-supporting"
              >
                <div className="flex min-w-0 justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">
                    {entry.label}
                  </span>
                  <span className="shrink-0 font-semibold">
                    {formatUsd(entry.estimatedCostUsd)}
                  </span>
                </div>
                <p className="mt-1 break-words text-caption text-text-muted">
                  {entry.provider} · {entry.model} · {formatAiEvidence(entry)}
                </p>
                <p className="mt-1 text-caption text-text-muted">
                  {dateFormatter.format(entry.createdAt)}
                </p>
              </div>
            ))}
            {!detail.recentAi.length && (
              <EmptyState text="No hay consumo de IA registrado." />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-panel border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-section-title font-semibold">
              Historial reciente compartido de Han
            </h2>
            <p className="mt-1 max-w-3xl font-interface text-caption text-text-muted">
              La conversación textual de Han Tutor y Han Companion se guarda
              actualmente en un mismo hilo. Por eso estos mensajes no se
              atribuyen a uno de los dos. Las conversaciones de práctica oral y
              Speaking Lab se excluyen de esta vista.
            </p>
          </div>
          <span className="rounded-full bg-elevated px-3 py-1 font-interface text-caption text-text-secondary">
            {detail.hanHistory.storedMessageCount} mensajes guardados
          </span>
        </div>

        {!detail.hanHistory.storageEnabled && (
          <p className="mt-4 rounded-control border border-accent-500/30 bg-accent-500/10 px-3 py-2 font-interface text-supporting text-accent-200">
            El usuario desactivó el almacenamiento. Solo podrían existir
            mensajes anteriores a esa decisión.
          </p>
        )}

        {detail.hanHistory.recentMessages.length ? (
          <details className="mt-4 rounded-control border border-border bg-elevated">
            <summary className="cursor-pointer px-4 py-3 font-interface text-supporting font-semibold">
              Mostrar los últimos mensajes de texto
            </summary>
            <div className="grid gap-3 border-t border-border p-4">
              {detail.hanHistory.recentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[90%] rounded-control px-3 py-2 font-interface text-supporting ${
                    message.role === "USER"
                      ? "justify-self-end bg-primary-500/15"
                      : "justify-self-start bg-surface"
                  }`}
                >
                  <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
                    {message.role === "USER" ? "Usuario" : "Han"} ·{" "}
                    {dateFormatter.format(message.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-text-primary">
                    {message.content}
                  </p>
                </div>
              ))}
            </div>
          </details>
        ) : (
          <EmptyState text="No hay mensajes de texto recientes para mostrar." />
        )}
      </section>
    </div>
  );
}

function placementLevel(value: number | null): string {
  if (value === null) return "Sin resultado";
  return value === 0 ? "Inicio" : `HSK ${value}`;
}

function StatusPill({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 ${
        active
          ? "border-secondary-500/30 bg-secondary-500/10 text-secondary-300"
          : "border-accent-500/30 bg-accent-500/10 text-accent-200"
      }`}
    >
      {active ? activeText : inactiveText}
    </span>
  );
}

function Info({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2 xl:col-span-3" : undefined}>
      <dt className="text-caption uppercase tracking-wide text-text-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words font-medium text-text-primary">
        {value}
      </dd>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string | number;
  note?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-control bg-elevated p-3 font-interface">
      <p className="flex items-center gap-1 text-caption uppercase tracking-wide text-text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-section-title font-semibold text-text-primary">
        {value}
      </p>
      {note && <p className="text-caption text-text-muted">{note}</p>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-4 font-interface text-supporting text-text-muted">
      {text}
    </p>
  );
}
