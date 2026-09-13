import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  Body,
  Caption,
  CardTitle,
  ChineseText,
  SectionTitle,
} from "@/components/ui/typography";
import type { HandwrittenEvaluation } from "@/lib/handwritten-writing";
import type { WritingLabMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

const DIMENSION_COLORS = [
  "bg-primary-500",
  "bg-secondary-500",
  "bg-accent-500",
  "bg-info-500",
  "bg-success-500",
  "bg-warning-500",
];

export function HandwrittenWritingFeedback({
  evaluation,
  messages,
}: {
  evaluation: HandwrittenEvaluation;
  messages: WritingLabMessages["handwritten"];
}) {
  const errorsByType = {
    character: evaluation.errors.filter((error) => error.type === "character"),
    grammar: evaluation.errors.filter((error) => error.type === "grammar"),
    vocabulary: evaluation.errors.filter(
      (error) => error.type === "vocabulary",
    ),
  };
  const targetRange =
    {
      "About 60–90 Chinese characters": messages.levels.BASIC.characterTarget,
      "About 90–300 Chinese characters":
        messages.levels.INTERMEDIATE.characterTarget,
      "300+ Chinese characters": messages.levels.ADVANCED.characterTarget,
    }[evaluation.targetRange] ?? evaluation.targetRange;

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <Caption>{messages.feedback.overallScore}</Caption>
            <div className="font-display text-5xl font-semibold text-primary-500">
              {evaluation.overallScore}
              <span className="text-section-title text-text-muted">/100</span>
            </div>
          </div>
          <div className="text-right">
            <Body>
              {formatMessage(messages.feedback.characterCount, {
                count: evaluation.characterCount,
              })}
            </Body>
            <Caption>
              {formatMessage(messages.feedback.targetRange, {
                range: targetRange,
              })}
            </Caption>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {evaluation.dimensions.map((dimension, index) => (
            <ProgressBar
              key={dimension.key}
              value={dimension.score}
              label={`${
                messages.feedback.dimensionLabels[
                  dimension.key as keyof typeof messages.feedback.dimensionLabels
                ] ?? dimension.label
              } · ${dimension.weight}%`}
              indicatorClassName={
                DIMENSION_COLORS[index % DIMENSION_COLORS.length]
              }
            />
          ))}
        </div>
      </Card>

      {evaluation.problemCharacters.length > 0 && (
        <Card className="flex flex-col gap-3">
          <CardTitle>{messages.feedback.charactersToImprove}</CardTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {evaluation.problemCharacters.map((problem, index) => (
              <div
                key={`${problem.character}-${index}`}
                className="flex gap-3 rounded-control bg-elevated p-3"
              >
                <span
                  lang="zh"
                  className="font-chinese text-chinese-body font-semibold"
                >
                  {problem.character}
                </span>
                <Body className="text-text-secondary">{problem.issue}</Body>
              </div>
            ))}
          </div>
          <div className="flex gap-2 text-text-secondary">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <Caption>{messages.feedback.strokeOrderDisclaimer}</Caption>
          </div>
        </Card>
      )}

      {evaluation.cohesionNotes && (
        <Card className="flex flex-col gap-1">
          <CardTitle>{messages.feedback.cohesion}</CardTitle>
          <Body className="text-text-secondary">
            {evaluation.cohesionNotes}
          </Body>
        </Card>
      )}

      {evaluation.errors.length > 0 && (
        <Card className="flex flex-col gap-4">
          <SectionTitle>{messages.feedback.specificFeedback}</SectionTitle>
          {(
            [
              ["character", messages.feedback.errorTypes.character],
              ["grammar", messages.feedback.errorTypes.grammar],
              ["vocabulary", messages.feedback.errorTypes.vocabulary],
            ] as const
          ).map(([type, label]) =>
            errorsByType[type].length > 0 ? (
              <div key={type} className="flex flex-col gap-1">
                <CardTitle className="text-body">{label}</CardTitle>
                <ul className="list-disc space-y-1 pl-5 text-text-secondary">
                  {errorsByType[type].map((error, index) => (
                    <li
                      key={`${type}-${index}`}
                      className="font-interface text-body"
                    >
                      {error.description}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null,
          )}
        </Card>
      )}

      <Card className="flex flex-col gap-2">
        <CardTitle>{messages.feedback.correctedVersion}</CardTitle>
        <ChineseText className="whitespace-pre-wrap">
          {evaluation.correctedVersion}
        </ChineseText>
      </Card>

      <Card className="flex gap-3 border-success-500/40 bg-success-500/10">
        <CheckCircle2
          className="mt-0.5 size-5 shrink-0 text-success-500"
          aria-hidden="true"
        />
        <div className="flex flex-col gap-1">
          <CardTitle>{messages.feedback.noteFromHan}</CardTitle>
          <Body>{evaluation.overallNotes}</Body>
        </div>
      </Card>
    </div>
  );
}
