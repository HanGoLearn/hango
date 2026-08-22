"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PenLine, NotebookPen, Languages, Sparkles, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CardTitle,
  Body,
  Caption,
  PageTitle,
  SectionTitle,
} from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/states";
import {
  WritingTaskSession,
  type WritingTaskSummary,
} from "@/components/writing/writing-task-session";
import { CustomWriting } from "@/components/writing/custom-writing";
import type { WritingLessonOption } from "@/lib/writing-data";

export interface RecentAttemptSummary {
  id: string;
  taskTitle: string;
  submittedAt: string;
}

type View =
  | { name: "home" }
  | { name: "paragraph" }
  | { name: "translation" }
  | { name: "custom" }
  | { name: "session"; task: WritingTaskSummary };

/**
 * Writing Lab redesign (user ask, 2026-08-08 round 2): three distinct
 * options instead of one flat catalog grouped by type - Write a Paragraph
 * (lesson-scoped, mirrors Speaking Lab's structure), Translation Challenge
 * (a standalone pool of ~15 topic-diverse texts, graded against a hidden
 * reference translation), and Custom Writing (learner-defined
 * characteristics, ephemeral - see custom-writing.tsx).
 */
export function WritingLabHome({
  paragraphTasks,
  lessonOptions,
  activeLessonId,
  translationChallenges,
  recentAttempts,
}: {
  paragraphTasks: WritingTaskSummary[];
  lessonOptions: WritingLessonOption[];
  activeLessonId: string | null;
  translationChallenges: WritingTaskSummary[];
  recentAttempts: RecentAttemptSummary[];
}) {
  const router = useRouter();
  const [view, setView] = useState<View>({ name: "home" });

  if (view.name === "session") {
    return (
      <WritingTaskSession
        task={view.task}
        onDone={() => setView({ name: "home" })}
      />
    );
  }

  if (view.name === "custom") {
    return <CustomWriting onExit={() => setView({ name: "home" })} />;
  }

  if (view.name === "paragraph") {
    const task = paragraphTasks[0] ?? null;
    return (
      <div className="flex flex-col gap-6">
        <Button
          type="button"
          variant="tertiary"
          className="w-fit gap-1.5 px-0"
          onClick={() => setView({ name: "home" })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <PageTitle>Write a Paragraph</PageTitle>

        {lessonOptions.length > 0 && (
          <label className="flex flex-col gap-1.5">
            <Caption className="font-semibold uppercase tracking-wide text-text-secondary">
              Practice content from
            </Caption>
            <select
              value={activeLessonId ?? ""}
              onChange={(event) =>
                router.push(`/writing-lab?lessonId=${event.target.value}`)
              }
              className="w-full max-w-sm rounded-control border border-border bg-surface px-3 py-2 font-interface text-body text-text-primary"
            >
              {lessonOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.scenarioTitle} — {option.title}
                </option>
              ))}
            </select>
          </label>
        )}

        {task ? (
          <Card
            interactive
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => setView({ name: "session", task })}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setView({ name: "session", task });
              }
            }}
          >
            <CardTitle>{task.title}</CardTitle>
            <Body className="text-text-secondary">{task.prompt}</Body>
          </Card>
        ) : (
          <EmptyState
            title="Nothing to practice yet"
            description="This lesson doesn't have a writing task yet."
          />
        )}
      </div>
    );
  }

  if (view.name === "translation") {
    return (
      <div className="flex flex-col gap-6">
        <Button
          type="button"
          variant="tertiary"
          className="w-fit gap-1.5 px-0"
          onClick={() => setView({ name: "home" })}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
        <div className="flex flex-col gap-1">
          <PageTitle>Translation Challenge</PageTitle>
          <Body className="text-text-secondary">
            Pick a text, translate it into Chinese, and Han will tell you how accurate it was and what to improve.
          </Body>
        </div>

        {translationChallenges.length === 0 ? (
          <EmptyState
            title="Nothing to practice yet"
            description="Translation texts will appear here once content is available."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {translationChallenges.map((task) => (
              <Card
                key={task.id}
                interactive
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => setView({ name: "session", task })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setView({ name: "session", task });
                  }
                }}
              >
                <Caption>{task.title}</Caption>
                <Body className="text-text-secondary">{task.prompt}</Body>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>Writing Lab</PageTitle>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card
          interactive
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => setView({ name: "paragraph" })}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setView({ name: "paragraph" });
            }
          }}
        >
          <NotebookPen className="mb-2 size-5 text-primary-500" aria-hidden="true" />
          <CardTitle>Write a Paragraph</CardTitle>
          <Body className="text-text-secondary">
            Write about this lesson&apos;s topic and get graded feedback.
          </Body>
        </Card>

        <Card
          interactive
          className="cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => setView({ name: "translation" })}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setView({ name: "translation" });
            }
          }}
        >
          <Languages className="mb-2 size-5 text-primary-500" aria-hidden="true" />
          <CardTitle>Translation Challenge</CardTitle>
          <Body className="text-text-secondary">
            Translate one of {translationChallenges.length || "several"} short texts into Chinese.
          </Body>
        </Card>

        <Card
          interactive
          className="cursor-pointer overflow-hidden bg-linear-to-br from-primary-700 via-primary-600 to-accent-600 text-neutral-0"
          role="button"
          tabIndex={0}
          onClick={() => setView({ name: "custom" })}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setView({ name: "custom" });
            }
          }}
        >
          <Sparkles className="mb-2 size-5 text-neutral-0" aria-hidden="true" />
          <CardTitle className="text-neutral-0">Custom Writing</CardTitle>
          <Body className="text-neutral-0/85">
            Set your own topic, level, format, and tone.
          </Body>
        </Card>
      </div>

      {recentAttempts.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>Recent attempts</SectionTitle>
          <div className="flex flex-col gap-2">
            {recentAttempts.map((attempt) => (
              <Card
                key={attempt.id}
                className="flex flex-row items-center gap-3"
              >
                <PenLine
                  className="size-4 text-primary-500"
                  aria-hidden="true"
                />
                <div className="flex flex-col">
                  <Body>{attempt.taskTitle}</Body>
                  <Caption>
                    {new Date(attempt.submittedAt).toLocaleDateString()}
                  </Caption>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
