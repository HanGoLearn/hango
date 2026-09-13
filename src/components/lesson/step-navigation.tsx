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
import { Caption } from "@/components/ui/typography";
import { HanAvatar } from "@/components/ui/han-mascot";
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
  const stepLabels: Record<string, string> = {
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
  const statusLabels: Record<LessonStepStatus, string> = {
    COMPLETED: messages.navigation.status.completed,
    AVAILABLE: messages.navigation.status.available,
    LOCKED: messages.navigation.status.locked,
  };
  return (
    <nav aria-label={messages.navigation.ariaLabel} className="overflow-x-auto">
      <ol className="relative flex gap-3 px-1 pt-7 pb-1">
        <div
          aria-hidden="true"
          className="absolute top-[38px] right-8 left-8 h-0.5 border-t-2 border-dashed border-border"
        />
        {steps.map((step) => {
          const status = statuses.get(step.id) ?? "LOCKED";
          const Icon = STEP_TYPE_ICON[step.type] ?? MessageCircle;
          const isCurrent = step.id === currentStepId;
          const isDisabled = status === "LOCKED";
          const label = stepLabels[step.type] ?? step.type;

          return (
            <li key={step.id} className="relative z-10 shrink-0">
              {isCurrent && (
                <HanAvatar
                  pose="idle"
                  size={26}
                  className="absolute -top-7 left-1/2 -translate-x-1/2 ring-2 ring-page"
                />
              )}
              <button
                type="button"
                disabled={isDisabled}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${label} — ${statusLabels[status]}`}
                onClick={() => onSelect(step.id)}
                className={cn(
                  "flex w-16 flex-col items-center gap-1 disabled:pointer-events-none",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full ring-2 ring-page",
                    status === "COMPLETED" &&
                      "bg-secondary-500 text-on-color-light",
                    status === "AVAILABLE" &&
                      "bg-primary-500 text-on-color-light",
                    status === "LOCKED" && "bg-elevated text-text-muted",
                    isCurrent && status === "AVAILABLE" && "scale-110",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <Caption
                  className={cn(
                    "line-clamp-1 text-center",
                    status === "LOCKED" && "text-text-muted",
                  )}
                >
                  {label}
                </Caption>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
