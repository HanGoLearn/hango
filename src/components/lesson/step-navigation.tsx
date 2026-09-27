"use client";

import {
  BookOpen,
  Headphones,
  Mic,
  MessageCircle,
  MessagesSquare,
  PenLine,
  PenTool,
  Sparkles,
  Target,
  HelpCircle,
  Flag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { LessonStepStatus } from "@/lib/lesson-progress";
import { useLessonMessages } from "@/components/lesson/lesson-messages";

/**
 * A distinct icon per step *type* (option "A" of the shell redesign, user
 * request 2026-08-08 - "camino de tablero") - color still communicates
 * *status* (locked/available/completed), same as before, but the icon now
 * says what kind of step it is at a glance, instead of 3 generic
 * lock/circle/check icons regardless of content.
 */
export const STEP_TYPE_ICON: Record<string, LucideIcon> = {
  VOCABULARY: BookOpen,
  SITUATION: MessageCircle,
  OBJECTIVE: MessageCircle,
  DIALOGUE: MessagesSquare,
  COMPREHENSION: Headphones,
  GRAMMAR: PenLine,
  GUIDED_PRACTICE: Target,
  SPEAKING: Mic,
  WRITING: PenTool,
  AI_CHALLENGE: Sparkles,
  QUIZ: HelpCircle,
  MISSION: Flag,
  REFLECTION: Sparkles,
};

/**
 * Shared with LessonHeader (2026-09-23), which names the step the learner
 * is on now that the nodes below no longer carry their own labels - one
 * mapping, so the bar and the path can never disagree.
 */
export function useStepTypeLabels(): Record<string, string> {
  const messages = useLessonMessages();
  return {
    SITUATION: messages.navigation.steps.situation,
    OBJECTIVE: messages.navigation.steps.objective,
    DIALOGUE: messages.navigation.steps.dialogue,
    COMPREHENSION: messages.navigation.steps.comprehension,
    VOCABULARY: messages.navigation.steps.vocabulary,
    GRAMMAR: messages.navigation.steps.grammar,
    GUIDED_PRACTICE: messages.navigation.steps.guidedPractice,
    SPEAKING: messages.navigation.steps.speaking,
    WRITING: messages.navigation.steps.writing,
    AI_CHALLENGE: messages.navigation.steps.aiChallenge,
    QUIZ: messages.navigation.steps.quiz,
    MISSION: messages.navigation.steps.mission,
    REFLECTION: messages.navigation.steps.reflection,
  };
}

/**
 * Icons only (2026-09-23, user-picked direction "B"). The path used to be
 * 64px-wide labelled columns on a horizontally scrolling rail, with Han
 * floating over the current one and a dashed connector behind - ~89px tall
 * and, with the old header above it, part of ~503px of chrome that repeated
 * on every one of a lesson's six steps before any content appeared.
 *
 * A lesson has six steps (seed.ts `createFullLesson`), so six flexible
 * nodes always fit one row at phone width without scrolling. The names
 * didn't fit beside them at ~52px per node, so the current step's name
 * moved up into LessonHeader; every node still carries its name and status
 * in `aria-label` and `title`, so nothing is lost to a screen reader or a
 * hover.
 *
 * The 32px circle sits inside a 44px-tall button: the visual stays compact
 * without dropping under the minimum touch target.
 */
export function StepNavigation({
  steps,
  statuses,
  currentStepId,
  onSelect,
}: {
  steps: { id: string; type: string; order: number }[];
  statuses: Map<string, LessonStepStatus>;
  currentStepId: string;
  onSelect: (stepId: string) => void;
}) {
  const messages = useLessonMessages();
  const stepLabels = useStepTypeLabels();
  const statusLabels: Record<LessonStepStatus, string> = {
    COMPLETED: messages.navigation.status.completed,
    AVAILABLE: messages.navigation.status.available,
    LOCKED: messages.navigation.status.locked,
  };
  return (
    <nav aria-label={messages.navigation.ariaLabel}>
      <ol className="flex items-center gap-1.5">
        {steps.map((step) => {
          const status = statuses.get(step.id) ?? "LOCKED";
          const Icon = STEP_TYPE_ICON[step.type] ?? MessageCircle;
          const isCurrent = step.id === currentStepId;
          const isDisabled = status === "LOCKED";
          const label = stepLabels[step.type] ?? step.type;

          return (
            <li key={step.id} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={isDisabled}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${label} — ${statusLabels[status]}`}
                title={label}
                onClick={() => onSelect(step.id)}
                className="flex w-full items-center justify-center py-1.5 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <span
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-full",
                    status === "COMPLETED" &&
                      "bg-secondary-500 text-on-color-light",
                    status === "AVAILABLE" &&
                      "bg-primary-500 text-on-color-light",
                    status === "LOCKED" && "bg-elevated text-text-muted",
                    // Gold, not the node's own colour: "you are here" has to
                    // read the same whether the current step is finished
                    // (green), open (red) or revisited.
                    isCurrent && "ring-2 ring-accent-300",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
