import { getPublishedJourneyCatalog } from "@/lib/content/learning-journey-data";
import {
  getCompetencyProgress,
  getContinueLearningTarget,
  getEstimatedLevel,
  getGeneralLevelSummary,
  getScenarioMastery,
  getVocabularyGrammarExposure,
} from "@/lib/progress-data";
import { getReviewQueue } from "@/lib/review-data";
import { CURRENT_MAX_GENERAL_LEVEL_POINTS } from "@/lib/points-system";
import {
  buildStaticHanAppContext,
  detectHanAppContextIntent,
  type HanAppContextIntent,
} from "@/lib/han-app-intent";

function header(): string {
  return "On-demand HanGo context for this response only. Use it only to answer the current app question; do not recite every field unless asked:";
}

async function buildJourneyRouteContext(): Promise<string> {
  const catalog = await getPublishedJourneyCatalog();
  return [
    header(),
    "The learner wants a real Learning Journey route. Recommend the closest published scenario and lesson first, explain why briefly, then optionally teach a sample Mandarin phrase.",
    "Never invent a scenario or lesson. If the match is imperfect, say so. A later lesson may be locked, so direct the learner to the scenario and its currently available lesson rather than promising access.",
    'Known example: ordering a pizza belongs under "Restaurant"; "Entering and Ordering" is the closest lesson. Pizza is an example of food, not a separate scenario.',
    "Published catalog:",
    ...catalog.map(
      (scenario) =>
        `- ${scenario.name}: ${(scenario.description ?? scenario.communicationOutcomes.join("; ")) || "No description"}. Lessons: ${scenario.lessonTitles.join("; ") || "none published"}.`,
    ),
  ].join("\n");
}

async function buildGeneralProgressContext(userId: string): Promise<string> {
  const [general, startingLevel, next] = await Promise.all([
    getGeneralLevelSummary(userId),
    getEstimatedLevel(userId),
    getContinueLearningTarget(userId),
  ]);
  return [
    header(),
    `Earned General Level: ${Math.round(general.points)}/${CURRENT_MAX_GENERAL_LEVEL_POINTS} points (${general.levelLabel}).`,
    `Starting level selected by the learner (self-report, not a score): ${startingLevel?.startingLevelLabel ?? "not set"}.`,
    `Learning Journey weighted average: ${general.learningJourneyAverage == null ? "not enough completed scenarios yet" : `${general.learningJourneyAverage}%`} across ${general.scenariosCompleted} completed scenario(s).`,
    next
      ? `Recommended next lesson: ${next.lessonTitle} (/lesson/${next.lessonSlug}).`
      : "Recommended next lesson: the published course is complete or no target is available.",
    "Be explicit that earned points and graded averages are real evidence; the starting level is only self-reported.",
  ].join("\n");
}

async function buildCompetencyContext(userId: string): Promise<string> {
  const competencies = await getCompetencyProgress(userId);
  return [
    header(),
    competencies.length === 0
      ? "Competencies: no graded evidence yet."
      : [
          "Competencies (difficulty-weighted score, stage, evidence count):",
          ...competencies.map(
            (item) =>
              `- ${item.name}: ${Math.round(item.weightedScore * 100)}%, ${item.stage}, ${item.evidenceCount} evidence item(s).`,
          ),
        ].join("\n"),
    "The score is evidence-based. Do not call it an official HSK certification, and do not infer a pronunciation detail that the stored evidence does not contain.",
  ].join("\n");
}

async function buildExposureContext(userId: string): Promise<string> {
  const exposure = await getVocabularyGrammarExposure(userId);
  return [
    header(),
    `Vocabulary items encountered in completed lessons: ${exposure.vocabularyCount}.`,
    `Grammar points encountered in completed lessons: ${exposure.grammarCount}.`,
    "These are exposure counts, not proof that the learner has mastered every item.",
  ].join("\n");
}

async function buildScenarioContext(userId: string): Promise<string> {
  const scenarios = await getScenarioMastery(userId);
  const active = scenarios.filter(
    (scenario) => scenario.completionPercent > 0 || scenario.mastered,
  );
  return [
    header(),
    active.length === 0
      ? "Scenario Mastery: no scenario progress yet."
      : [
          "Scenario Mastery:",
          ...active.map(
            (scenario) =>
              `- ${scenario.name}: ${scenario.completionPercent}% complete; ${scenario.mastered ? "mastered" : "not yet mastered"}.`,
          ),
        ].join("\n"),
    `${Math.max(0, scenarios.length - active.length)} additional scenario(s) have no completion yet.`,
    "Mastered requires full lesson completion plus sufficiently strong competency evidence; completion alone is not mastery.",
  ].join("\n");
}

async function buildReviewContext(userId: string): Promise<string> {
  const queue = await getReviewQueue(userId);
  return [
    header(),
    queue.length === 0
      ? "Review queue: empty because there is not enough completed-lesson history yet."
      : [
          "Current review queue:",
          ...queue.map(
            (item) =>
              `- ${item.title} (${item.type}, about ${item.estimatedMinutes} min): ${item.reason}.`,
          ),
        ].join("\n"),
    "Recommend the most useful current item without claiming this is a full spaced-repetition schedule.",
  ].join("\n");
}

async function resolveDataContext(
  userId: string,
  intent: HanAppContextIntent,
): Promise<string | null> {
  switch (intent) {
    case "LEARNING_JOURNEY_ROUTE":
      return buildJourneyRouteContext();
    case "PROGRESS_GENERAL":
      return buildGeneralProgressContext(userId);
    case "PROGRESS_COMPETENCIES":
      return buildCompetencyContext(userId);
    case "PROGRESS_EXPOSURE":
      return buildExposureContext(userId);
    case "PROGRESS_SCENARIOS":
      return buildScenarioContext(userId);
    case "PROGRESS_REVIEW":
      return buildReviewContext(userId);
    case "PROGRESS_FULL": {
      const [general, competencies, exposure, scenarios, review] =
        await Promise.all([
          buildGeneralProgressContext(userId),
          buildCompetencyContext(userId),
          buildExposureContext(userId),
          buildScenarioContext(userId),
          buildReviewContext(userId),
        ]);
      return [general, competencies, exposure, scenarios, review].join("\n\n");
    }
    default:
      return buildStaticHanAppContext(intent);
  }
}

export async function getHanOnDemandAppContext(
  userId: string,
  message: string,
  currentPageName?: string,
): Promise<string | null> {
  const intent = detectHanAppContextIntent(message, currentPageName);
  if (!intent) return null;
  return resolveDataContext(userId, intent);
}
