import Link from "next/link";
import { AlertCircle, ArrowLeft, Cloud, CloudUpload } from "lucide-react";
import { Caption } from "@/components/ui/typography";
import { useStepTypeLabels } from "@/components/lesson/step-navigation";
import { localePath, type AppLocale } from "@/i18n/config";
import { useLessonMessages } from "@/components/lesson/lesson-messages";
import { formatMessage } from "@/i18n/format";

/**
 * The lesson's slim bar (2026-09-23, user-picked direction "B"). This used
 * to be a ~298px block: the scenario name, the lesson title at 30px, the
 * whole communication objective as a paragraph, a labelled progress bar
 * with a percentage, and the save state on its own row - none of which
 * changes while a learner works through the lesson's six steps, so all of
 * it repeated six times and pushed the actual content below the fold.
 *
 * What went where:
 * - The objective is gone from here. SituationStep already prints the same
 *   string in its Han panel, so it was rendered twice on step one, ~150px
 *   apart. Now it appears once, on the step whose job is to set the scene.
 * - The scenario name is gone: the back arrow goes there.
 * - Four progress indicators (bar, "x de y pasos", a percentage, and the
 *   path below) became one compact ratio; the path carries the rest.
 * - Saving is an icon, not a row - the wording stays for screen readers.
 *
 * The title stays an `<h1>`, just at interface size: mid-lesson it is
 * orientation, not a headline.
 */
export function LessonHeader({
  scenarioSlug,
  lessonTitle,
  currentStepType,
  position,
  totalCount,
  saving,
  saveError = false,
  locale,
}: {
  scenarioSlug: string;
  lessonTitle: string;
  currentStepType: string;
  /** 1-based index of the step being shown, not the completed count - what a learner wants here is where they are. */
  position: number;
  totalCount: number;
  saving: boolean;
  /**
   * 2026-09-26: a rejected save (e.g. a stale step-jump) used to throw
   * uncaught, which crashed the whole route to the generic "no pudimos
   * cargar esta lección" boundary - lesson-engine.tsx now catches it and
   * surfaces it here instead, so the learner sees a small, recoverable
   * signal and stays on the page.
   */
  saveError?: boolean;
  locale: AppLocale;
}) {
  const messages = useLessonMessages();
  const stepLabel = useStepTypeLabels()[currentStepType] ?? currentStepType;

  return (
    <div className="flex items-center gap-2.5">
      <Link
        href={localePath(locale, `/learning-journey/${scenarioSlug}`)}
        aria-label={messages.header.exit}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-text-secondary transition-colors duration-fast ease-standard hover:bg-elevated hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <ArrowLeft className="size-5" aria-hidden="true" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate font-interface text-body font-semibold text-text-primary">
          {lessonTitle}
        </h1>
        {/* Carries the name the path's icons no longer show. */}
        <Caption className="truncate">{stepLabel}</Caption>
      </div>

      <div role="status" className="flex shrink-0 items-center text-text-muted">
        {saveError ? (
          <AlertCircle className="size-4 text-error-500" aria-hidden="true" />
        ) : saving ? (
          <CloudUpload className="size-4 animate-pulse" aria-hidden="true" />
        ) : (
          <Cloud className="size-4" aria-hidden="true" />
        )}
        <span className="sr-only">
          {saveError
            ? messages.header.saveError
            : saving
              ? messages.header.saving
              : messages.header.saved}
        </span>
      </div>

      {/* "2/6" reads as a ratio to anyone looking at it and as nothing at
          all to a screen reader, so the full sentence follows it. */}
      <span
        className="shrink-0 font-interface text-caption font-semibold text-text-secondary"
        aria-hidden="true"
      >
        {position}/{totalCount}
      </span>
      <span className="sr-only">
        {formatMessage(messages.header.progress, {
          completed: position,
          total: totalCount,
        })}
      </span>
    </div>
  );
}
