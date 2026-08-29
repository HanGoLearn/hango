export type OnboardingStep =
  | "welcome"
  | "goal"
  | "level"
  | "explanation-language"
  | "skills"
  | "daily-target"
  | "placement-offer"
  | "recommendation";

export interface OnboardingValues {
  learningGoals: string[];
  currentLevel: string | null;
  explanationLanguage: string | null;
  skillPriorities: string[];
  dailyStudyTargetMinutes: number | null;
}

export const STEP_ORDER: OnboardingStep[] = [
  "welcome",
  "goal",
  "level",
  "explanation-language",
  "skills",
  "daily-target",
  "placement-offer",
  "recommendation",
];
