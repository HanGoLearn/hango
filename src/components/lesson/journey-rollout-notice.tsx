import { SectionTitle, Body } from "@/components/ui/typography";
import { LessonRedoControl } from "@/components/lesson/lesson-redo-control";
import { journeyReportMessages } from "@/i18n/journey-report";
import type { AppLocale } from "@/i18n/config";

export function JourneyRolloutNotice({
  locale,
  lessonId,
  lessonSlug,
  scenarioSlug,
  unavailable = false,
}: {
  locale: AppLocale;
  lessonId: string;
  lessonSlug: string;
  scenarioSlug: string;
  unavailable?: boolean;
}) {
  const text = journeyReportMessages[locale];
  return (
    <section className="flex flex-col gap-4 rounded-panel border border-border bg-surface p-5">
      <SectionTitle>
        {unavailable ? text.setupTitle : text.legacyTitle}
      </SectionTitle>
      <Body>{unavailable ? text.setupNotice : text.legacyNotice}</Body>
      {!unavailable && (
        <LessonRedoControl
          lessonId={lessonId}
          lessonSlug={lessonSlug}
          scenarioSlug={scenarioSlug}
        />
      )}
    </section>
  );
}
