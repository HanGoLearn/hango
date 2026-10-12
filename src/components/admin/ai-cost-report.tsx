import {
  buildAdminAiCostReport,
  type AdminAiCostGroup,
  type AdminAiCostRow,
} from "@/lib/admin-ai-cost-report";
import {
  aiFeatureDescriptor,
  FEATURE_LABELS,
  type AiUsageFeature,
} from "@/lib/ai-feature-catalog";
import {
  isRealtimeUsageFeature,
  REALTIME_SESSION_ESTIMATE_USD,
} from "@/lib/realtime-usage";
import { AiInteractionCost } from "@/components/admin/ai-interaction-cost";
import { experienceLimitKey, isAiExperience } from "@/lib/ai-experiences";

function usd(value: number) {
  return `US$${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(value)}`;
}
function reference(group: AdminAiCostGroup) {
  if (
    [
      "HAN_TUTOR",
      "HAN_COMPANION",
      "JOURNEY_SPEAKING",
      "SPEAKING_LAB",
      "PLACEMENT",
    ].includes(group.id)
  )
    return `Voz: US$${REALTIME_SESSION_ESTIMATE_USD.toFixed(2)}/sesión; otras operaciones: costo variable`;
  if (isRealtimeUsageFeature(group.id))
    return `US$${REALTIME_SESSION_ESTIMATE_USD.toFixed(2)}/sesión (estimado)`;
  if (group.id === "HAN_VOCABULARY")
    return "~US$0.0007/búsqueda nueva; caché sin llamada IA";
  if (group.section === "SHARED_CONTENT")
    return "Solo generación nueva; reproducción: sin llamada IA";
  return group.calls > 0
    ? `${usd(group.costUsd / group.calls)}/operación (promedio)`
    : "Variable; sin uso registrado";
}
function GroupTable({ groups }: { groups: AdminAiCostGroup[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[750px] text-left font-interface text-supporting">
        <thead className="bg-elevated text-caption uppercase tracking-wide text-text-muted">
          <tr>
            <th className="px-5 py-3">Experiencia / desglose</th>
            <th className="px-4 py-3">Referencia por uso</th>
            <th className="px-4 py-3 text-right">Operaciones IA</th>
            <th className="px-5 py-3 text-right">Costo acumulado estimado</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.id} className="border-t border-border">
              <td className="max-w-lg px-5 py-3 align-top">
                <div className="font-semibold">{group.label}</div>
                <p className="mt-1 text-caption text-text-muted">
                  {group.description}
                </p>
                <details className="mt-2 text-caption">
                  <summary className="cursor-pointer font-semibold text-primary-400">
                    Ver desglose y límites
                  </summary>
                  {isAiExperience(group.id) && (
                    <a
                      className="mt-2 block text-primary-400 underline"
                      href={`/admin/limits#ai-limit-${experienceLimitKey(group.id)}`}
                    >
                      Administrar presupuesto de {group.label}
                    </a>
                  )}
                  <ul className="mt-2 space-y-2">
                    {group.features.map((feature) => (
                      <li key={feature}>
                        <span>
                          {FEATURE_LABELS[feature as AiUsageFeature] ?? feature}
                        </span>
                        {aiFeatureDescriptor(feature)?.section === "HISTORY" &&
                          " · solo histórico"}
                      </li>
                    ))}
                  </ul>
                  {group.rows.length === 0 && (
                    <p className="mt-2 text-text-muted">
                      Sin operaciones registradas en este período.
                    </p>
                  )}
                  {group.rows.map((row, index) => (
                    <div
                      key={`${row.feature}:${index}`}
                      className="mt-3 rounded-control bg-elevated p-3"
                    >
                      <p className="font-semibold">
                        {FEATURE_LABELS[row.feature as AiUsageFeature] ??
                          row.feature}
                      </p>
                      <p>
                        {row.provider} · {row.model} · {row.calls} operaciones ·{" "}
                        {usd(row.costUsd)}
                      </p>
                      <p className="text-text-muted">{row.feature}</p>
                      <AiInteractionCost row={row} />
                      <p className="text-text-muted">
                        {row.calculationMethod === "TOKEN_RATES"
                          ? `Tokens: ${row.inputTokens ?? 0} entrada / ${row.outputTokens ?? 0} salida · US$${row.inputRateUsdPerMillionTokens ?? "?"}/US$${row.outputRateUsdPerMillionTokens ?? "?"} por millón`
                          : row.calculationMethod === "PER_MINUTE"
                            ? `Audio · US$${row.audioRateUsdPerMinute ?? "?"}/min · ${(row.durationSeconds / 60).toFixed(2)} min · ${row.durationSource === "SERVER_DECODED" || row.durationSource === "CLIENT_RECORDED" ? "duración medida" : row.durationSource === "PROVIDER_REPORTED" ? "duración del proveedor" : "duración estimada"}`
                            : "Estimación sin desglose de tokens"}
                      </p>
                    </div>
                  ))}
                </details>
              </td>
              <td className="px-4 py-3 align-top text-caption text-text-secondary">
                {reference(group)}
              </td>
              <td className="px-4 py-3 text-right align-top">{group.calls}</td>
              <td className="px-5 py-3 text-right align-top font-semibold">
                {usd(group.costUsd)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function AiCostReport({ rows }: { rows: readonly AdminAiCostRow[] }) {
  const report = buildAdminAiCostReport(rows);
  return (
    <div>
      <GroupTable groups={report.interactive} />
      <section className="border-t border-border">
        <div className="px-5 py-4">
          <h3 className="font-display text-card-title font-semibold">
            Generación de contenido compartido (caché)
          </h3>
          <p className="mt-1 font-interface text-caption text-text-muted">
            La primera generación sí tiene costo y se incluye en el total.
            Reproducir el archivo guardado, incluso otro usuario, no consume
            OpenAI. Almacenamiento y transferencia pueden tener costos propios.
          </p>
        </div>
        <GroupTable groups={report.shared} />
      </section>
      <p className="border-t border-border px-5 py-3 font-interface text-caption text-text-muted">
        Total reconciliado: {usd(report.totalCostUsd)}.
        {report.history.length > 0 &&
          " Incluye consumo anterior no desglosado en esta vista."}{" "}
        Cada operación se suma una sola vez. Las referencias no son cargos fijos
        de OpenAI.
      </p>
    </div>
  );
}
