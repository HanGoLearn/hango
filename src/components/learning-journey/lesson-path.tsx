import Link from "next/link";
import { Check, Play, Lock, Star, GraduationCap } from "lucide-react";
import { HanAvatar } from "@/components/ui/han-mascot";
import { Chip } from "@/components/ui/chip";
import type { LessonAvailabilityStatus } from "@/lib/content/learning-journey";
import { starsForScore } from "@/lib/points-system";
import { cn } from "@/lib/cn";
import { localePath, type AppLocale } from "@/i18n/config";
import type { AppMessages } from "@/i18n/messages/types";

// Every 4th lesson in a level gets the "checkpoint" treatment (2026-08-29,
// Milestone 3 - "milestone markers every few lessons"), reusing the final-
// mission node's gradient rather than inventing a new visual language.
// Only COMPLETED/AVAILABLE nodes get it - a bright gradient on a LOCKED
// node would look like a broken affordance (accessible-looking but isn't).
const MILESTONE_EVERY = 4;

/** aria-hidden - the numeric score this stands in for is already read out by the "X/100" the parent renders alongside it in spirit; this is the friendlier at-a-glance version of the same real Reflection totalScore, not new data. */
function StarRow({ score }: { score: number }) {
  const filled = starsForScore(score);
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-3",
            n <= filled
              ? "fill-accent-300 text-accent-300"
              : "fill-none text-border",
          )}
        />
      ))}
    </span>
  );
}

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
 *
 * Milestone 3 pass (2026-08-29): bigger nodes (size-10 -> size-12),
 * checkpoint styling every MILESTONE_EVERY lessons, real inline star
 * ratings replacing the bare "X/100" chip, a dashed curved connector, and
 * a gentle left/right sway on alternating nodes - user-picked "B" from a
 * 3-way comparison Artifact ("the node sways, the text doesn't"): only
 * the icon offsets per row (`ROW_SHIFT_PX`), the title/badges column
 * stays put, so this keeps fast vertical scanning while still reading as
 * alive - the earlier full zigzag board (2026-08-21) was moved away from
 * specifically because shifting the *text* too made every row a fresh
 * left/right eye-jump.
 */
