import {
  Body,
  Caption,
  CardTitle,
  ChineseText,
  SectionTitle,
} from "@/components/ui/typography";
import { journeyReportMessages } from "@/i18n/journey-report";
import type { JourneyLessonReportView } from "@/lib/journey-lesson-report";

/** Presentational report mounted only for explicitly selected v2 attempts.
 * No provider requests, automatic audio, rewards mutation or live feedback. */
export function JourneyFinalReport({
  report,
  preview = false,
}: {
  report: JourneyLessonReportView;
  preview?: boolean;
}) {
  const text = journeyReportMessages[report.locale];
  const feedback = report.speaking.report?.feedback;
  return (
    <section
      lang={report.locale}
      className="flex min-w-0 flex-col gap-4"
      aria-label={text.title}
    >
      <SectionTitle>{text.title}</SectionTitle>
      <div className="rounded-panel border border-border bg-surface p-4">
        <CardTitle>
          {text.score}:{" "}
          {report.overall.score === null ? "—" : `${report.overall.score}/100`}
        </CardTitle>
        <Body>
          {report.overall.state === "COMPLETE"
            ? text.complete
            : report.overall.state === "PENDING"
              ? text.pending
              : text.partial}
        </Body>
        {report.overall.stars !== null && (
          <Caption>
            {text.stars}: {report.overall.stars}/3
          </Caption>
        )}
        {report.overall.score === null && (
          <Caption className="mt-2">{text.partialNote}</Caption>
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-2 rounded-panel border border-border bg-surface p-4">
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
          return (
            <div
              key={key}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
            >
              <CardTitle>
                {text[key]}:{" "}
                {category.score === null ? "—" : `${category.score}/100`}
              </CardTitle>
              <Caption>{status}</Caption>
            </div>
          );
        })}
        <div className="border-t border-border pt-2">
          <CardTitle>
            {text.speaking}:{" "}
            {report.speaking.score === null
              ? "—"
              : `${report.speaking.score}/100`}
          </CardTitle>
          {!feedback && (
            <Body>
              {report.speaking.reason === "TECHNICAL_CAPTURE"
                ? text.speakingTechnical
                : report.speaking.reason === "NO_SPEECH"
                  ? text.speakingNoSpeech
                  : report.speaking.state === "FAILED"
                    ? text.speakingFailed
                    : report.speaking.state === "INSUFFICIENT"
                      ? text.speakingInsufficient
                      : report.speaking.state === "PROCESSING"
                        ? text.speakingProcessing
                        : text.speakingPending}
            </Body>
          )}
        </div>
      </div>
      {feedback && (
        <div className="rounded-panel border border-border bg-surface p-4">
          <Body>{feedback.summary}</Body>
          {feedback.achievement && (
            <div className="mt-4">
              <CardTitle>{text.achievement}</CardTitle>
              <Body>{feedback.achievement.text}</Body>
            </div>
          )}
          {feedback.priority && (
            <div className="mt-4">
              <CardTitle>{text.priority}</CardTitle>
              <Body>{feedback.priority.text}</Body>
              {feedback.priority.example && (
                <div className="mt-2">
                  <ChineseText>{feedback.priority.example.chinese}</ChineseText>
                  <Body>{feedback.priority.example.pinyin}</Body>
                  <Caption>{feedback.priority.example.translation}</Caption>
                </div>
              )}
            </div>
          )}
          <div className="mt-4">
            <CardTitle>{text.nextStep}</CardTitle>
            <Body>{feedback.nextStep}</Body>
          </div>
        </div>
      )}
      {
        <details className="rounded-panel border border-border bg-surface p-4">
          <summary className="min-h-11 cursor-pointer">{text.details}</summary>
          <div className="mt-3 flex flex-col gap-3">
            <CardTitle>{text.answerDetails}</CardTitle>
            {(["vocabulary", "grammar", "comprehension"] as const).map(
              (key) => {
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
              },
            )}
            <Caption>{text.acousticNote}</Caption>
            {(
              ["communication", "language", "interaction", "autonomy"] as const
            ).map((key) => {
              const dimension = report.speaking.report?.dimensions[key];
              if (!dimension) return null;
              return (
                <div key={key}>
                  <CardTitle>
                    {text[key]}:{" "}
                    {dimension.observation === "OBSERVED"
                      ? `${dimension.level}/4`
                      : dimension.observation === "NO_OPPORTUNITY"
                        ? text.noCriterionOpportunity
                        : text.notObserved}
                  </CardTitle>
                  <Body>{dimension.reason}</Body>
                  {dimension.citations.map((cite, index) => (
                    <blockquote
                      key={index}
                      className="break-words border-l-2 border-border pl-3"
                    >
                      {cite.quote}
                    </blockquote>
                  ))}
                </div>
              );
            })}
            {report.speaking.report?.limitations.map((item) => (
              <Body key={item.kind}>{item.reason}</Body>
            ))}
          </div>
        </details>
      }
      <Caption>
        {preview
          ? report.locale === "es"
            ? "Resultado de ejemplo: no se guarda ni concede puntos, estrellas o HanCoins."
            : "Example result: it is not saved and grants no points, stars or HanCoins."
          : report.rewards.eligible
            ? report.rewards.settlement === "SETTLED"
              ? text.rewardsSettled
              : text.rewardsPending
            : text.rewardsUnavailable}
      </Caption>
    </section>
  );
}
