import { Check, ChevronDown, MessageCircle, Star, Target } from "lucide-react";
import {
  Body,
  Caption,
  CardTitle,
  ChineseText,
  SectionTitle,
} from "@/components/ui/typography";
import { HanAvatar, HanMascot } from "@/components/ui/han-mascot";
import { journeyReportMessages } from "@/i18n/journey-report";
import type { JourneyLessonReportView } from "@/lib/journey-lesson-report";
import { JOURNEY_SPEAKING_WEIGHTS } from "@/lib/journey-speaking-evaluation";
import { REFLECTION_WEIGHTS } from "@/lib/points-system";
import { formatMessage } from "@/i18n/format";
import { cn } from "@/lib/cn";
import { JourneyAudioReviewPanel } from "@/components/lesson/journey-audio-review-panel";
import { JourneyUnifiedReflection } from "@/components/lesson/journey-unified-reflection";

/** Saved results only: no evaluation, audio capture or reward mutation. */
export function JourneyFinalReport({
  report,
  preview = false,
}: {
  report: JourneyLessonReportView;
  preview?: boolean;
}) {
  if (report.unified) return <JourneyUnifiedReflection report={report} />;
  const text = journeyReportMessages[report.locale];
  const t = (es: string, en: string) => (report.locale === "es" ? es : en);
  const feedback = report.speaking.report?.feedback;
  const exercises = Object.values(report.categories).filter(
    (item) => item.state === "COMPLETE",
  );
  const correct = exercises.reduce((sum, item) => sum + item.correct, 0);
  const total = exercises.reduce((sum, item) => sum + item.total, 0);
  const speakingStatus =
    report.speaking.reason === "TECHNICAL_CAPTURE"
      ? text.speakingTechnical
      : report.speaking.reason === "NO_SPEECH"
        ? text.speakingNoSpeech
        : report.speaking.state === "FAILED"
          ? text.speakingFailed
          : report.speaking.state === "INSUFFICIENT" ||
              report.speaking.state === "PARTIAL"
            ? text.speakingInsufficient
            : report.speaking.state === "PROCESSING"
              ? text.speakingProcessing
              : text.speakingPending;
  return (
    <section
      lang={report.locale}
      className="flex min-w-0 flex-col gap-5"
      aria-label={text.title}
    >
      <SectionTitle>{text.title}</SectionTitle>
      <div className="relative overflow-hidden rounded-panel bg-linear-to-br from-secondary-900 to-secondary-700 p-5 text-on-color-light sm:p-8">
        <div className="relative z-10 sm:pr-36">
          <Caption className="text-on-color-light/80">
            {report.overall.score === null ? text.savedPractice : text.complete}
          </Caption>
          <h3 className="mt-3 font-display text-2xl leading-tight sm:text-3xl">
            {t(
              "Cada conversación te muestra el siguiente paso.",
              "Every conversation reveals your next step.",
            )}
          </h3>
          <div className="mt-6 grid grid-cols-[auto_1fr] items-center gap-5">
            <div
              role="group"
              aria-label={`${text.score}: ${report.overall.score === null ? "—" : `${report.overall.score}/100`}`}
            >
              <span className="text-sm text-on-color-light/80">
                {text.score}:{" "}
              </span>
              <strong className="block text-4xl tabular-nums">
                {report.overall.score === null
                  ? "—"
                  : `${report.overall.score}/100`}
              </strong>
            </div>
            {report.overall.stars !== null && (
              <div>
                <span className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3].map((n) => (
                    <Star
                      key={n}
                      className={cn(
                        "size-6",
                        n <= report.overall.stars!
                          ? "fill-accent-100 text-accent-100"
                          : "text-on-color-light/40",
                      )}
                    />
                  ))}
                </span>
                <Caption className="mt-1 text-on-color-light/80">
                  {text.stars}: {report.overall.stars}/3
                </Caption>
              </div>
            )}
          </div>
          <p className="mt-3 text-sm text-on-color-light/80">
            {t(
              "Resultado de esta lección, no una certificación de tu nivel.",
              "A result for this lesson, not a proficiency certification.",
            )}
          </p>
          <p className="mt-2 text-sm text-on-color-light/80">
            {t(
              "La nota actual no es una calificación oral integral: las observaciones de pronunciación, tonos y ritmo se muestran por separado y aún no se incorporan al cálculo.",
              "The current grade is not a comprehensive speaking score: pronunciation, tone and rhythm observations are shown separately and are not yet part of the calculation.",
            )}
          </p>
          {report.overall.score === null && (
            <div className="mt-3 text-sm">
              <p>
                {report.overall.state === "PENDING"
                  ? text.pending
                  : report.overall.state === "COMPLETE"
                    ? text.complete
                    : text.partial}
              </p>
              <p>{text.partialNote}</p>
            </div>
          )}
        </div>
        <HanMascot
          pose={
            report.overall.score !== null && report.overall.score >= 70
              ? "celebrating"
              : "thinking"
          }
          size={180}
          className="pointer-events-none absolute right-0 top-12 hidden sm:block"
        />
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-3 xl:grid-cols-4">
        {(["vocabulary", "grammar", "comprehension"] as const).map((key) => {
          const category = report.categories[key];
          const status =
            category.state === "COMPLETE"
              ? text.quizComplete
              : category.state === "PARTIAL"
                ? text.quizPartial
                : category.state === "MISSING"
                  ? text.quizMissing
                  : text.noOpportunity;
          const weight =
            REFLECTION_WEIGHTS[
              key.toUpperCase() as "VOCABULARY" | "GRAMMAR" | "COMPREHENSION"
            ];
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
                {category.correct}/{category.total} · {weight}%
              </Caption>
              <Caption className="mt-1 block">{status}</Caption>
            </div>
          );
        })}
        <div className="min-w-0 rounded-card border border-secondary-500/40 bg-surface p-4">
          <CardTitle className="text-base">
            {text.speaking}:{" "}
            {report.speaking.score === null
              ? "—"
              : `${report.speaking.score}/100`}
          </CardTitle>
          <Caption className="mt-2 block">
            {REFLECTION_WEIGHTS.SPEAKING}% ·{" "}
            {t("Aplicación oral", "Spoken application")}
          </Caption>
          <Caption className="mt-1 block">
            {t(
              "Nota lingüística; no incluye medición acústica.",
              "Language score; excludes acoustic measurement.",
            )}
          </Caption>
        </div>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section
          className="min-w-0 rounded-panel border border-border bg-surface p-5 sm:p-6"
          aria-label={t(
            "Tu conversación, explicada",
            "Your conversation, explained",
          )}
        >
          <Caption className="flex items-center gap-2 uppercase tracking-wider">
            <MessageCircle className="size-4" aria-hidden="true" />
            Speaking
          </Caption>
          <CardTitle className="mt-2 text-2xl">
            {t("Tu conversación, explicada", "Your conversation, explained")}
          </CardTitle>
          <p className="mt-3 text-sm text-text-secondary">
            {t(
              "Uso del idioma combina vocabulario y gramática. Estos son los criterios reales guardados; todavía no hay notas separadas para ambos.",
              "Language use combines vocabulary and grammar. These are the actual saved criteria; separate scores are not available yet.",
            )}
          </p>
          {report.speaking.report?.evaluationPolicy &&
            report.speaking.report.limitations.some(
              (item) => item.kind === "recognition_uncertain",
            ) && (
              <Caption className="mt-3 block">{text.clearTurnsOnly}</Caption>
            )}
          {!feedback && <Body className="mt-3">{speakingStatus}</Body>}
          {(
            ["communication", "language", "interaction", "autonomy"] as const
          ).map((key) => {
            const dimension = report.speaking.report?.dimensions[key];
            const level =
              dimension?.observation === "OBSERVED" ? dimension.level : null;
            const weight = JOURNEY_SPEAKING_WEIGHTS[key];
            const points = level == null ? null : (level / 4) * weight;
            return (
              <details key={key} className="group border-b border-border py-4">
                <summary className="min-h-11 cursor-pointer list-none">
                  <span className="flex items-center justify-between gap-3 font-semibold">
                    <span>{text[key]}</span>
                    <span className="flex items-center gap-2 text-sm tabular-nums">
                      {level == null
                        ? dimension?.observation === "NO_OPPORTUNITY"
                          ? text.noCriterionOpportunity
                          : text.notObserved
                        : `${level}/4`}
                      <ChevronDown
                        className="size-4 shrink-0 group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                  <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-border">
                    <span
                      className="block h-full rounded-full bg-secondary-400"
                      style={{
                        width: `${level == null ? 0 : (level / 4) * 100}%`,
                      }}
                    />
                  </span>
                  <span className="mt-2 block text-xs text-text-muted">
                    {points === null
                      ? t("Sin aporte calculable", "No calculable contribution")
                      : t(
                          `${points.toLocaleString(report.locale)} de ${weight} puntos`,
                          `${points.toLocaleString(report.locale)} of ${weight} points`,
                        )}
                  </span>
                </summary>
                <div className="mt-3 space-y-2 rounded-card bg-elevated p-3 text-sm text-text-secondary">
                  <p>{dimension?.reason ?? text.notObserved}</p>
                  {dimension?.citations.map((cite, index) => (
                    <blockquote
                      key={index}
                      className="break-words border-l-2 border-secondary-500 pl-3"
                    >
                      {cite.quote}
                    </blockquote>
                  ))}
                </div>
              </details>
            );
          })}
          <p className="text-xs text-text-muted">
            {t(
              "Cálculo actual: nivel ÷ 4 × peso. Comunicación 40%, uso del idioma 30%, interacción 20% y autonomía 10%. La nota se redondea; no es la nueva rúbrica acústica calibrada.",
              "Current calculation: level ÷ 4 × weight. Communication 40%, language use 30%, interaction 20%, independence 10%. The score is rounded; this is not the new calibrated acoustic rubric.",
            )}
          </p>
        </section>
        <div className="min-w-0 space-y-5">
          {feedback?.achievement && (
            <section
              className="rounded-panel border border-border bg-surface p-5 sm:p-6"
              aria-label={text.achievement}
            >
              <CardTitle className="flex items-center gap-2">
                <Check
                  className="size-5 text-secondary-400"
                  aria-hidden="true"
                />
                {text.achievement}
              </CardTitle>
              <Body className="mt-3">{feedback.achievement.text}</Body>
              {feedback.achievement.citations.map((cite, index) => (
                <blockquote
                  key={index}
                  className="mt-3 break-words rounded-card bg-secondary-500/10 p-3 font-chinese text-lg"
                >
                  {cite.quote}
                </blockquote>
              ))}
            </section>
          )}
          {feedback ? (
            <section
              className="rounded-panel border border-border bg-surface p-5 sm:p-6"
              aria-label={text.hanNote}
            >
              <div className="flex items-center gap-2">
                <HanAvatar size={36} pose="heart" />
                <CardTitle>{text.hanNote}</CardTitle>
              </div>
              <Body className="mt-4">{feedback.summary}</Body>
            </section>
          ) : (
            <section className="rounded-panel border border-border bg-surface p-5">
              <CardTitle>{text.exerciseProgress}</CardTitle>
              {total > 0 && (
                <Body className="mt-2">
                  {formatMessage(text.exerciseSummary, { correct, total })}
                </Body>
              )}
              <Body className="mt-2">{text.feedbackPending}</Body>
            </section>
          )}
        </div>
      </div>
      <JourneyAudioReviewPanel
        result={report.speaking.sessionAudio}
        locale={report.locale}
      />
      {feedback?.priority && (
        <section
          className="rounded-panel border border-border bg-surface p-5 sm:p-6"
          aria-label={text.priority}
        >
          <Caption className="uppercase tracking-wider">
            {feedback.priority.kind === "practice"
              ? t("Ampliación", "Extension")
              : t("Corrección prioritaria", "Priority correction")}
          </Caption>
          <CardTitle className="mt-2 text-xl">{text.priority}</CardTitle>
          <Body className="mt-3">{feedback.priority.text}</Body>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {feedback.priority.citations.length > 0 && (
              <div className="min-w-0 rounded-card bg-elevated p-4">
                <Caption>
                  {t("En tu conversación", "In your conversation")}
                </Caption>
                {feedback.priority.citations.map((cite, index) => (
                  <blockquote
                    key={index}
                    className="mt-2 break-words font-chinese text-lg"
                  >
                    {cite.quote}
                  </blockquote>
                ))}
              </div>
            )}
            {feedback.priority.example && (
              <div className="min-w-0 rounded-card bg-secondary-500/10 p-4">
                <Caption>
                  {t("Una forma de practicarlo", "One way to practice")}
                </Caption>
                <ChineseText className="mt-2 break-words">
                  {feedback.priority.example.chinese}
                </ChineseText>
                <Body className="mt-2">{feedback.priority.example.pinyin}</Body>
                <Caption className="mt-2 block">
                  {feedback.priority.example.translation}
                </Caption>
              </div>
            )}
          </div>
        </section>
      )}
      {feedback && (
        <section
          className="rounded-panel border border-secondary-500/30 bg-secondary-500/10 p-5 sm:p-6"
          aria-label={text.nextStep}
        >
          <Caption className="flex items-center gap-2 uppercase tracking-wider">
            <Target className="size-4" aria-hidden="true" />
            {text.nextStep}
          </Caption>
          <Body className="mt-3 font-semibold">{feedback.nextStep}</Body>
        </section>
      )}
      <details className="rounded-panel border border-border bg-surface p-4">
        <summary className="min-h-11 cursor-pointer">{text.details}</summary>
        <div className="mt-3 flex flex-col gap-3">
          <CardTitle>{text.answerDetails}</CardTitle>
          {(["vocabulary", "grammar", "comprehension"] as const).map((key) => {
            const category = report.categories[key];
            return (
              <div key={key}>
                <Body>{text[key]}</Body>
                <dl className="grid grid-cols-2 gap-1 text-sm">
                  <dt>{text.correct}</dt>
                  <dd>{category.correct}</dd>
                  <dt>{text.incorrect}</dt>
                  <dd>{category.incorrect}</dd>
                  <dt>{text.ungraded}</dt>
                  <dd>{category.pending}</dd>
                  <dt>{text.missing}</dt>
                  <dd>{category.missing}</dd>
                </dl>
              </div>
            );
          })}
          {report.speaking.report?.limitations.map((item) => (
            <Body key={item.kind}>{item.reason}</Body>
          ))}
        </div>
      </details>
      <Caption>
        {preview
          ? t(
              "Resultado de ejemplo: no se guarda ni concede puntos, estrellas o HanCoins.",
              "Example result: it is not saved and grants no points, stars or HanCoins.",
            )
          : !report.rewards.eligible
            ? text.rewardsUnavailable
            : report.rewards.settlement === "SETTLED"
              ? text.rewardsSettled
              : text.rewardsPending}
      </Caption>
    </section>
  );
}
