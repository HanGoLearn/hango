import "server-only";
import { db } from "@/lib/db";
import { getScenariosWithProgress } from "@/lib/content/learning-journey-data";
import {
  resolveJourneyChapter,
  type JourneyChapter,
} from "@/lib/content/learning-journey";
import { tierNameForLevel } from "@/lib/points-system";
import type { AppLocale } from "@/i18n/config";

/**
 * Recommendation engine (3.4), rebuilt 2026-08-24 to replace the old
 * hardcoded "always Restaurant" placeholder (mvp.md/FASE 4-15 assumed
 * Restaurant was the only seeded scenario - no longer true once Foundations'
 * full curriculum landed). Now driven by real data: the learner's actual
 * level (a completed placement exam's result when one exists, otherwise the
 * self-reported onboarding answer) and their stated goals, matched against
 * the real published scenario tree.
 */

export type SelfReportedLevel =
  | "HSK_1_2"
  | "HSK_3"
  | "HSK_4"
  | "HSK_5"
  | "HSK_6"
  | "HSK_7_9"
  | "UNSURE"
  | null;

export interface RecommendationInput {
  userId: string;
  currentLevel: SelfReportedLevel;
  learningGoals: string[];
  skillPriorities: string[];
  locale?: AppLocale;
}

export interface RecommendedScenario {
  scenarioSlug: string;
  scenarioName: string;
  domainName: string;
}

export interface GoalRecommendation {
  goal: string;
  label: string;
  scenarios: RecommendedScenario[];
}

export interface Recommendation {
  primary: RecommendedScenario | null;
  reason: string;
  /** Which Learning Journey scenarios connect to each of the learner's
   * stated goals - "el Goal se conecte con un feedback... de que sesiones
   * del learning journey puede entrar" (2026-08-24 request). Omits goals
   * with no real match rather than padding with unrelated scenarios. */
  goalMatches: GoalRecommendation[];
  /** Non-null when the recommendation used a real placement-exam result
   * instead of the self-reported onboarding level. */
  placementLevel: number | null;
}

const SELF_REPORTED_LEVEL: Record<string, number> = {
  HSK_1_2: 1,
  HSK_3: 3,
  HSK_4: 4,
  HSK_5: 5,
  HSK_6: 6,
  HSK_7_9: 7,
  UNSURE: 0,
};

const GOAL_LABELS: Record<AppLocale, Record<string, string>> = {
  en: {
  SPEAK_CONFIDENTLY: "Speak confidently",
  HSK_PREPARATION: "Prepare for HSK",
  TRAVEL: "Travel",
  WORK: "Work",
  STUDY: "Study",
  PERSONAL_INTEREST: "Personal interest",
  },
  es: {
    SPEAK_CONFIDENTLY: "Hablar con confianza",
    HSK_PREPARATION: "Prepararme para el HSK",
    TRAVEL: "Viajar",
    WORK: "Trabajar",
    STUDY: "Estudiar",
    PERSONAL_INTEREST: "Interés personal",
  },
};

const SPANISH_TIER_NAMES: Record<number, string> = {
  0: "Primeros pasos",
  1: "Comunicándote con lo esencial",
  2: "Encontrando tu ritmo",
  3: "Hablando con soltura",
  4: "Haciéndote entender fácilmente",
  5: "Resolviendo situaciones reales",
  6: "Hablando como profesional",
  7: "Cerca del dominio",
  8: "Fluidez refinada",
  9: "Dominio del idioma",
};

function localizedTierName(locale: AppLocale, level: number): string {
  return locale === "es"
    ? (SPANISH_TIER_NAMES[level] ?? SPANISH_TIER_NAMES[0]!)
    : tierNameForLevel(level);
}

/**
 * Keyword match against real scenario/domain text, not a hand-authored
 * per-scenario tag table - the content model has no structured goal
 * metadata (Scenario.communicationOutcomes is free text), and adding one
 * would mean re-tagging all 41 scenarios, well beyond this request's scope.
 * Degrades gracefully: a goal with no keyword hit just gets omitted from
 * goalMatches rather than showing an unrelated scenario.
 */
const GOAL_KEYWORDS: Record<string, string[]> = {
  SPEAK_CONFIDENTLY: ["daily", "conversation", "greeting", "social", "friend"],
  HSK_PREPARATION: [],
  TRAVEL: ["travel", "airport", "hotel", "transport", "direction", "trip"],
  WORK: ["work", "office", "business", "meeting", "job", "interview", "colleague"],
  STUDY: ["school", "study", "class", "academic", "university", "campus"],
  PERSONAL_INTEREST: ["culture", "hobby", "food", "entertainment", "shopping", "restaurant"],
};

function chapterForLevel(level: number): JourneyChapter {
  if (level <= 2) return "BEGINNER";
  if (level <= 5) return "INTERMEDIATE";
  return "ADVANCED";
}

type ScenarioForMatching = Awaited<
  ReturnType<typeof getScenariosWithProgress>
>[number];

