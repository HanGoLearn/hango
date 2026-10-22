import Link from "next/link";
import {
  FlaskConical,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import {
  qualityReviewStates,
  type JourneyQualityReviewView,
} from "@/lib/journey-speaking-quality-view";

const dimensionNames = {
  communication: "Comunicación",
  vocabulary: "Vocabulario",
  grammar: "Gramática",
  interaction: "Interacción y autonomía",
};
const supportNames = {
  NONE: "Sin ayuda observada",
  OCCASIONAL: "Ayuda puntual",
  CONTINUOUS: "Ayuda continua",
  UNKNOWN: "Ayuda no determinada",
};
const turnAnchor = (id: string) => `quality-turn-${encodeURIComponent(id)}`;
const actNames = {
  "restaurant-order-dish-v1": "Pedir un plato",
  "restaurant-order-drink-v1": "Pedir una bebida",
  "restaurant-ask-spicy-v1": "Preguntar si es picante",
  "contract-ask-scope-v1": "Consultar el alcance de la cláusula",
  "contract-pushback-v1": "Cuestionar una condición con tacto",
  "contract-request-written-v1": "Solicitar documentación escrita",
  "greetings-greet-v1": "Saludar",
  "greetings-identify-v1": "Decir tu nombre",
  "greetings-ask-name-v2": "Preguntar el nombre",
  "greetings-ask-origin-v1": "Preguntar el origen",
};
const actStatuses = {
  PATTERN_SUPPORTED: "Patrón localizado · no es aprobación docente",
  EVIDENCE_MISMATCH: "La cita no respalda este objetivo",
  NEEDS_REVIEW: "Correspondencia pendiente de revisión",
};
const pedagogyNotices: Record<string, string> = {
  ACT_FORM_REQUIREMENT_REQUIRES_SEPARATE_REVIEW:
    "El objetivo menciona una estructura concreta: lograr la intención comunicativa no demuestra por sí solo esa forma gramatical.",
  HUMAN_CALIBRATION_PENDING: "Falta calibración docente independiente.",
  MODEL_PROSE_NOT_APPROVED_FOR_STUDENT:
    "Las explicaciones originales de la IA aún no están aprobadas para el estudiante.",
  UNCITED_LEARNER_TURNS:
    "Hay intervenciones claras sin citas de respaldo en el informe.",
  REQUIRED_TARGETS_NOT_CONFIGURED:
    "No se seleccionaron objetivos obligatorios: esto no demuestra cobertura perfecta.",
  OPPORTUNITY_REQUIRES_CONTEXT_REVIEW:
    "La afirmación «sin oportunidad» necesita revisión contextual; no basta con que falte una palabra.",
  ACT_EVIDENCE_MISMATCH:
    "La cita de presentación propia no respalda el acto de preguntar el nombre.",
  ACT_SEMANTICS_REQUIRES_REVIEW:
    "Este acto requiere revisión semántica; no tiene una comprobación editorial suficiente.",
};

/** Read-only private review. No client actions, media, fetch or paid controls. */
export function JourneyQualityReviewScreen({
  view,
}: {
  view: JourneyQualityReviewView;
}) {
  const profile = view.profile;
  return (
    <div lang="es" className="min-w-0 space-y-6">
      <header className="space-y-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-300">
          <FlaskConical className="size-4" aria-hidden="true" />
          Piloto privado · solo desarrollo
        </p>
        <h1 className="font-display text-3xl sm:text-4xl">
          Calidad de Speaking
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-secondary">
          Revisa tu conversación y las evidencias del nuevo evaluador, sin
          volver a llamar a la IA. Esta pantalla no cambia notas, recompensas ni
          General Level.
        </p>
      </header>
      <aside
        aria-label="Control de consumo"
        className="flex gap-3 rounded-panel border border-secondary-500/30 bg-secondary-500/10 p-4"
      >
        <LockKeyhole
          className="mt-0.5 size-5 shrink-0 text-secondary-400"
          aria-hidden="true"
        />
        <div>
          <h2 className="font-semibold">Lectura sin consumo de IA</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Abrir, cambiar de intento o desplegar evidencia no genera
            evaluaciones. No hay un botón de pago habilitado: primero
            acordaremos un intento concreto y su presupuesto.
          </p>
        </div>
      </aside>
      <div className="grid min-w-0 gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <nav
          aria-label="Tus intentos piloto"
          className="min-w-0 rounded-panel border border-border bg-surface p-4"
        >
          <h2 className="mb-3 font-semibold">Tus últimos intentos</h2>
          <p className="mb-4 text-xs text-text-muted">
            Hasta 20 capturas selladas, solo de tu cuenta y las tres lecciones
            piloto.
          </p>
          <ul className="space-y-2">
            {view.attempts.map((attempt) => (
              <li key={attempt.id}>
                <Link
                  prefetch={false}
                  href={`/admin/speaking-quality?attempt=${encodeURIComponent(attempt.id)}`}
                  aria-current={
                    attempt.id === view.selectedId ? "page" : undefined
                  }
                  className={`block min-w-0 rounded-card border p-3 text-sm ${attempt.id === view.selectedId ? "border-secondary-400 bg-secondary-500/10" : "border-border hover:bg-elevated"}`}
                >
                  <span className="block break-words font-semibold">
                    {attempt.title}
                  </span>
                  <time
                    dateTime={attempt.date}
                    className="mt-1 block text-xs text-text-muted"
                  >
                    {new Intl.DateTimeFormat("es-CO", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "America/Bogota",
                    }).format(new Date(attempt.date))}
                  </time>
                  <span className="mt-2 block text-xs text-text-secondary">
                    Nota guardada:{" "}
                    {attempt.currentScore === null
                      ? "Pendiente"
                      : `${attempt.currentScore}/100`}{" "}
                    · rúbrica actual
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {!view.attempts.length && (
            <p className="text-sm text-text-secondary">
              Todavía no hay capturas para revisar en esta cuenta local. No
              necesitas repetir una conversación para ver esta pantalla.
            </p>
          )}
        </nav>
        <div className="min-w-0 space-y-5">
          <section
            aria-label="Estado de revisión"
            className="rounded-panel border border-border bg-surface p-5"
          >
            <h2 className="font-display text-2xl">
              {view.title ?? "Selecciona un intento"}
            </h2>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-accent-300">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              {qualityReviewStates[view.state] ??
                "Estado pendiente de revisión"}
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Un candidato coherente no es una evaluación calibrada.
              Pronunciación y fluidez siguen sin medirse; no se genera una nota
              global nueva.
            </p>
            {view.state === "NOT_RUN" && (
              <p className="mt-3 rounded-card bg-elevated p-3 text-sm">
                Aún no se ha comprado una revisión de este intento. Puedes leer
                la conversación guardada; no mostraremos criterios o
                correcciones inventados.
              </p>
            )}
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-text-muted">Coste estimado registrado</dt>
                <dd className="mt-1 font-semibold">
                  {view.usage
                    ? new Intl.NumberFormat("es-CO", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 4,
                      }).format(view.usage.estimatedCostUsd)
                    : view.state === "NOT_RUN" || view.state === "EMPTY"
                      ? "Sin revisión de IA"
                      : "No conciliado"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Modelo de la revisión</dt>
                <dd className="mt-1 break-words">{view.usage?.model ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Tokens entrada / salida</dt>
                <dd className="mt-1">
                  {view.usage
                    ? `${view.usage.inputTokens ?? "—"} / ${view.usage.outputTokens ?? "—"}`
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>
          {view.pedagogy && (
            <section
              aria-label="Revisión pedagógica pendiente"
              className="rounded-panel border border-accent-400/30 bg-surface p-5"
            >
              <h2 className="font-display text-xl">
                Retenido para revisión pedagógica
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Pasar el formato técnico no aprueba la evaluación. Los niveles
                de abajo son propuestas originales, no una nota nueva.
              </p>
              <p className="mt-3 text-sm font-semibold">
                Intervenciones claras citadas:{" "}
                {view.pedagogy.coverage.citedLearnerTurns} de{" "}
                {view.pedagogy.coverage.clearLearnerTurns}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Es cobertura de citas, no tu puntuación ni prueba de que la IA
                no leyó el resto. Una cita tampoco demuestra que todo el turno
                fue evaluado correctamente.
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-text-secondary">
                {Array.from(
                  new Set(view.pedagogy.notices.map((notice) => notice.code)),
                ).map((code) => (
                  <li key={code}>
                    {pedagogyNotices[code] ??
                      "Comprobación pendiente de revisión."}
                  </li>
                ))}
              </ul>
              <details className="mt-3">
                <summary className="min-h-11 cursor-pointer text-sm">
                  Ver intervenciones sin citas o excluidas
                </summary>
                <ul className="space-y-2 text-sm">
                  {view.pedagogy.coverage.turns
                    .filter((turn) => turn.status !== "CITED")
                    .map((turn) => (
                      <li key={turn.turnId}>
                        <a
                          href={`#${turnAnchor(turn.turnId)}`}
                          className="underline"
                        >
                          Intervención {turn.sequence + 1}:{" "}
                          {turn.status === "UNCITED"
                            ? "sin cita en el informe"
                            : "reconocimiento dudoso, excluida"}
                        </a>
                      </li>
                    ))}
                </ul>
              </details>
              {view.pedagogy.acts.length > 0 && (
                <details className="mt-3">
                  <summary className="min-h-11 cursor-pointer text-sm">
                    Revisar correspondencia por objetivo
                  </summary>
                  <ul className="space-y-3">
                    {view.pedagogy.acts.map((act) => (
                      <li
                        key={act.findingId}
                        className="rounded-card border border-border p-3 text-sm"
                      >
                        <h3 className="font-semibold">
                          {act.rule
                            ? actNames[act.rule]
                            : "Objetivo sin regla editorial"}
                        </h3>
                        <p className="mt-1 text-text-secondary">
                          {actStatuses[act.status]}
                        </p>
                        {act.supportingQuotes.map((cite, index) => (
                          <a
                            key={index}
                            href={`#${turnAnchor(cite.turnId)}`}
                            className="mt-2 block break-words underline"
                          >
                            Cita seleccionada: «{cite.quote}»
                          </a>
                        ))}
                        {act.otherSupportedQuotes.length > 0 && (
                          <div className="mt-3 border-t border-border pt-3">
                            <p className="text-text-muted">
                              Otros fragmentos para revisar. No se añadieron al
                              informe ni modificaron la nota.
                            </p>
                            {act.otherSupportedQuotes.map((cite, index) => (
                              <a
                                key={index}
                                href={`#${turnAnchor(cite.turnId)}`}
                                className="mt-2 block break-words underline"
                              >
                                Otro fragmento: «{cite.quote}»
                              </a>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          )}
          <section
            aria-label="Criterios candidatos"
            className="rounded-panel border border-border bg-surface p-5"
          >
            <h2 className="font-display text-xl">Qué observó el evaluador</h2>
            <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
              {(
                Object.keys(dimensionNames) as Array<
                  keyof typeof dimensionNames
                >
              ).map((key) => {
                const dimension = profile?.dimensions[key];
                return (
                  <div
                    key={key}
                    className="min-w-0 rounded-card border border-border p-4"
                  >
                    <h3 className="flex justify-between gap-2 font-semibold">
                      <span>{dimensionNames[key]}</span>
                      <span>
                        {dimension?.observation === "OBSERVED"
                          ? `${dimension.level}/4`
                          : "—"}
                      </span>
                    </h3>
                    {dimension ? (
                      <>
                        <p className="mt-2 text-xs text-text-muted">
                          {supportNames[dimension.support]}
                        </p>
                        <details className="mt-3">
                          <summary className="min-h-11 cursor-pointer text-sm">
                            Explicación original de IA · sin aprobación docente
                          </summary>
                          <p className="break-words text-sm text-text-secondary">
                            {dimension.reason}
                          </p>
                        </details>
                        <details className="mt-3">
                          <summary className="min-h-11 cursor-pointer text-sm">
                            Ver citas · {dimension.citations.length}
                          </summary>
                          {dimension.citations.map((cite, index) => (
                            <a
                              key={index}
                              href={`#${turnAnchor(cite.turnId)}`}
                              className="my-2 block break-words border-l-2 border-secondary-500 pl-3 text-sm underline-offset-4 hover:underline"
                            >
                              «{cite.quote}»
                            </a>
                          ))}
                        </details>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-text-muted">
                        Sin candidato validado. No es un cero.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm text-text-muted">
              Pronunciación y tonos: sin evaluar. Fluidez acústica: sin evaluar.
            </p>
          </section>
          <section
            aria-label="Correcciones y evidencias"
            className="rounded-panel border border-border bg-surface p-5"
          >
            <h2 className="font-display text-xl">Hallazgos y correcciones</h2>
            {profile?.feedback.length ? (
              <ul className="mt-4 space-y-3">
                {profile.feedback.map((item) => (
                  <li
                    key={item.findingId}
                    className="rounded-card border border-border p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <h3 className="break-words font-semibold">
                        {item.targetText}
                      </h3>
                      <span className="text-xs text-accent-300">
                        {item.label}
                      </span>
                    </div>
                    {item.resolved && (
                      <p className="mt-2 text-sm text-secondary-400">
                        Resuelto después; no es una prioridad vigente.
                      </p>
                    )}
                    {item.isPriority && (
                      <p className="mt-2 text-sm text-accent-300">
                        Prioridad por revisar
                      </p>
                    )}
                    {item.quotes.map((cite, index) => (
                      <a
                        key={index}
                        href={`#${turnAnchor(cite.turnId)}`}
                        className="mt-3 block break-words text-sm text-text-secondary underline"
                      >
                        «{cite.quote}»
                      </a>
                    ))}
                    {item.correction && (
                      <div className="mt-3 rounded-card bg-secondary-500/10 p-3">
                        <p className="text-xs text-text-muted">
                          Propuesta del candidato · verificar con criterio
                          docente
                        </p>
                        <p
                          lang="zh"
                          className="mt-2 break-words font-chinese text-lg"
                        >
                          {item.correction.chinese}
                        </p>
                        <p className="mt-1 text-sm">{item.correction.pinyin}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          {item.correction.translation}
                        </p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-text-secondary">
                No hay hallazgos validados para mostrar. No significa que la
                conversación sea perfecta.
              </p>
            )}
            {view.issues.length > 0 && (
              <details className="mt-4">
                <summary className="min-h-11 cursor-pointer text-sm">
                  Por qué se rechazó el candidato
                </summary>
                <p className="mb-2 text-sm text-text-secondary">
                  Estos controles señalan problemas del juicio de IA, no errores
                  tuyos.
                </p>
                <ul className="space-y-1">
                  {view.issues.map((code, index) => (
                    <li key={index} className="break-all font-mono text-xs">
                      {code}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
          <section
            aria-label="Conversación original"
            className="rounded-panel border border-border bg-surface p-5"
          >
            <h2 className="flex items-center gap-2 font-display text-xl">
              <MessageSquareText className="size-5" aria-hidden="true" />
              Conversación guardada
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Transcripción original, no audio verificado. El reconocimiento
              dudoso no certifica lo que se pronunció.
            </p>
            <ol className="mt-4 space-y-3">
              {view.turns.map((turn, index) => (
                <li
                  id={turnAnchor(turn.id)}
                  key={turn.id}
                  className={`scroll-mt-24 rounded-card border border-border p-4 ${turn.role === "user" ? "bg-secondary-500/10" : "bg-elevated"}`}
                >
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {index + 1} · {turn.role === "user" ? "Tú" : "Personaje"}
                  </h3>
                  {turn.uncertain && (
                    <p className="mt-2 text-xs text-accent-300">
                      Reconocimiento dudoso · excluido de producción evaluable
                    </p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {turn.content}
                  </p>
                </li>
              ))}
            </ol>
            {!view.turns.length && (
              <p className="mt-3 text-sm text-text-secondary">
                Sin conversación disponible en esta selección.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
