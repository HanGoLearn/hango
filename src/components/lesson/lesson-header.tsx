import Link from "next/link";
import { X, Cloud, CloudUpload, MessageCircle } from "lucide-react";
import { PageTitle, Caption, Body } from "@/components/ui/typography";
import { ProgressBar } from "@/components/ui/progress-bar";
import { STEP_TYPE_ICON } from "@/components/lesson/step-navigation";
import { localePath, type AppLocale } from "@/i18n/config";
import { useLessonMessages } from "@/components/lesson/lesson-messages";
import { formatMessage } from "@/i18n/format";

export function LessonHeader({
  scenarioName,
  scenarioSlug,
  lessonTitle,
  communicationObjective,
  currentStepType,
  completedCount,
  totalCount,
  saving,
  locale,
}: {
  scenarioName: string;
  scenarioSlug: string;
  lessonTitle: string;
  communicationObjective: string;
  currentStepType: string;
  completedCount: number;
  totalCount: number;
  saving: boolean;
  locale: AppLocale;
}) {
  const messages = useLessonMessages();
  const CurrentStepIcon = STEP_TYPE_ICON[currentStepType] ?? MessageCircle;

  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-control bg-primary-500 text-on-color-light"
          >
            <CurrentStepIcon className="size-4" />
          </span>
          <div className="flex flex-col gap-1">
            <Caption>{scenarioName}</Caption>
            <PageTitle>{lessonTitle}</PageTitle>
            <Body className="text-text-secondary">
              {communicationObjective}
            </Body>
          </div>
        </div>
        <Link
          href={localePath(locale, `/learning-journey/${scenarioSlug}`)}
          aria-label={messages.header.exit}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-text-secondary transition-colors duration-fast ease-standard hover:bg-elevated hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
      </div>

      <ProgressBar
        value={totalCount === 0 ? 0 : (completedCount / totalCount) * 100}
        label={formatMessage(messages.header.progress, {
          completed: completedCount,
          total: totalCount,
        })}
        className="h-3"
        indicatorClassName="bg-linear-to-r from-secondary-500 to-accent-500"
      />

      <div
        role="status"
        className="flex items-center gap-1.5 text-caption text-text-muted"
      >
        {saving ? (
          <>
            <CloudUpload
              className="size-3.5 animate-pulse"
              aria-hidden="true"
            />
            {messages.header.saving}
          </>
        ) : (
          <>
            <Cloud className="size-3.5" aria-hidden="true" />
            {messages.header.saved}
          </>
        )}
      </div>
    </div>
  );
}
