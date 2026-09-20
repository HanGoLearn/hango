import { z } from "zod";

export const learningPreferencesSchema = z.object({
  interfaceLanguage: z.enum(["EN", "ES"]),
  explanationLanguage: z.enum(["EN", "ES", "ZH"]),
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
  dailyStudyTargetMinutes: z.coerce.number().int().min(5).max(240),
  correctionStyle: z.enum([
    "IMMEDIATE",
    "AFTER_CONVERSATION",
    "ONLY_IMPORTANT",
  ]),
});

export const defaultAiModeSchema = z.enum(["TUTOR", "PRACTICE"]);

export const recordingRetentionSchema = z
  .number()
  .int()
  .min(0)
  .max(365)
  .nullable();
