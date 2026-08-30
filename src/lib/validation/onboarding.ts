import { z } from "zod";

export const profileStepSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(60, "Keep it under 60 characters"),
  nickname: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(24, "Keep it under 24 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
});

export const goalStepSchema = z.object({
  learningGoals: z
    .array(
      z.enum([
        "SPEAK_CONFIDENTLY",
        "HSK_PREPARATION",
        "TRAVEL",
        "WORK",
        "STUDY",
        "PERSONAL_INTEREST",
      ]),
    )
    .min(1, "Select at least one goal"),
});

export const levelStepSchema = z.object({
  currentLevel: z.enum([
    "HSK_1_2",
    "HSK_3",
    "HSK_4",
    "HSK_5",
    "HSK_6",
    "HSK_7_9",
    "UNSURE",
  ]),
});

export const explanationLanguageStepSchema = z.object({
  explanationLanguage: z.enum(["EN", "ES", "ZH"]),
});

export const skillsStepSchema = z.object({
  skillPriorities: z
    .array(
      z.enum([
        "LISTENING",
        "SPEAKING",
        "READING",
        "WRITING",
        "GRAMMAR",
        "VOCABULARY",
      ]),
    )
    .min(1, "Select at least one skill"),
});

// No documented option set for daily study target — 10/20/30/45/60 minutes
// is a reasonable, common range, not something the docs specify exactly.
export const DAILY_TARGET_OPTIONS = [10, 20, 30, 45, 60] as const;

export const dailyTargetStepSchema = z.object({
  dailyStudyTargetMinutes: z.coerce
    .number()
    .refine(
      (value) => (DAILY_TARGET_OPTIONS as readonly number[]).includes(value),
      "Choose one of the offered durations",
    ),
});

