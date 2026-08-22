export type OnboardingStep =
  | "welcome"
  | "goal"
  | "level"
  | "explanation-language"
  | "skills"
  | "daily-target"
  | "ai-preferences"
  | "recommendation";

export interface OnboardingValues {
  learningGoals: string[];
  currentLevel: string | null;
  explanationLanguage: string | null;
  skillPriorities: string[];
  dailyStudyTargetMinutes: number | null;
  correctionStyle: string | null;
}

export const STEP_ORDER: OnboardingStep[] = [
  "welcome",
  "goal",
  "level",
  "explanation-language",
  "skills",
  "daily-target",
  "ai-preferences",
  "recommendation",
];
