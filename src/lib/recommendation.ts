/**
 * Initial scenario recommendation (3.4). Only "Restaurant" exists as a
 * planned scenario before FASE 4 seeds real curriculum content (mvp.md,
 * FASE 4.7, FASE 15.1 all treat Restaurant as the first scenario) — so the
 * rules below can only ever recommend it for the MVP. What they DO vary,
 * using the learner's level/goal/skills as required, is the *reason* shown.
 * Once FASE 4/5 provide multiple real scenarios, this is the single place
 * to extend into an actual ranking.
 */

export interface RecommendationInput {
  currentLevel:
    | "HSK_1_2"
    | "HSK_3"
    | "HSK_4"
    | "HSK_5"
    | "HSK_6"
    | "HSK_7_9"
    | "UNSURE"
    | null;
  learningGoals: string[];
  skillPriorities: string[];
}

export interface Recommendation {
  scenarioSlug: string;
  scenarioName: string;
  reason: string;
}

export function computeInitialRecommendation(
  input: RecommendationInput,
): Recommendation {
  const reason = buildReason(input);
  return {
    scenarioSlug: "restaurant",
    scenarioName: "Restaurant",
    reason,
  };
}

function buildReason(input: RecommendationInput): string {
  if (input.learningGoals.includes("TRAVEL")) {
    return "Ordering food is one of the most common situations you'll face while traveling — Restaurant gets you ready for it fast.";
  }
  if (input.learningGoals.includes("SPEAK_CONFIDENTLY")) {
    return "Restaurant is built around short, practical exchanges — a low-pressure way to start speaking with confidence.";
  }
  if (input.skillPriorities.includes("SPEAKING")) {
    return "Since speaking is a priority for you, Restaurant leads with dialogue and a speaking mission from lesson one.";
  }
  if (input.currentLevel === "UNSURE" || input.currentLevel === null) {
    return "Restaurant uses everyday vocabulary and gradually increases in difficulty, making it a reliable starting point at any level.";
  }
  return "Restaurant is HanGo's foundational scenario — it introduces core communication patterns you'll reuse throughout the platform.";
}
