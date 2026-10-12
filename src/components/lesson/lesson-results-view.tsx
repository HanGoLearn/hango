"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { SectionTitle, Body } from "@/components/ui/typography";
import { getLessonReflectionReportAction } from "@/lib/actions/reflection";
import { LessonRedoControl } from "@/components/lesson/lesson-redo-control";
import { ReflectionReport } from "@/components/lesson/steps/reflection-step";
import type { LessonReflectionReportView } from "@/lib/reflection";
import { useLessonMessages } from "@/components/lesson/lesson-messages";
import { JourneyReportPanel } from "@/components/lesson/journey-report-panel";
import type { AppLocale } from "@/i18n/config";

type ReportState =
  | { status: "loading" }
  | { status: "ready"; report: LessonReflectionReportView }
  | { status: "error" };

/**
 * Shown instead of LessonEngine when a lesson is already completed
 * (2026-08-15 request: "finish lesson" should stop letting the learner
 * freely re-enter and redo steps - revisiting should surface the frozen
 * result, with an explicit "Try again" to reset it).
 */
export function LessonResultsView({
  lessonId,
  lessonTitle,
  lessonSlug,
  scenarioSlug,
  journeyReport = false,
  locale = "en",
}: {
  lessonId: string;
  lessonTitle: string;
  lessonSlug: string;
  scenarioSlug: string;
  journeyReport?: boolean;
  locale?: AppLocale;
}) {
  const messages = useLessonMessages();
  const [state, setState] = useState<ReportState>({ status: "loading" });

  useEffect(() => {
    if (journeyReport) return;
    let cancelled = false;
    void getLessonReflectionReportAction(lessonId).then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: "ready", report: result.report }
          : { status: "error" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [lessonId, journeyReport]);

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{lessonTitle}</SectionTitle>

      {journeyReport && (
        <JourneyReportPanel
          key={lessonId}
          lessonId={lessonId}
          locale={locale}
        />
      )}

      {!journeyReport && state.status === "loading" && (
        <div className="flex items-center gap-2 rounded-panel border border-border bg-surface px-4 py-6 text-text-secondary">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <Body>{messages.results.loading}</Body>
        </div>
      )}

      {!journeyReport && state.status === "error" && (
        <Body className="text-error-500" role="alert">
          {messages.results.error}
        </Body>
      )}

      {!journeyReport && state.status === "ready" && (
        <ReflectionReport report={state.report} lessonId={lessonId} />
      )}

      <LessonRedoControl
        lessonId={lessonId}
        lessonSlug={lessonSlug}
        scenarioSlug={scenarioSlug}
      />
    </div>
  );
}
