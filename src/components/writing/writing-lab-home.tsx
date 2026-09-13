"use client";

import { useState } from "react";
import {
  PenLine,
  NotebookPen,
  Languages,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
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
import { HandwrittenParagraph } from "@/components/writing/handwritten-paragraph";
import type { AppLocale } from "@/i18n/config";
import type {
  DashboardMessages,
  WritingLabMessages,
} from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

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
 * (an independent, level-based handwritten catalog), Translation Challenge
 * (a standalone pool of ~15 topic-diverse texts, graded against a hidden
 * reference translation), and Custom Writing (learner-defined
 * characteristics, ephemeral - see custom-writing.tsx).
 */
export function WritingLabHome({
  translationChallenges,
  recentAttempts,
  locale,
  messages,
  levelMessages,
}: {
  translationChallenges: WritingTaskSummary[];
  recentAttempts: RecentAttemptSummary[];
  locale: AppLocale;
  messages: WritingLabMessages;
  levelMessages: DashboardMessages["levels"];
}) {
  const [view, setView] = useState<View>({ name: "home" });

  if (view.name === "session") {
    return (
      <WritingTaskSession
        task={view.task}
        onDone={() => setView({ name: "home" })}
        messages={messages}
      />
    );
  }

  if (view.name === "custom") {
    return (
      <CustomWriting
        onExit={() => setView({ name: "home" })}
        messages={messages}
        levelMessages={levelMessages}
      />
    );
  }

  if (view.name === "paragraph") {
    return (
      <HandwrittenParagraph
        onExit={() => setView({ name: "home" })}
        messages={messages}
      />
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
          {messages.common.back}
        </Button>
        <div className="flex flex-col gap-1">
          <PageTitle>{messages.home.translationTitle}</PageTitle>
          <Body className="text-text-secondary">
            {messages.translation.description}
          </Body>
        </div>

        {translationChallenges.length === 0 ? (
          <EmptyState
            title={messages.translation.emptyTitle}
            description={messages.translation.emptyDescription}
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
      <PageTitle>{messages.home.title}</PageTitle>

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
          <NotebookPen
            className="mb-2 size-5 text-primary-500"
            aria-hidden="true"
          />
          <CardTitle>{messages.home.paragraphTitle}</CardTitle>
          <Body className="text-text-secondary">
            {messages.home.paragraphDescription}
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
          <Languages
            className="mb-2 size-5 text-primary-500"
            aria-hidden="true"
          />
          <CardTitle>{messages.home.translationTitle}</CardTitle>
          <Body className="text-text-secondary">
            {translationChallenges.length
              ? formatMessage(messages.home.translationDescription, {
                  count: translationChallenges.length,
                })
              : messages.home.translationDescriptionFallback}
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
          <CardTitle className="text-neutral-0">
            {messages.home.customTitle}
          </CardTitle>
          <Body className="text-neutral-0/85">
            {messages.home.customDescription}
          </Body>
        </Card>
      </div>

      {recentAttempts.length > 0 && (
        <div className="flex flex-col gap-2">
          <SectionTitle>{messages.home.recentAttempts}</SectionTitle>
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
                    {new Date(attempt.submittedAt).toLocaleDateString(
                      locale === "es" ? "es-CO" : "en-US",
                    )}
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
