import type { messages as englishMessages } from "@/i18n/messages/en";

type WidenStrings<T> = T extends string
  ? string
  : T extends readonly (infer Item)[]
    ? ReadonlyArray<WidenStrings<Item>>
    : T extends object
      ? { [Key in keyof T]: WidenStrings<T[Key]> }
      : T;

export type AppMessages = WidenStrings<typeof englishMessages>;
export type LessonMessages = AppMessages["lesson"];
export type AuthMessages = AppMessages["auth"];
export type MarketingMessages = AppMessages["marketing"];
export type ShellMessages = AppMessages["shell"];
export type OnboardingMessages = AppMessages["onboarding"];
export type DashboardMessages = AppMessages["dashboard"];
export type SettingsMessages = AppMessages["settings"];
export type ProgressMessages = AppMessages["progress"];
export type AchievementsMessages = AppMessages["achievements"];
export type LeaderboardMessages = AppMessages["leaderboard"];
export type ShopMessages = AppMessages["shop"];
export type SpeakingLabMessages = AppMessages["speakingLab"];
export type WritingLabMessages = AppMessages["writingLab"];
export type HanVocabularyMessages = AppMessages["hanVocabulary"];
export type TourMessages = AppMessages["tour"];