function matchesKeywords(
  scenario: ScenarioForMatching,
  keywords: string[],
): boolean {
  if (keywords.length === 0) return false;
  const haystack = [
    scenario.domain.name,
    scenario.name,
    scenario.description ?? "",
    ...scenario.communicationOutcomes,
  ]
    .join(" ")
    .toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function toRecommendedScenario(
  scenario: ScenarioForMatching,
): RecommendedScenario {
  return {
    scenarioSlug: scenario.slug,
    scenarioName: scenario.name,
    domainName: scenario.domain.name,
  };
}

/**
 * The learner's real level: the lowest of the 4 written skills from their
 * most recent completed placement exam when one exists (same "never place
 * above what's weakest" principle the placement-credit mechanism uses),
 * otherwise the self-reported onboarding answer.
 */
export async function getEffectiveLevel(
  userId: string,
  currentLevel: SelfReportedLevel,
): Promise<{ level: number; fromPlacement: boolean }> {
  const placement = await db.placementSession.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: {
      vocabularyHskLevel: true,
      grammarHskLevel: true,
      readingHskLevel: true,
      listeningHskLevel: true,
    },
  });
  if (
    placement &&
    placement.vocabularyHskLevel != null &&
    placement.grammarHskLevel != null &&
    placement.readingHskLevel != null &&
    placement.listeningHskLevel != null
  ) {
    return {
      level: Math.min(
        placement.vocabularyHskLevel,
        placement.grammarHskLevel,
        placement.readingHskLevel,
        placement.listeningHskLevel,
      ),
      fromPlacement: true,
    };
  }
  return {
    level: SELF_REPORTED_LEVEL[currentLevel ?? "UNSURE"] ?? 0,
    fromPlacement: false,
  };
}

function buildReason(
  scenario: RecommendedScenario,
  input: RecommendationInput,
  fromPlacement: boolean,
  level: number,
): string {
  const locale = input.locale ?? "en";
  if (locale === "es") {
    if (fromPlacement) {
      return `Tu prueba de nivel te ubicó en ${localizedTierName(locale, level)}; ${scenario.scenarioName} (${scenario.domainName}) corresponde a ese punto de partida.`;
    }
    if (input.learningGoals.includes("TRAVEL")) {
      return `${scenario.scenarioName} forma parte de ${scenario.domainName}, una de las áreas más útiles para desenvolverte al viajar.`;
    }
    if (input.learningGoals.includes("WORK")) {
      return `${scenario.scenarioName} (${scenario.domainName}) desarrolla habilidades de comunicación cotidiana que también usarás en el trabajo.`;
    }
    if (input.skillPriorities.includes("SPEAKING")) {
      return `Como hablar es una prioridad para ti, ${scenario.scenarioName} comienza con diálogo y una misión oral desde la primera lección.`;
    }
    if (!input.currentLevel || input.currentLevel === "UNSURE") {
      return `${scenario.scenarioName} usa vocabulario cotidiano y aumenta gradualmente la dificultad, por lo que es un punto de partida confiable para cualquier nivel.`;
    }
    return `${scenario.scenarioName} corresponde a ${localizedTierName(locale, level)}, tu nivel actual dentro de la Ruta de aprendizaje.`;
  }

  if (fromPlacement) {
    return `Your placement exam placed you at ${tierNameForLevel(level)} - ${scenario.scenarioName} (${scenario.domainName}) matches that starting point.`;
  }
  if (input.learningGoals.includes("TRAVEL")) {
    return `${scenario.scenarioName} is part of ${scenario.domainName}, one of the most useful areas for getting around while traveling.`;
  }
  if (input.learningGoals.includes("WORK")) {
    return `${scenario.scenarioName} (${scenario.domainName}) builds the everyday communication skills that carry over into work settings.`;
  }
  if (input.skillPriorities.includes("SPEAKING")) {
    return `Since speaking is a priority for you, ${scenario.scenarioName} leads with dialogue and a speaking mission from lesson one.`;
  }
  if (!input.currentLevel || input.currentLevel === "UNSURE") {
    return `${scenario.scenarioName} uses everyday vocabulary and gradually increases in difficulty, making it a reliable starting point at any level.`;
  }
  return `${scenario.scenarioName} matches ${tierNameForLevel(level)}, your current level in the Learning Journey.`;
}

export async function computeRecommendation(
  input: RecommendationInput,
): Promise<Recommendation> {
  const [{ level, fromPlacement }, scenarios] = await Promise.all([
    getEffectiveLevel(input.userId, input.currentLevel),
    getScenariosWithProgress(input.userId),
  ]);

  const notCompleted = scenarios.filter((s) => s.status !== "COMPLETED");
  const targetChapter = chapterForLevel(level);
  const inChapter = notCompleted.filter(
    (s) =>
      resolveJourneyChapter(s.levels.map((l) => l.difficulty)) ===
      targetChapter,
  );
  const pool = inChapter.length > 0 ? inChapter : notCompleted;

  const goalMatches: GoalRecommendation[] = input.learningGoals
    .map((goal) => {
      const keywords = GOAL_KEYWORDS[goal] ?? [];
      const matched = notCompleted
        .filter((s) => matchesKeywords(s, keywords))
        .slice(0, 3)
        .map(toRecommendedScenario);
      const locale = input.locale ?? "en";
      return {
        goal,
        label: GOAL_LABELS[locale][goal] ?? goal,
        scenarios: matched,
      };
    })
    .filter((entry) => entry.scenarios.length > 0);

  const goalMatched = pool.find((s) =>
    input.learningGoals.some((goal) =>
      matchesKeywords(s, GOAL_KEYWORDS[goal] ?? []),
    ),
  );
  const primaryScenario = goalMatched ?? pool[0] ?? scenarios[0] ?? null;
  const primary = primaryScenario ? toRecommendedScenario(primaryScenario) : null;

  return {
    primary,
    reason: primary
      ? buildReason(primary, input, fromPlacement, level)
      : input.locale === "es"
        ? "Estamos preparando contenido nuevo. Vuelve pronto para descubrir tu primer escenario."
        : "New content is on its way - check back soon for your first scenario.",
    goalMatches,
    placementLevel: fromPlacement ? level : null,
  };
}
