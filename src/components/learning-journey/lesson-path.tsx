import Link from "next/link";
import { Check, Play, Lock, Star, GraduationCap } from "lucide-react";
import { HanAvatar } from "@/components/ui/han-mascot";
import type { LessonAvailabilityStatus } from "@/lib/content/learning-journey";
import { REFLECTION_PASS_SCORE } from "@/lib/points-system";
import { cn } from "@/lib/cn";

export interface LessonPathItem {
  id: string;
  slug: string;
  title: string;
  availability: LessonAvailabilityStatus;
  reflectionTotalScore: number | null;
  /** Null for a lesson with no completion at all yet. "PLACEMENT" means the
   * points came from a placement-exam credit, not a real attempt - see
   * placement-credit.ts. Drives the "Placed by exam" badge below, which
   * exists to invite the learner to do the lesson for real, not to look
   * like a genuine completion. */
  source?: "PLACEMENT" | "COMPLETED" | null;
}

const STATUS_ICON: Record<LessonAvailabilityStatus, typeof Lock> = {
  COMPLETED: Check,
  AVAILABLE: Play,
  LOCKED: Lock,
};

const STATUS_LABEL: Record<LessonAvailabilityStatus, string> = {
  COMPLETED: "Completed",
  AVAILABLE: "Available",
  LOCKED: "Locked",
};

/**
 * "Refined path" direction (2026-08-21, approved over two other directions
 * compared in an artifact - project/learning-journey-optimization.md):
 * straightens the old left/right zigzag trail (DESIGN_TASKS.md Phase 5's
 * Duolingo "Learn" screen reference - the exact game-board language the
 * user's original brief asked to avoid) into a single vertical line, with
 * smaller nodes and labels beside them instead of the large floating
 * HanMascot + centered labels below each node. Still a path - lessons are
 * strictly sequential, so a connecting line still earns its place - just
 * without the theatrics.
 */
export function LessonPath({
  lessons,
  finalMissionTitle,
}: {
  lessons: LessonPathItem[];
  finalMissionTitle?: string;
}) {
  const currentIndex = lessons.findIndex(
    (lesson) => lesson.availability === "AVAILABLE",
  );

  return (
    <div className="relative mx-auto flex w-full max-w-sm flex-col gap-5 py-2">
      <div
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-5 w-px bg-border"
      />

      {lessons.map((lesson, index) => {
        const Icon = STATUS_ICON[lesson.availability];
        const isCurrent = index === currentIndex;

        const node = (
          <div className="relative z-10 flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full ring-4 ring-page transition-colors",
                lesson.availability === "COMPLETED" &&
                  "bg-secondary-500 text-on-color-light",
                lesson.availability === "AVAILABLE" &&
                  "bg-primary-500 text-on-color-light",
                lesson.availability === "LOCKED" &&
                  "bg-elevated text-text-muted",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="flex flex-1 flex-col gap-0.5 text-left">
              <span
                className={cn(
                  "font-interface text-body text-text-secondary",
                  lesson.availability === "LOCKED"
                    ? "text-text-muted"
                    : "font-medium text-text-primary",
                )}
              >
                {lesson.title}
              </span>
              {lesson.availability === "COMPLETED" &&
                lesson.source === "PLACEMENT" && (
                  <span
                    className="inline-flex w-fit items-center gap-1 rounded-full bg-accent-500/15 px-2 py-0.5 font-interface text-caption font-semibold text-accent-300"
                    title="Complete it yourself to confirm or improve your score."
                  >
                    <GraduationCap className="size-3" aria-hidden="true" />
                    Placed by exam
                  </span>
                )}
              {lesson.availability === "COMPLETED" &&
                lesson.source !== "PLACEMENT" &&
                lesson.reflectionTotalScore !== null && (
                  <span
                    className={cn(
                      "w-fit rounded-full px-2 py-0.5 font-interface text-caption font-semibold",
                      lesson.reflectionTotalScore >= REFLECTION_PASS_SCORE
                        ? "bg-secondary-500/15 text-secondary-300"
                        : "bg-warning-500/15 text-warning-500",
                    )}
                  >
                    {lesson.reflectionTotalScore}/100
                  </span>
                )}
            </div>
            {/* Small avatar marker, not the old size-56 floating HanMascot
                illustration - Han still marks the current lesson, just
                scaled to fit this more contained layout instead of
                overhanging above a now much narrower row. */}
            {isCurrent && <HanAvatar pose="wave" size={26} />}
            <span className="sr-only">{STATUS_LABEL[lesson.availability]}</span>
          </div>
        );

        return (
          <div key={lesson.id}>
            {lesson.availability === "LOCKED" ? (
              node
            ) : (
              <Link
                href={`/lesson/${lesson.slug}`}
                className="block rounded-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              >
                {node}
              </Link>
            )}
          </div>
        );
      })}

      {finalMissionTitle && (
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent-500 to-primary-500 text-on-color-light ring-4 ring-page">
            <Star className="size-4" aria-hidden="true" />
          </span>
          <span className="font-interface text-body font-semibold text-accent-300">
            {finalMissionTitle}
          </span>
        </div>
      )}
    </div>
  );
}
