export type LessonAvailabilityStatus = "LOCKED" | "AVAILABLE" | "COMPLETED";

export interface LessonForAvailability {
  id: string;
  order: number;
}

/**
 * Lesson-unlocking rules (5.4): the first lesson in a scenario level is
 * always available; each subsequent lesson unlocks once the previous one
 * is completed. Completed lessons remain accessible.
 */
export function resolveLessonAvailability(
  lessons: LessonForAvailability[],
  completedLessonIds: ReadonlySet<string>,
): Map<string, LessonAvailabilityStatus> {
  const sorted = [...lessons].sort((a, b) => a.order - b.order);
  const result = new Map<string, LessonAvailabilityStatus>();
  let previousCompleted = true;

  for (const lesson of sorted) {
    const isCompleted = completedLessonIds.has(lesson.id);
    if (isCompleted) {
      result.set(lesson.id, "COMPLETED");
    } else if (previousCompleted) {
      result.set(lesson.id, "AVAILABLE");
    } else {
      result.set(lesson.id, "LOCKED");
    }
    previousCompleted = isCompleted;
  }

  return result;
}

/**
 * Scenario-card status (5.2). LOCKED and MASTERED are documented states but
 * intentionally not produced here: LOCKED would require a cross-scenario
 * prerequisite chain no doc defines yet, and MASTERED needs competency
 * evidence that doesn't exist until FASE 13. Both are safe to add later
 * without changing this function's signature.
 */
export type ScenarioStatus = "AVAILABLE" | "IN_PROGRESS" | "COMPLETED";

export function resolveScenarioStatus(
  totalLessons: number,
  completedLessons: number,
): ScenarioStatus {
  if (totalLessons === 0 || completedLessons === 0) return "AVAILABLE";
  if (completedLessons >= totalLessons) return "COMPLETED";
  return "IN_PROGRESS";
}

export type JourneyChapter = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export const JOURNEY_CHAPTER_ORDER: JourneyChapter[] = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
];

/**
 * Maps a scenario's set of level difficulties to the chapter it displays
 * under on the Learning Journey page (8.x: difficulty-ordered chapters,
 * requested after the flat domain-filtered grid made the difficulty curve
 * invisible). A scenario spanning two tiers (e.g. Getting Around has both
 * BEGINNER and INTERMEDIATE levels) surfaces once, under its lowest tier —
 * that's when a learner first meets it, and the card's own difficulty list
 * already shows the rest. Deliberately no LOCKED state here: the user asked
 * for chapters to organize by difficulty, not gate access to it.
 */
const CHAPTER_BY_DIFFICULTY: Record<string, JourneyChapter> = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  UPPER_INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
};

export function resolveJourneyChapter(
  difficulties: string[],
): JourneyChapter {
  let chapter: JourneyChapter = "ADVANCED";
  let bestRank = JOURNEY_CHAPTER_ORDER.length;

  for (const difficulty of difficulties) {
    const mapped = CHAPTER_BY_DIFFICULTY[difficulty];
    if (!mapped) continue;
    const rank = JOURNEY_CHAPTER_ORDER.indexOf(mapped);
    if (rank < bestRank) {
      bestRank = rank;
      chapter = mapped;
    }
  }

  return chapter;
}

/**
 * The chapter's display identity (title/subtitle/badge/accent) - moved
 * here from journey-chapters.tsx (2026-08-21) so any other UI that groups
 * by chapter (Speaking Lab's lesson picker) shows the exact same names
 * ("Foundations"/"Everyday Life"/"Advanced Situations") and colors as the
 * Learning Journey page itself, instead of a second, drifting copy.
 */
export const CHAPTER_CONFIG: Record<
  JourneyChapter,
  { badge: string; title: string; subtitle: string; accent: "secondary" | "accent" | "primary" }
> = {
  BEGINNER: {
    badge: "1",
    title: "Foundations",
    subtitle: "Beginner level",
    accent: "secondary",
  },
  INTERMEDIATE: {
    badge: "2",
    title: "Everyday Life",
    subtitle: "Intermediate level",
    accent: "accent",
  },
  ADVANCED: {
    badge: "3",
    title: "Advanced Situations",
    subtitle: "Advanced level",
    accent: "primary",
  },
};

/**
 * Per-level display name for the scenario detail page (2026-08-21) - it was
 * rendering the raw `level.difficulty` enum directly ("BEGINNER",
 * "UPPER_INTERMEDIATE"), a different vocabulary than the same concept's
 * name on the Learning Journey list page (CHAPTER_CONFIG's "Foundations" /
 * "Everyday Life" / "Advanced Situations"). Reuses those exact chapter
 * names where a level maps onto one one-to-one; UPPER_INTERMEDIATE has no
 * distinct chapter identity of its own (CHAPTER_BY_DIFFICULTY folds it into
 * the INTERMEDIATE chapter for grouping purposes), so it gets its own
 * plain, human label instead of inheriting "Everyday Life" a second time.
 */
export const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "Foundations",
  INTERMEDIATE: "Everyday Life",
  UPPER_INTERMEDIATE: "Upper Intermediate",
  ADVANCED: "Advanced Situations",
};

export interface ContinueLearningTarget {
  scenarioSlug: string;
  lessonSlug: string;
  lessonTitle: string;
}

interface LessonWithSlug extends LessonForAvailability {
  slug: string;
  title: string;
}

interface ScenarioForContinueLearning {
  slug: string;
  levels: { lessons: LessonWithSlug[] }[];
}

/**
 * Continue Learning resolution (5.4): the first not-yet-completed lesson,
 * walking scenarios/levels/lessons in their defined order. Returns null
 * once everything is completed (an empty-state / "you're all caught up"
 * case for whoever calls this — FASE 14's Dashboard, once it exists).
 */
export function resolveContinueLearning(
  scenarios: ScenarioForContinueLearning[],
  completedLessonIds: ReadonlySet<string>,
): ContinueLearningTarget | null {
  for (const scenario of scenarios) {
    for (const level of scenario.levels) {
      const sortedLessons = [...level.lessons].sort(
        (a, b) => a.order - b.order,
      );
      for (const lesson of sortedLessons) {
        if (!completedLessonIds.has(lesson.id)) {
          return {
            scenarioSlug: scenario.slug,
            lessonSlug: lesson.slug,
            lessonTitle: lesson.title,
          };
        }
      }
    }
  }
  return null;
}
