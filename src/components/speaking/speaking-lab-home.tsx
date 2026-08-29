"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Repeat,
  Drama,
  MessagesSquare,
  ScrollText,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  FlaskConical,
  Lock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  CardTitle,
  Body,
  PageTitle,
  SectionTitle,
  Caption,
} from "@/components/ui/typography";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { SpeakingSession } from "@/components/speaking/speaking-session";
import { ConversationShadowing } from "@/components/speaking/conversation-shadowing";
import { FreeTopicPractice } from "@/components/speaking/free-topic-practice";
import { createSpeakingSessionAction } from "@/lib/actions/speaking";
import {
  JOURNEY_CHAPTER_ORDER,
  CHAPTER_CONFIG,
  type JourneyChapter,
} from "@/lib/content/learning-journey";
import { cn } from "@/lib/cn";
import type {
  SpeakingPrompt,
  SpeakingLessonOption,
} from "@/lib/content/speaking-prompts";

/** Same accent identity as the Learning Journey page's chapters (CHAPTER_CONFIG), re-styled for a tab button instead of a circular node. */
const TAB_ACCENT: Record<
  "secondary" | "accent" | "primary",
  { active: string; dot: string }
> = {
  secondary: {
    active: "border-secondary-300 bg-secondary-500/15 text-text-primary",
    dot: "bg-secondary-500",
  },
  accent: {
    active: "border-accent-300 bg-accent-500/15 text-text-primary",
    dot: "bg-accent-500",
  },
  primary: {
    active: "border-primary-300 bg-primary-500/15 text-text-primary",
    dot: "bg-primary-500",
  },
};

type ActivityType = "SHADOWING" | "SCENARIO_ROLE_PLAY";

type View =
  | { name: "home" }
  | { name: "free-practice" }
  | { name: "shadowing-picker" }
  | { name: "shadowing-conversation" }
  | {
      name: "session";
      sessionId: string;
      activityType: ActivityType;
      prompt: string;
      pinyin?: string;
      dialogueId?: string;
    };

/**
 * Locked for the Pre-MVP release (user request, 2026-08-23) - both modes
 * are fully built and working, just deliberately hidden behind a lock icon
 * for this release. Pending: project/TASKS.md tracks re-enabling this by
 * flipping `locked` back to false - no other code change needed.
 */
const MODES: {
  type: ActivityType;
  title: string;
  description: string;
  icon: typeof Repeat;
  locked?: boolean;
}[] = [
  {
    type: "SHADOWING",
    title: "Shadowing",
    description: "Repeat a real conversation or a long passage, with pinyin.",
    icon: Repeat,
    locked: true,
  },
  {
    type: "SCENARIO_ROLE_PLAY",
    title: "Scenario Role Play",
    description: "Respond in character to the scenario's mission.",
    icon: Drama,
    locked: true,
  },
];

