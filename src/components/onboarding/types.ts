export type OnboardingStep =
  | "welcome"
  | "profile"
  | "avatar"
  | "goal"
  | "level"
  | "explanation-language"
  | "skills"
  | "daily-target"
  | "placement-offer"
  | "recommendation";

export interface OnboardingValues {
  displayName: string | null;
  nickname: string | null;
  avatarAnimal: string | null;
  learningGoals: string[];
  currentLevel: string | null;
  explanationLanguage: string | null;
  skillPriorities: string[];
  dailyStudyTargetMinutes: number | null;
}

export const STEP_ORDER: OnboardingStep[] = [
  "welcome",
  "profile",
  "avatar",
  "goal",
  "level",
  "explanation-language",
  "skills",
  "daily-target",
  "placement-offer",
  "recommendation",
];
