import { Check, ChevronDown, MessageCircle, Target } from "lucide-react";
import {
  Body,
  Caption,
  CardTitle,
  ChineseText,
  SectionTitle,
} from "@/components/ui/typography";
import { HanAvatar, HanMascot } from "@/components/ui/han-mascot";
import type { JourneyLessonReportView } from "@/lib/journey-lesson-report";
import { journeyUnifiedLabels } from "@/lib/journey-unified-policy";
import { journeyReportMessages } from "@/i18n/journey-report";

/** The real lesson reflection for frozen unified test attempts. It consumes one
 * server-built result; opening/details never dispatch another evaluation. */
export function JourneyUnifiedReflection({
  report,
}: {
  report: JourneyLessonReportView;
}) {
  const view = report.unified!;
  const { locale } = view;
  const t = (es: string, en: string) => (locale === "es" ? es : en);
  const text = journeyReportMessages[locale];
  const number = (value: number) =>
    value.toLocaleString(locale, { maximumFractionDigits: 2 });
  const priorities = view.corrections.filter(
    (correction) => !correction.resolved,
  );
  const shownPriorities = priorities.slice(0, 2);
  const otherCorrections = view.corrections.filter(
    (correction) => !shownPriorities.includes(correction),
  );
  const correctionCard = (
    correction: (typeof view.corrections)[number],
    index: number,
  ) => (
    <article
      key={index}
      className="min-w-0 space-y-3 rounded-card border border-border bg-surface p-4"
    >
      <Caption className="uppercase tracking-wider">
        {journeyUnifiedLabels[locale][correction.category]} ·{" "}
        {correction.resolved
          ? t("Corregido después", "Corrected later")
          : t("Para tu próximo intento", "For your next attempt")}
      </Caption>
      <blockquote className="break-words rounded-card bg-elevated p-3 font-chinese text-lg">
        {correction.original}
      </blockquote>
      <ChineseText className="break-words">{correction.chinese}</ChineseText>
      <Body className="break-words">{correction.pinyin}</Body>
      {correction.translation && (
        <Caption className="block break-words">
          {correction.translation}
        </Caption>
      )}
      <Body className="break-words">{correction.explanation}</Body>
      {correction.practice && (
        <Body className="break-words font-semibold">{correction.practice}</Body>
      )}
    </article>
  );
  return (
    <section
      lang={locale}
      className="flex min-w-0 flex-col gap-5"
      aria-label={t(
        "Reflexión integrada de la lección",
        "Integrated lesson reflection",
      )}
    >
      <SectionTitle>{text.title}</SectionTitle>
      <div className="relative overflow-hidden rounded-panel bg-linear-to-br from-secondary-900 to-secondary-700 p-5 text-on-color-light sm:p-8">
        <div className="relative z-10 sm:pr-36">
          <Caption className="text-on-color-light/80">
            {t(
              "Evaluación integrada · prueba de administrador",
              "Integrated evaluation · administrator test",
            )}
          </Caption>
          <h3 className="mt-3 font-display text-2xl sm:text-3xl">
            {t(
              "Tu conversación, con todas sus variables.",
              "Your conversation, with every dimension.",
            )}
          </h3>
          <div
            className="mt-5"
            role="group"
            aria-label={`${t("Nota provisional de la lección", "Provisional lesson score")}: ${view.lessonScore === null ? "—" : `${view.lessonScore}/100`}`}
          >
            <p className="text-sm">
              {t("Nota provisional de la lección", "Provisional lesson score")}
            </p>
            <strong className="text-4xl tabular-nums">
              {view.lessonScore === null ? "—" : `${view.lessonScore}/100`}
            </strong>
          </div>
          <p className="mt-4 text-sm text-on-color-light/90">
            {t(
              "Resultado experimental, todavía no calibrado con docentes. Integra texto y la revisión de audio de esta sesión; no certifica tu nivel ni concede puntos, estrellas o HanCoins.",
              "Experimental result, not yet teacher-calibrated. It combines text and this session's audio review; it does not certify proficiency or grant points, stars or HanCoins.",
            )}
          </p>
        </div>
        <HanMascot
          pose="thinking"
          size={180}
          className="pointer-events-none absolute right-0 top-12 hidden sm:block"
        />
      </div>
      {view.level && (
        <section
          aria-label={t("Nivel de este intento", "This attempt's level")}
          className="min-w-0 rounded-card border border-border bg-surface p-4"
        >
          <CardTitle className="text-base">
            {t("Nivel de este intento", "This attempt's level")}
          </CardTitle>
          <Body className="mt-2 break-words">
            {t("Experiencia al comenzar", "Starting experience")}:{" "}
            {t("nivel", "level")} {view.level.generalLevel} ·{" "}
            {number(view.level.generalPoints)} {t("puntos", "points")}
          </Body>
          <Caption className="mt-2 block break-words">
            {t("Nivel de la lección", "Lesson level")}: {view.level.lessonLevel}{" "}
            · {t("Apoyo inicial", "Entry support")}: {view.level.entryLevel} ·{" "}
            {t("Extensión máxima opcional", "Optional stretch ceiling")}:{" "}
            {view.level.stretchLevel}
          </Caption>
          <Caption className="mt-2 block">
            {t(
              "Usamos los niveles internos de HanGo, no una certificación HSK. Tu progreso adapta el apoyo; la nota se juzga según esta lección. Este nivel queda guardado y no cambia al reabrir el resultado.",
              "These are HanGo's internal levels, not HSK certification. Your progress adjusts support; grading stays anchored to this lesson. This level is saved and does not change when you reopen the result.",
            )}
          </Caption>
        </section>
      )}
      <div className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
        {(["vocabulary", "grammar", "comprehension"] as const).map((key) => {
          const category = report.categories[key];
          return (
            <div
              key={key}
              className="min-w-0 rounded-card border border-border bg-surface p-4"
            >
              <CardTitle className="text-base">
                {text[key]}:{" "}
                {category.score === null ? "—" : `${category.score}/100`}
              </CardTitle>
              <Caption className="mt-2 block">
                {category.correct}/{category.total} ·{" "}
                {t("Ejercicios", "Exercises")}
              </Caption>
            </div>
          );
        })}
        <div className="min-w-0 rounded-card border border-secondary-500/40 bg-surface p-4">
          <CardTitle className="text-base">
            {text.speaking}:{" "}
            {view.speakingScore === null ? "—" : `${view.speakingScore}/100`}
          </CardTitle>
          <Caption className="mt-2 block">
            {t(
              "Seis variables · nota provisional",
              "Six dimensions · provisional score",
            )}
          </Caption>
        </div>
      </div>
      <section
        className="min-w-0 space-y-4 rounded-panel border border-border bg-surface p-5 sm:p-6"
        aria-label={t(
          "Variables de tu conversación",
          "Your conversation dimensions",
        )}
      >
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-5" aria-hidden="true" />
          {t("Tu conversación, explicada", "Your conversation, explained")}
        </CardTitle>
        <p className="text-sm text-text-secondary">
          {t(
            "Una sola calificación provisional: nivel ÷ 4 × peso. Vocabulario y gramática se evalúan por separado de los ejercicios.",
            "One provisional grade: level ÷ 4 × weight. Vocabulary and grammar are evaluated separately from exercises.",
          )}
        </p>
        <div className="grid min-w-0 gap-x-5 sm:grid-cols-2">
          {(
            Object.keys(view.dimensions) as Array<keyof typeof view.dimensions>
          ).map((key) => {
            const dimension = view.dimensions[key];
            return (
              <details
                key={key}
                className="group min-w-0 border-b border-border py-4"
              >
                <summary className="min-h-11 cursor-pointer list-none">
                  <span className="flex justify-between gap-3 font-semibold">
                    <span>{journeyUnifiedLabels[locale][key]}</span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                      {dimension.level === null
                        ? t("Sin evaluar", "Not assessed")
                        : `${number(dimension.level)}/4`}
                      <ChevronDown
                        className="size-4 group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                  <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-border">
                    <span
                      className="block h-full bg-secondary-400"
                      style={{
                        width: `${dimension.level === null ? 0 : (dimension.level / 4) * 100}%`,
                      }}
                    />
                  </span>
                  <Caption className="mt-2 block">
                    {dimension.weight}% ·{" "}
                    {dimension.contribution === null
                      ? t("Sin aporte calculable", "No calculable contribution")
                      : t(
                          `${number(dimension.contribution)} de ${dimension.weight} puntos`,
                          `${number(dimension.contribution)} of ${dimension.weight} points`,
                        )}
                  </Caption>
                </summary>
                <Body className="mt-3 break-words">{dimension.reason}</Body>
                {key === "pronunciation" && (
                  <Caption className="mt-2 block">
                    {t(
                      "Tonos y articulación aportan la mitad cada uno dentro de este 25%. Es una ponderación de prueba, no validada científicamente.",
                      "Tones and articulation each contribute half of this 25%. This is a test weighting, not a scientifically validated one.",
                    )}
                  </Caption>
                )}
                {dimension.evidence.map((evidence, index) => (
                  <blockquote
                    key={index}
                    className="mt-3 break-words rounded-card bg-elevated p-3"
                  >
                    <Caption>
                      {t("Intervención", "Turn")} {evidence.sequence + 1} ·{" "}
                      {evidence.source === "SESSION_AUDIO"
                        ? t(
                            "Revisión de audio experimental",
                            "Experimental audio review",
                          )
                        : t("Evidencia textual", "Text evidence")}
                    </Caption>
                    <p className="mt-1 font-chinese text-lg">
                      {evidence.quote}
                    </p>
                  </blockquote>
                ))}
              </details>
            );
          })}
        </div>
        <Caption className="block">
          {t(
            "La pronunciación y la fluidez provienen de una revisión Realtime recibida por el navegador; su procedencia y precisión no están verificadas independientemente. Por eso esta nota de prueba no se usa para recompensas.",
            "Pronunciation and fluency come from a Realtime review delivered through the browser; provenance and accuracy are not independently verified. This is why the test grade is not used for rewards.",
          )}
        </Caption>
        <Caption className="block">
          {t(
            "Nota de lección: vocabulario 20% + gramática 20% + comprensión 30% + conversación 30%. Sin alguna variable, no la reemplazamos por cero ni redistribuimos su peso.",
            "Lesson score: vocabulary 20% + grammar 20% + comprehension 30% + conversation 30%. Missing dimensions are neither zeroed nor reweighted.",
          )}
        </Caption>
      </section>
      {view.holds.length > 0 && (
        <section
          className="space-y-2 rounded-panel border border-border bg-surface p-5"
          aria-label={t(
            "Qué falta para calcular la nota",
            "What is missing to calculate the grade",
          )}
        >
          <CardTitle>
            {t(
              "Qué falta para calcular la nota",
              "What is missing to calculate the grade",
            )}
          </CardTitle>
          {view.holds.map((hold) => (
            <Body key={hold}>{hold}</Body>
          ))}
        </section>
      )}
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <section
          className="min-w-0 rounded-panel border border-border bg-surface p-5"
          aria-label={text.achievement}
        >
          <CardTitle className="flex items-center gap-2">
            <Check className="size-5 text-secondary-400" aria-hidden="true" />
            {text.achievement}
          </CardTitle>
          {view.achievements.length ? (
            view.achievements.map((achievement, index) => (
              <div key={index} className="mt-3">
                <Body className="break-words">{achievement.text}</Body>
                {achievement.evidence.map((evidence, n) => (
                  <blockquote
                    key={n}
                    className="mt-2 break-words font-chinese text-lg"
                  >
                    {evidence.quote}
                  </blockquote>
                ))}
              </div>
            ))
          ) : (
            <Body className="mt-3">
              {t(
                "Aún no hay logros coherentemente respaldados en esta revisión.",
                "This review does not yet contain consistently supported achievements.",
              )}
            </Body>
          )}
        </section>
        <section
          className="min-w-0 rounded-panel border border-border bg-surface p-5"
          aria-label={text.hanNote}
        >
          <div className="flex items-center gap-2">
            <HanAvatar size={36} pose="heart" />
            <CardTitle>{text.hanNote}</CardTitle>
          </div>
          <Body className="mt-4 break-words">{view.hanNote}</Body>
        </section>
      </div>
      <section
        className="min-w-0 space-y-4 rounded-panel border border-border bg-elevated p-5"
        aria-label={text.priority}
      >
        <CardTitle>{text.priority}</CardTitle>
        {priorities.length ? (
          shownPriorities.map(correctionCard)
        ) : (
          <Body>
            {t(
              "No se han confirmado correcciones prioritarias en la evidencia disponible. Esto no equivale a demostrar perfección; el próximo intento puede ampliar lo observado.",
              "No priority corrections have been confirmed in the available evidence. This does not demonstrate perfection; another attempt can broaden the evidence.",
            )}
          </Body>
        )}
      </section>
      <section
        className="rounded-panel border border-secondary-500/30 bg-secondary-500/10 p-5"
        aria-label={text.nextStep}
      >
        <Caption className="flex items-center gap-2 uppercase tracking-wider">
          <Target className="size-4" aria-hidden="true" />
          {text.nextStep}
        </Caption>
        <Body className="mt-3 break-words font-semibold">{view.nextStep}</Body>
      </section>
      <details className="min-w-0 rounded-panel border border-border bg-surface p-4">
        <summary className="min-h-11 cursor-pointer">
          {t("Cobertura y todos los ajustes", "Coverage and all adjustments")}
        </summary>
        <div className="mt-3 space-y-3">
          <Body>
            {t("Objetivos prioritarios", "Priority objectives")}:{" "}
            {view.coverage.required}. {t("Independientes", "Independent")}:{" "}
            {view.coverage.independent}. {t("Con ayuda", "With support")}:{" "}
            {view.coverage.assisted}. {t("Autocorregidos", "Self-corrected")}:{" "}
            {view.coverage.selfCorrected}. {t("Sin confirmar", "Unconfirmed")}:{" "}
            {view.coverage.unconfirmed}.
          </Body>
          <Body>
            {t(
              "Intervenciones que la IA declara haber escuchado",
              "Turns the AI reports hearing",
            )}
            : {view.coverage.audioReviewed}/{view.coverage.audioTotal}.
          </Body>
          <Caption className="block">
            {t(
              "Los objetivos no son un guion de respuestas obligatorias ni una cuota de todas las palabras de la lección. La cobertura de audio es declarada por la IA, no una validación humana.",
              "Objectives are not a mandatory response script or a quota of every lesson word. Audio coverage is reported by the AI, not human validation.",
            )}
          </Caption>
          {otherCorrections.map(correctionCard)}
        </div>
      </details>
    </section>
  );
}