export function SpeakingLabHome({
  prompts,
  lessonOptions,
  activeLessonId,
  showSpeakingTestMode = false,
}: {
  prompts: Record<ActivityType, SpeakingPrompt | null>;
  lessonOptions: SpeakingLessonOption[];
  activeLessonId: string | null;
  showSpeakingTestMode?: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>({ name: "home" });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState<JourneyChapter | null>(
    null,
  );
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);

  const currentOption =
    lessonOptions.find((option) => option.id === activeLessonId) ?? null;

  const optionsByChapter = useMemo(() => {
    const map = new Map<JourneyChapter, SpeakingLessonOption[]>();
    for (const option of lessonOptions) {
      const bucket = map.get(option.chapter) ?? [];
      bucket.push(option);
      map.set(option.chapter, bucket);
    }
    return map;
  }, [lessonOptions]);

  const availableChapters = JOURNEY_CHAPTER_ORDER.filter(
    (chapter) => (optionsByChapter.get(chapter) ?? []).length > 0,
  );

  function scenariosForChapter(chapter: JourneyChapter) {
    const byScenario = new Map<
      string,
      { title: string; options: SpeakingLessonOption[] }
    >();
    for (const option of optionsByChapter.get(chapter) ?? []) {
      const bucket = byScenario.get(option.scenarioSlug) ?? {
        title: option.scenarioTitle,
        options: [],
      };
      bucket.options.push(option);
      byScenario.set(option.scenarioSlug, bucket);
    }
    return [...byScenario.entries()];
  }

  function openPicker() {
    const chapter = currentOption?.chapter ?? availableChapters[0] ?? null;
    setActiveChapter(chapter);
    setExpandedScenario(currentOption?.scenarioSlug ?? null);
    setPickerOpen(true);
  }

  function selectLesson(lessonId: string) {
    setPickerOpen(false);
    router.push(`/speaking-lab?lessonId=${lessonId}`);
  }

  async function handleStart(mode: ActivityType) {
    if (mode === "SHADOWING") {
      setView({ name: "shadowing-picker" });
      return;
    }
    await startFlatSession(mode);
  }

  async function startFlatSession(mode: ActivityType) {
    const promptData = prompts[mode];
    if (!promptData) return;

    const { sessionId } = await createSpeakingSessionAction(
      mode,
      promptData.prompt,
      { lessonId: promptData.lessonId, scenarioId: promptData.scenarioId },
    );
    setView({
      name: "session",
      sessionId,
      activityType: mode,
      prompt: promptData.prompt,
      pinyin: promptData.pinyin,
      dialogueId: promptData.dialogueId,
    });
  }

  if (view.name === "free-practice") {
    return <FreeTopicPractice onExit={() => setView({ name: "home" })} />;
  }

  if (view.name === "session") {
    return (
      <SpeakingSession
        sessionId={view.sessionId}
        activityType={view.activityType}
        prompt={view.prompt}
        pinyin={view.pinyin}
        dialogueId={view.dialogueId}
      />
    );
  }

  if (view.name === "shadowing-conversation") {
    const shadowing = prompts.SHADOWING;
    if (!shadowing?.lines || !shadowing.dialogueId) {
      return (
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            variant="tertiary"
            className="w-fit gap-1.5 px-0"
            onClick={() => setView({ name: "home" })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          <EmptyState
            title="Conversation unavailable"
            description="This lesson doesn't have dialogue content to shadow."
          />
        </div>
      );
    }
    return (
      <ConversationShadowing
        lines={shadowing.lines}
        lessonId={shadowing.lessonId}
        dialogueId={shadowing.dialogueId}
        onExit={() => setView({ name: "home" })}
      />
    );
  }

  if (view.name === "shadowing-picker") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="tertiary"
            className="gap-1.5 px-0"
            onClick={() => setView({ name: "home" })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          <PageTitle>Shadowing</PageTitle>
          <Body className="text-text-secondary">
            Choose how you want to practice this lesson&apos;s dialogue.
          </Body>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card
            interactive
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => setView({ name: "shadowing-conversation" })}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setView({ name: "shadowing-conversation" });
              }
            }}
          >
            <MessagesSquare
              className="mb-2 size-5 text-primary-500"
              aria-hidden="true"
            />
            <CardTitle>Conversation</CardTitle>
            <Body className="text-text-secondary">
              Shadow the lesson&apos;s real dialogue, one turn at a time, like a
              chat.
            </Body>
          </Card>

          <Card
            interactive
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => void startFlatSession("SHADOWING")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                void startFlatSession("SHADOWING");
              }
            }}
          >
            <ScrollText
              className="mb-2 size-5 text-primary-500"
              aria-hidden="true"
            />
            <CardTitle>Long text</CardTitle>
            <Body className="text-text-secondary">
              Shadow the whole dialogue as one continuous passage, pinyin always
              shown.
            </Body>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <PageTitle>Speaking Lab</PageTitle>
        <Body className="text-text-secondary">
          Practice out loud with real feedback, including a tone-match score
          computed from your own recording.
        </Body>
      </div>

      {/* accent-600 doesn't exist in the palette (only 50/100/300/500/700
          are defined) - that gradient stop was silently inert. Fixed to
          accent-700, matching the lesson engine's own hero gradients
          (situation-step.tsx etc: "...to-accent-700"). text-neutral-0 also
          fixed to text-on-color-light - the same on-color-token bug found
          and fixed ~25+ times elsewhere this session, here on the screen's
          single most prominent element. */}
      <Card
        interactive
        className="cursor-pointer overflow-hidden bg-linear-to-br from-primary-700 via-primary-600 to-accent-700 text-on-color-light"
        role="button"
        tabIndex={0}
        onClick={() => setView({ name: "free-practice" })}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setView({ name: "free-practice" });
          }
        }}
      >
        <Sparkles
          className="mb-2 size-5 text-on-color-light"
          aria-hidden="true"
        />
        <CardTitle className="text-on-color-light">Practice with Han</CardTitle>
        <Body className="text-on-color-light/85">
          Pick any topic, set the level and speed, and have a live spoken
          conversation built around exactly what you want to practice.
        </Body>
      </Card>

      {showSpeakingTestMode && (
        <Card className="flex flex-col gap-3 border-primary-500/30 bg-primary-500/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FlaskConical
              className="mt-0.5 size-5 shrink-0 text-primary-500"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-1">
              <CardTitle>Speaking test mode</CardTitle>
              <Body className="text-text-secondary">
                Open the exact Speaking step from any lesson without changing
                your Learning Journey progress.
              </Body>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            onClick={() => router.push("/speaking-test")}
          >
            Open test mode
          </Button>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
        <SectionTitle>Practice a lesson</SectionTitle>

        {lessonOptions.length > 0 && (
          <button
            type="button"
            aria-expanded={pickerOpen}
            onClick={() => (pickerOpen ? setPickerOpen(false) : openPicker())}
            className="flex items-center gap-2 rounded-full border border-border-strong bg-elevated px-3 py-1.5 font-interface text-caption text-text-secondary transition-colors duration-fast ease-standard hover:border-primary-300 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          >
            <span className="font-semibold text-text-primary">
              {currentOption
                ? `${currentOption.scenarioTitle} — ${currentOption.title}`
                : "Choose a lesson"}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-text-muted transition-transform duration-fast ease-standard",
                pickerOpen && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {pickerOpen && (
        <Card className="flex flex-col gap-3">
          <div className="flex gap-1.5">
            {availableChapters.map((chapter) => {
              const config = CHAPTER_CONFIG[chapter];
              const tabAccent = TAB_ACCENT[config.accent];
              const isActive = chapter === activeChapter;
              return (
                <button
                  key={chapter}
                  type="button"
                  onClick={() => {
                    setActiveChapter(chapter);
                    setExpandedScenario(null);
                  }}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-control border px-2 py-2 font-interface text-caption font-semibold transition-colors duration-fast ease-standard",
                    isActive
                      ? tabAccent.active
                      : "border-border bg-elevated text-text-secondary hover:border-border-strong",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      tabAccent.dot,
                    )}
                    aria-hidden="true"
                  />
                  {config.title}
                </button>
              );
            })}
          </div>

          {activeChapter &&
            (expandedScenario ? (
              <>
                <button
                  type="button"
                  onClick={() => setExpandedScenario(null)}
                  className="w-fit font-interface text-caption text-primary-300 hover:underline"
                >
                  ← {CHAPTER_CONFIG[activeChapter].title}
                </button>
                <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
                  {(optionsByChapter.get(activeChapter) ?? [])
                    .filter(
                      (option) => option.scenarioSlug === expandedScenario,
                    )
                    .map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => selectLesson(option.id)}
                        className="rounded-control border border-border bg-elevated px-3 py-2 text-left font-interface text-caption text-text-primary transition-colors duration-fast ease-standard hover:border-primary-300"
                      >
                        {option.title}
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3">
                {scenariosForChapter(activeChapter).map(([slug, group]) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setExpandedScenario(slug)}
                    className="flex flex-col gap-0.5 rounded-control border border-border bg-elevated px-3 py-2 text-left transition-colors duration-fast ease-standard hover:border-primary-300"
                  >
                    <Caption className="font-medium text-text-primary">
                      {group.title}
                    </Caption>
                    <Caption className="text-text-muted">
                      {group.options.length} lesson
                      {group.options.length === 1 ? "" : "s"}
                    </Caption>
                  </button>
                ))}
              </div>
            ))}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODES.map((mode) => {
          const locked = mode.locked ?? false;
          const available = !locked && prompts[mode.type] !== null;
          const Icon = mode.icon;
          return (
            <Card
              key={mode.type}
              interactive={available}
              className={available ? "cursor-pointer" : "opacity-50"}
              role={available ? "button" : undefined}
              tabIndex={available ? 0 : undefined}
              onClick={
                available ? () => void handleStart(mode.type) : undefined
              }
              onKeyDown={
                available
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void handleStart(mode.type);
                      }
                    }
                  : undefined
              }
            >
              <div className="mb-2 flex items-center justify-between">
                <Icon className="size-5 text-primary-500" aria-hidden="true" />
                {locked && (
                  <Lock
                    className="size-4 text-text-muted"
                    aria-label="Locked"
                  />
                )}
              </div>
              <CardTitle>{mode.title}</CardTitle>
              <Body className="text-text-secondary">{mode.description}</Body>
              {locked ? (
                <Body className="mt-1 text-text-muted">Coming soon.</Body>
              ) : (
                !available && (
                  <Body className="mt-1 text-text-muted">
                    Not available yet — no content for this mode.
                  </Body>
                )
              )}
            </Card>
          );
        })}
      </div>

      {Object.values(prompts).every((p) => p === null) && (
        <EmptyState
          title="Nothing to practice yet"
          description="Speaking activities will appear here once lesson content is available."
        />
      )}
    </div>
  );
}