const ROW_SHIFT_PX = 28;
export function LessonPath({
  lessons,
  finalMissionTitle,
  locale,
  messages,
}: {
  lessons: LessonPathItem[];
  finalMissionTitle?: string;
  locale: AppLocale;
  messages: AppMessages["learningJourney"]["lessonPath"];
}) {
  const currentIndex = lessons.findIndex(
    (lesson) => lesson.availability === "AVAILABLE",
  );

  return (
    <div className="relative mx-auto flex w-full max-w-sm flex-col gap-6 py-2">
      {/* A genuinely curved connector (2026-08-29, Bytemigo-inspired
          refinement), not a straight line - built as one continuous,
          self-contained wave instead of trying to align a path to each
          node's real pixel position (which would need measuring the DOM).
          Every join in the `d` below has a matching vertical tangent on
          both sides by construction (each control point shares its
          anchor's x), so the curve is smooth by math, not by eyeballing -
          `preserveAspectRatio="none"` lets the same 2-period wave stretch
          to fill however tall this list ends up (more/fewer lessons),
          without ever producing a visible kink. Dashed (user picked this
          option from a 4-way comparison artifact, "D") - the specific
          Bytemigo detail worth assimilating: a dashed stroke reads as "a
          path," solid reads as a strict progress rail, and this is closer
          to the former.

          The outer plain `<div>` wrapper is load-bearing, not decorative
          (2026-08-29 fix - "solo ve una raya entre la primera y la
          segunda"): an absolutely-positioned SVG with `height:auto` is a
          replaced element, so browsers size it from the viewBox's own
          intrinsic ratio (32:100 -> a fixed ~100px) instead of stretching
          between `top`/`bottom` - only non-replaced elements auto-stretch
          that way. Sizing this plain div to the full list height first
          (guaranteed, ordinary abspos behavior), then filling it with an
          `h-full w-full` svg, sidesteps the replaced-element special case
          entirely instead of fighting it.

          Widened + re-centered (2026-08-29, alongside the sway above) so
          the wave's two x-extremes (24, 52) roughly line up with a
          "home" icon's center (24 = half of size-12's 48px) and a
          shifted icon's center (24 + ROW_SHIFT_PX). Still not tracking
          real per-node pixel Y positions - same reasoning as above, just
          now also matching the sway's X range instead of floating
          independently of it. */}
      <div
        aria-hidden="true"
        className="absolute top-3 bottom-3 left-0 w-16 text-border"
      >
        <svg
          className="h-full w-full"
          viewBox="0 0 64 100"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M38,0 C38,6.25 52,6.25 52,12.5 C52,18.75 38,18.75 38,25 C38,31.25 24,31.25 24,37.5 C24,43.75 38,43.75 38,50 C38,56.25 52,56.25 52,62.5 C52,68.75 38,68.75 38,75 C38,81.25 24,81.25 24,87.5 C24,93.75 38,93.75 38,100"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {lessons.map((lesson, index) => {
        const Icon = STATUS_ICON[lesson.availability];
        const isCurrent = index === currentIndex;
        const isMilestone =
          (index + 1) % MILESTONE_EVERY === 0 &&
          lesson.availability !== "LOCKED";

        const node = (
          <div
            className="relative z-10 flex items-center gap-3"
            style={index % 2 === 1 ? { paddingLeft: ROW_SHIFT_PX } : undefined}
          >
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-full ring-4 ring-page transition-colors",
                lesson.availability === "COMPLETED" &&
                  (isMilestone
                    ? "bg-linear-to-br from-accent-500 to-primary-500 text-on-color-light"
                    : "bg-secondary-500 text-on-color-light"),
                lesson.availability === "AVAILABLE" &&
                  (isMilestone
                    ? "bg-linear-to-br from-accent-500 to-primary-500 text-on-color-light"
                    : "bg-primary-500 text-on-color-light"),
                lesson.availability === "LOCKED" &&
                  "bg-elevated text-text-muted",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
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
                  <Chip
                    tone="accent"
                    size="sm"
                    title={messages.placedByExamTitle}
                  >
                    <GraduationCap className="size-3" aria-hidden="true" />
                    {messages.placedByExam}
                  </Chip>
                )}
              {lesson.availability === "COMPLETED" &&
                lesson.source !== "PLACEMENT" &&
                lesson.reflectionTotalScore !== null && (
                  <StarRow score={lesson.reflectionTotalScore} />
                )}
            </div>
            {/* Small avatar marker, not the old size-56 floating HanMascot
                illustration - Han still marks the current lesson, just
                scaled to fit this more contained layout instead of
                overhanging above a now much narrower row. */}
            {isCurrent && <HanAvatar pose="wave" size={32} />}
            <span className="sr-only">
              {messages.status[lesson.availability]}
            </span>
          </div>
        );

        return (
          <div key={lesson.id}>
            {lesson.availability === "LOCKED" ? (
              node
            ) : (
              <Link
                href={localePath(locale, `/lesson/${lesson.slug}`)}
                className="block rounded-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
              >
                {node}
              </Link>
            )}
          </div>
        );
      })}

      {finalMissionTitle && (
        <div
          className="relative z-10 flex items-center gap-3"
          style={
            lessons.length % 2 === 1 ? { paddingLeft: ROW_SHIFT_PX } : undefined
          }
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent-500 to-primary-500 text-on-color-light ring-4 ring-page">
            <Star className="size-5" aria-hidden="true" />
          </span>
          <span className="font-interface text-body font-semibold text-accent-300">
            {finalMissionTitle}
          </span>
        </div>
      )}
    </div>
  );
}
