"use client";

import { useState, type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleCheck,
  FlaskConical,
  GraduationCap,
  Info,
  MessageCircle,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import { HanAvatar, HanMascot } from "@/components/ui/han-mascot";
import { cn } from "@/lib/cn";
import type { AppLocale } from "@/i18n/config";
import {
  createReflectionDesignExample,
  type ReflectionDesignScenario,
} from "@/lib/journey-reflection-design-example";

// The real app applies its theme at the document root. This development-only
// light preview is scoped to main and must re-resolve inherited role aliases.
const isolatedLightRoles = {
  "--color-page": "var(--color-neutral-900)",
  "--color-surface": "var(--color-neutral-800)",
  "--color-elevated": "var(--color-neutral-700)",
  "--color-text-primary": "var(--color-neutral-50)",
  "--color-text-secondary": "var(--color-neutral-300)",
  "--color-text-muted": "var(--color-neutral-400)",
  "--color-border": "var(--color-neutral-700)",
} as CSSProperties;

/** Design proposal only. No media APIs, provider calls, actions, progress or rewards. */
export function JourneyReflectionDesignPreview({
  locale,
  palette,
}: {
  locale: AppLocale;
  palette?: "light";
}) {
  const es = locale === "es";
  const [scenario, setScenario] =
    useState<ReflectionDesignScenario>("practice");
  const [pinyin, setPinyin] = useState(true);
  const example = createReflectionDesignExample(locale, scenario);
  const t = (spanish: string, english: string) => (es ? spanish : english);
  return (
    <main
      lang={locale}
      data-theme={palette}
      style={palette === "light" ? isolatedLightRoles : undefined}
      className="min-h-dvh bg-page px-4 py-5 text-text-primary sm:px-6 sm:py-8"
    >
      <div className="mx-auto max-w-5xl">
        <aside
          className="mb-7 rounded-2xl border border-border bg-surface p-4"
          aria-label={t("Aviso de demostración", "Demonstration notice")}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FlaskConical aria-hidden="true" className="size-4 shrink-0" />
            {t(
              "PROPUESTA VISUAL · DATOS FICTICIOS",
              "DESIGN PROPOSAL · FICTIONAL DATA",
            )}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {t(
              "No es tu resultado. No graba, no usa IA y no guarda notas. Las mediciones de audio de los ejemplos completos también son simuladas.",
              "This is not your result. No recording, AI requests or saved grades. Audio measurements in complete examples are also simulated.",
            )}
          </p>
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="group"
            aria-label={t("Ejemplos de diseño", "Design examples")}
          >
            {(
              [
                [
                  "practice",
                  t("Con aspectos por mejorar", "With areas to improve"),
                ],
                ["strong", t("Buen desempeño", "Strong performance")],
                ["partial", t("Audio sin evaluar", "Audio not assessed")],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setScenario(key)}
                aria-pressed={scenario === key}
                className={cn(
                  "min-h-11 rounded-xl border px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
                  scenario === key
                    ? "border-secondary-500 bg-secondary-500/15"
                    : "border-border hover:bg-elevated",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </aside>

        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              Learning Journey <span aria-hidden="true"> / </span>
              {t("Reflexión", "Reflection")}
            </p>
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">
              {t("Saludos y presentaciones", "Greetings and introductions")}
            </h1>
          </div>
          <button
            type="button"
            aria-pressed={pinyin}
            onClick={() => setPinyin(!pinyin)}
            className="flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm focus-visible:outline-2 focus-visible:outline-primary-500"
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                pinyin ? "bg-secondary-500" : "bg-text-muted",
              )}
            />
            {t("Mostrar pinyin", "Show pinyin")}
          </button>
        </header>

        <section
          className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-secondary-900 via-secondary-800 to-secondary-700 p-5 text-on-color-light sm:p-8"
          aria-label={t("Resultado de ejemplo", "Example result")}
        >
          <div className="grid items-center gap-4 sm:grid-cols-[1fr_200px]">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm text-secondary-100">
                <CircleCheck aria-hidden="true" className="size-4" />
                {example.partial
                  ? t(
                      "Práctica guardada · ejemplo parcial",
                      "Practice saved · partial example",
                    )
                  : t(
                      "Lección completada · ejemplo",
                      "Lesson completed · example",
                    )}
              </p>
              <h2 className="mt-3 max-w-xl font-display text-2xl leading-tight sm:text-4xl">
                {example.strong
                  ? t(
                      "Tu presentación ya tiene soltura.",
                      "Your introduction is taking shape.",
                    )
                  : t(
                      "Ya sabes cómo empezar una conversación.",
                      "You know how to start a conversation.",
                    )}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-secondary-100">
                {t(
                  "Saludaste, compartiste tu origen y devolviste la pregunta. Ahora puedes ver qué funcionó y qué merece otro intento.",
                  "You greeted your partner, shared your origin and returned the question. See what worked and what deserves another try.",
                )}
              </p>
              <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-4">
                <div>
                  <p className="text-xs text-secondary-100">
                    {t("Nota global de ejemplo", "Example overall grade")}
                  </p>
                  <p className="mt-1 text-4xl font-semibold tabular-nums">
                    {example.overall ?? "—"}
                    <span className="ml-1 text-base font-normal text-secondary-100">
                      {example.overall === null
                        ? t("pendiente", "pending")
                        : "/100"}
                    </span>
                  </p>
                </div>
                <div className="border-l border-secondary-500 pl-5">
                  <div
                    className="flex gap-1"
                    role="img"
                    aria-label={
                      example.stars === null
                        ? t("Estrellas pendientes", "Stars pending")
                        : t(
                            `${example.stars} de 3 estrellas de ejemplo`,
                            `${example.stars} of 3 example stars`,
                          )
                    }
                  >
                    {[1, 2, 3].map((star) => (
                      <Star
                        key={star}
                        aria-hidden="true"
                        className={cn(
                          "size-6",
                          example.stars !== null && star <= example.stars
                            ? "fill-accent-100 text-accent-100"
                            : "text-secondary-300",
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-secondary-100">
                    {t(
                      "Según esta lección, no tu nivel global",
                      "For this lesson, not your overall proficiency",
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden justify-center sm:flex" aria-hidden="true">
              <HanMascot
                pose={example.partial ? "thinking" : "celebrating"}
                size={200}
                animate={false}
              />
            </div>
          </div>
        </section>

        <section
          className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label={t("Resultados por sección", "Results by section")}
        >
          {[
            ...example.exercises,
            {
              key: "speaking",
              label: t("Conversación", "Conversation"),
              score: example.speaking,
              correct: null,
              total: null,
              weight: 30,
            },
          ].map((row) => (
            <div
              key={row.key}
              className="min-w-0 rounded-2xl border border-border bg-surface p-4"
            >
              <p className="text-sm text-text-secondary">{row.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {row.score ?? "—"}
                <span className="text-sm font-normal text-text-muted">
                  {row.score === null ? "" : "/100"}
                </span>
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {row.correct === null
                  ? t(
                      "Aplicación oral · 30% de la lección",
                      "Speaking · 30% of the lesson",
                    )
                  : t(
                      `${row.correct}/${row.total} respuestas · ${row.weight}% de la lección`,
                      `${row.correct}/${row.total} answers · ${row.weight}% of the lesson`,
                    )}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-7 grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
          <section
            className="min-w-0 rounded-3xl border border-border bg-surface p-5 sm:p-6"
            aria-labelledby="conversation-heading"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <MessageCircle aria-hidden="true" className="size-4" />
                  Speaking
                </p>
                <h2 id="conversation-heading" className="font-display text-2xl">
                  {t(
                    "Tu conversación, explicada",
                    "Your conversation, explained",
                  )}
                </h2>
              </div>
              <p className="shrink-0 text-3xl font-semibold tabular-nums">
                {example.speaking ?? "—"}
                <span className="text-sm font-normal text-text-muted">
                  {example.speaking === null ? "" : "/100"}
                </span>
              </p>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {example.partial
                ? t(
                    "Los ejercicios mantienen sus notas. Sin audio evaluado, no inventamos pronunciación, fluidez ni una nota oral completa.",
                    "Exercise scores remain available. Without assessed audio, we do not invent pronunciation, fluency or an overall speaking grade.",
                  )
                : t(
                    "Cada variable aporta una parte distinta. Estas cifras son ficticias y muestran cómo se explicaría el cálculo.",
                    "Each dimension contributes a different part. These fictional values illustrate how the calculation would be explained.",
                  )}
            </p>
            <div className="mt-5 divide-y divide-border">
              {example.metrics.map((metric) => (
                <details key={metric.key} className="group py-4 first:pt-0">
                  <summary className="cursor-pointer list-none rounded-lg focus-visible:outline-2 focus-visible:outline-primary-500">
                    <div className="flex items-center justify-between gap-3">
                      <span className="min-w-0 text-sm font-medium">
                        {metric.label}
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
                        {metric.level === null
                          ? t("Sin evaluar", "Not assessed")
                          : `${metric.level}/4`}
                        <ChevronDown
                          aria-hidden="true"
                          className="size-4 text-text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
                        />
                      </span>
                    </div>
                    <div
                      className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated"
                      aria-hidden="true"
                    >
                      <div
                        className={cn(
                          "h-full rounded-full",
                          metric.level === null
                            ? "w-0"
                            : metric.level < 3
                              ? "bg-accent-500"
                              : "bg-secondary-500",
                        )}
                        style={{
                          width:
                            metric.level === null
                              ? "0%"
                              : `${(metric.level / 4) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between gap-2 text-xs text-text-muted">
                      <span>
                        {metric.acoustic
                          ? t("Audio simulado", "Simulated audio")
                          : t("Intercambio de ejemplo", "Example exchange")}
                      </span>
                      <span>
                        {metric.points === null
                          ? t(
                              "No se redistribuye su peso",
                              "Its weight is not redistributed",
                            )
                          : t(
                              `${metric.points.toLocaleString(locale)} de ${metric.weight} puntos`,
                              `${metric.points.toLocaleString(locale)} of ${metric.weight} points`,
                            )}
                      </span>
                    </div>
                  </summary>
                  <p className="mt-3 rounded-xl bg-elevated p-3 text-sm leading-relaxed text-text-secondary">
                    {metric.reason}
                  </p>
                </details>
              ))}
            </div>
            <details className="mt-2 rounded-xl border border-border p-3 text-xs text-text-secondary">
              <summary className="min-h-8 cursor-pointer font-medium">
                {t(
                  "Cómo se calcula · ponderación de diseño",
                  "How it is calculated · design weights",
                )}
              </summary>
              <p className="mt-2 leading-relaxed">
                {t(
                  "Cada nivel se divide entre 4 y se multiplica por su peso: comunicación 20, vocabulario 15, gramática 20, pronunciación 25, interacción 10 y fluidez 10. Se suma y se redondea al final. Pesos propuestos, pendientes de calibración; no son una medición validada.",
                  "Each level is divided by 4 and multiplied by its weight: communication 20, vocabulary 15, grammar 20, pronunciation 25, interaction 10 and fluency 10. Add and round only at the end. Proposed weights awaiting calibration, not a validated measurement.",
                )}
              </p>
            </details>
          </section>

          <div className="flex min-w-0 flex-col gap-5">
            <section
              className="rounded-3xl border border-border bg-surface p-5 sm:p-6"
              aria-labelledby="achievements-heading"
            >
              <div className="mb-4 flex items-center gap-2">
                <Target
                  aria-hidden="true"
                  className="size-5 text-secondary-500"
                />
                <h2 id="achievements-heading" className="font-display text-xl">
                  {t("Lo que ya demostraste", "What you demonstrated")}
                </h2>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  t("Iniciar con un saludo", "Open with a greeting"),
                  t("Compartir tu origen", "Share your origin"),
                  t("Devolver una pregunta", "Return a question"),
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-secondary-500"
                    />
                    {item}
                  </li>
                ))}
                <li className="flex items-start gap-2">
                  <BookOpen
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-text-muted"
                  />
                  <span>
                    {t("Presentarte por nombre", "Introduce yourself by name")}
                    <span className="mt-1 block text-xs text-text-muted">
                      {example.strong
                        ? t(
                            "Aplicación independiente en el ejemplo",
                            "Independent use in this example",
                          )
                        : t(
                            "Se entiende; la estructura aún necesita ajuste",
                            "Understandable; the structure still needs work",
                          )}
                    </span>
                  </span>
                </li>
              </ul>
              <blockquote className="mt-5 rounded-2xl bg-secondary-500/10 p-4">
                <p lang="zh-Hans" className="font-chinese text-xl">
                  你呢？
                </p>
                {pinyin && (
                  <p className="mt-1 text-sm text-text-muted">Nǐ ne?</p>
                )}
                <p className="mt-2 text-xs text-text-secondary">
                  {t(
                    "Una pregunta corta también mantiene la conversación.",
                    "A short question can keep the conversation going.",
                  )}
                </p>
              </blockquote>
            </section>
            <section
              className="rounded-3xl border border-border bg-surface p-5 sm:p-6"
              aria-labelledby="han-note-heading"
            >
              <div className="mb-3 flex items-center gap-2">
                <HanAvatar pose="heart" size={38} />
                <div>
                  <h2 id="han-note-heading" className="font-display text-xl">
                    {t("Una nota de Han", "A note from Han")}
                  </h2>
                  <p className="text-xs text-text-muted">
                    {t(
                      "Sobre este intento de ejemplo",
                      "About this example attempt",
                    )}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">
                {t(
                  "No te limitaste a contestar: con «你呢？» invitaste a tu compañero a participar. Esa iniciativa hace que una presentación se convierta en una conversación.",
                  "You did more than answer: with “你呢？” you invited your partner to participate. That initiative turns an introduction into a conversation.",
                )}
              </p>
            </section>
          </div>
        </div>

        <section
          className="mt-5 rounded-3xl border border-border bg-surface p-5 sm:p-6"
          aria-labelledby="corrections-heading"
        >
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-5 text-accent-500" />
            <h2 id="corrections-heading" className="font-display text-2xl">
              {example.strong
                ? t(
                    "Un pequeño reto para seguir",
                    "A small challenge to keep going",
                  )
                : t(
                    "Ajustemos lo que más te ayudará",
                    "Focus on what will help most",
                  )}
            </h2>
          </div>
          {example.strong ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">
              {t(
                "En este ejemplo no hay una corrección gramatical confirmada. Continúa la presentación con una pregunta sobre el origen de tu compañero, sin memorizar un diálogo entero.",
                "This example has no confirmed grammar correction. Continue the introduction by asking where your partner is from, without memorizing an entire dialogue.",
              )}
            </p>
          ) : (
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <article className="min-w-0 rounded-2xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  01 · {t("Gramática", "Grammar")}
                </p>
                <h3 className="mt-2 text-base font-semibold">
                  {t(
                    "Para tu nombre, 叫 no necesita 是",
                    "Your name with 叫 does not need 是",
                  )}
                </h3>
                <div className="mt-4 rounded-xl bg-elevated p-3">
                  <p className="text-xs text-text-muted">
                    {t("Intervención ficticia", "Fictional learner turn")}
                  </p>
                  <p
                    lang="zh-Hans"
                    className="mt-1 break-words font-chinese text-xl"
                  >
                    我叫是小林。
                  </p>
                </div>
                <ArrowDown
                  aria-hidden="true"
                  className="my-2 size-4 text-text-muted"
                />
                <div className="rounded-xl bg-secondary-500/10 p-3">
                  <p className="text-xs text-text-secondary">
                    {t("Una forma adecuada", "An appropriate form")}
                  </p>
                  <p lang="zh-Hans" className="mt-1 font-chinese text-xl">
                    我叫小林。
                  </p>
                  {pinyin && (
                    <p className="mt-1 text-sm text-text-muted">
                      Wǒ jiào Xiǎolín.
                    </p>
                  )}
                  <p className="mt-1 text-sm text-text-secondary">
                    {t("Me llamo Xiaolin.", "My name is Xiaolin.")}
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {t(
                    "叫 ya expresa «llamarse». Conserva 我叫 + nombre; no hace falta añadir otro verbo.",
                    "叫 already means “to be called.” Keep 我叫 + name; no additional verb is needed.",
                  )}
                </p>
              </article>
              <article className="min-w-0 rounded-2xl border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  02 · {t("Pronunciación", "Pronunciation")}
                </p>
                <h3 className="mt-2 text-base font-semibold">
                  {example.partial
                    ? t(
                        "Aquí necesitamos audio, no suposiciones",
                        "This needs audio, not assumptions",
                      )
                    : t("Una indicación breve para 叫", "One short cue for 叫")}
                </h3>
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-elevated p-3 text-sm text-text-secondary">
                  <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <p>
                    {example.partial
                      ? t(
                          "No hay grabación evaluada en este ejemplo parcial. No se atribuye ningún error de tonos al alumno.",
                          "This partial example has no assessed recording. No tone error is attributed to the learner.",
                        )
                      : t(
                          "Corrección acústica simulada para revisar el diseño. No corresponde a tu voz ni a una grabación analizada.",
                          "Simulated acoustic correction for design review. It is not based on your voice or an analyzed recording.",
                        )}
                  </p>
                </div>
                {!example.partial && (
                  <>
                    <p lang="zh-Hans" className="mt-4 font-chinese text-3xl">
                      叫
                      {pinyin && (
                        <span className="ml-3 font-sans text-lg text-text-muted">
                          jiào
                        </span>
                      )}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                      {t(
                        "El ejemplo representa una caída poco clara. Practica una caída breve en 叫 y vuelve a unirla a la presentación; no necesitas repetir toda la conversación.",
                        "The example represents an unclear fall. Practice a brief falling tone on 叫, then reconnect it to the introduction; no need to repeat the entire conversation.",
                      )}
                    </p>
                  </>
                )}
              </article>
            </div>
          )}
        </section>

        <section
          id="next-practice"
          className="mt-5 scroll-mt-5 rounded-3xl border border-secondary-500/40 bg-secondary-500/10 p-5 sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {t("Tu próximo intento", "Your next attempt")}
          </p>
          <h2 className="mt-2 font-display text-2xl">
            {t(
              "Un saludo, tu nombre y una pregunta.",
              "A greeting, your name and a question.",
            )}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
            {t(
              "Hazlo con tus propias palabras. Puedes usar un nombre ficticio: lo importante es aplicar la estructura, no compartir datos personales.",
              "Use your own words. A fictional name is fine: the goal is to use the structure, not share personal information.",
            )}
          </p>
          <a
            href="#conversation-heading"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-500 px-5 py-3 text-sm font-semibold text-on-color-light hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            {t(
              "Revisar mis criterios de ejemplo",
              "Review my example criteria",
            )}
            <ArrowRight aria-hidden="true" className="size-4" />
          </a>
        </section>
        <footer className="mt-6 flex items-start gap-2 border-t border-border py-4 text-xs leading-relaxed text-text-muted">
          <GraduationCap
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          <p>
            {t(
              "Propuesta local pendiente de aprobación. No otorga puntos, estrellas ni HanCoins. No certifica pronunciación, dominio HSK ni una mejora del evaluador.",
              "Local proposal awaiting approval. No points, stars or HanCoins are awarded. It does not certify pronunciation, HSK proficiency or an evaluator improvement.",
            )}
          </p>
        </footer>
      </div>
    </main>
  );
}
