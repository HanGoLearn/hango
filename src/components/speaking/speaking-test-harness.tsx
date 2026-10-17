"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
} from "lucide-react";
import { SpeakingStep } from "@/components/lesson/steps/speaking-step";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Body, Caption, PageTitle } from "@/components/ui/typography";
import type { LessonWithContent } from "@/lib/content/lesson-data";
import type { SpeakingLessonOption } from "@/lib/content/speaking-prompts";
import {
  CHAPTER_CONFIG,
  DIFFICULTY_LABELS,
} from "@/lib/content/learning-journey";
import { localePath, type AppLocale } from "@/i18n/config";
import type { SpeakingLabMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

export function SpeakingTestHarness({
  locale,
  lesson,
  lessonOptions,
  messages,
}: {
  locale: AppLocale;
  lesson: LessonWithContent;
  lessonOptions: SpeakingLessonOption[];
  messages: SpeakingLabMessages["testHarness"];
}) {
  const router = useRouter();
  const currentIndex = lessonOptions.findIndex(
    (option) => option.id === lesson.id,
  );
  const previous = currentIndex > 0 ? lessonOptions[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < lessonOptions.length - 1
      ? lessonOptions[currentIndex + 1]
      : null;

  function openLesson(lessonId: string) {
    router.push(localePath(locale, `/speaking-test?lessonId=${lessonId}`));
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary-500">
            <FlaskConical className="size-5" aria-hidden="true" />
            <Caption className="font-semibold uppercase tracking-wide">
              {messages.eyebrow}
            </Caption>
          </div>
          <PageTitle>{messages.title}</PageTitle>
          <Body className="text-text-secondary">{messages.description}</Body>
        </div>
        <Button
          type="button"
          variant="tertiary"
          onClick={() => router.push(localePath(locale, "/speaking-lab"))}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {messages.exit}
        </Button>
      </div>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Caption className="font-semibold text-text-secondary">
            {formatMessage(messages.lessonCount, {
              current: currentIndex + 1,
              total: lessonOptions.length,
            })}
          </Caption>
          <select
            value={lesson.id}
            onChange={(event) => openLesson(event.target.value)}
            className="min-h-11 w-full rounded-control border border-border-strong bg-elevated px-3 font-interface text-body text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            {lessonOptions.map((option, index) => (
              <option key={option.id} value={option.id}>
                {index + 1}. {CHAPTER_CONFIG[option.chapter].title} —{" "}
                {option.scenarioTitle} —{" "}
                {DIFFICULTY_LABELS[option.difficulty] ?? option.difficulty} —{" "}
                {option.title}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!previous}
            onClick={() => previous && openLesson(previous.id)}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            {messages.previous}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!next}
            onClick={() => next && openLesson(next.id)}
          >
            {messages.next}
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-1 border-primary-500/30 bg-primary-500/5">
        <Caption className="font-semibold uppercase tracking-wide text-primary-500">
          {CHAPTER_CONFIG[lessonOptions[currentIndex]!.chapter].title} →{" "}
          {DIFFICULTY_LABELS[lessonOptions[currentIndex]!.difficulty] ??
            lessonOptions[currentIndex]!.difficulty}
        </Caption>
        <Body className="font-semibold text-text-primary">
          {lesson.scenarioLevel.scenario.name} — {lesson.title}
        </Body>
        <Caption className="text-text-secondary">
          {formatMessage(messages.objective, {
            objective: lesson.mission?.objective ?? messages.noMission,
          })}
        </Caption>
      </Card>

      <SpeakingStep
        lessonId={lesson.id}
        mission={lesson.mission}
        vocabulary={lesson.vocabulary}
        grammar={lesson.grammar}
        dialogues={lesson.dialogues}
        hskReference={lesson.hskReference}
        onContinue={() => next && openLesson(next.id)}
        testMode
      />
    </div>
  );
}
