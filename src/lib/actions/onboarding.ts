"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  profileStepSchema,
  goalStepSchema,
  levelStepSchema,
  explanationLanguageStepSchema,
  skillsStepSchema,
  dailyTargetStepSchema,
} from "@/lib/validation/onboarding";
import {
  computeRecommendation,
  type Recommendation,
  type SelfReportedLevel,
} from "@/lib/recommendation";
import {
  getOnboardingActionMessages,
  localizeOnboardingValidation,
  onboardingLocale,
} from "@/i18n/onboarding";
import { localePath, type AppLocale } from "@/i18n/config";

export interface OnboardingStepState {
  status: "idle" | "error";
  message?: string;
}

async function requireUserId(locale: AppLocale = "en"): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(localePath(locale, "/login"));
  }
  return session.user.id;
}

const idleState: OnboardingStepState = { status: "idle" };

export async function saveProfileStepAction(
  _prevState: OnboardingStepState,
  formData: FormData,
): Promise<OnboardingStepState> {
  const locale = onboardingLocale(formData.get("locale"));
  const parsed = profileStepSchema.safeParse({
    displayName: formData.get("displayName"),
    nickname: formData.get("nickname"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: localizeOnboardingValidation(
        parsed.error.issues[0]?.message,
        await getOnboardingActionMessages(locale),
      ),
    };
  }
  const userId = await requireUserId(locale);

  // Same "who else has this" check as registerAction's email uniqueness -
  // nicknames need to be distinguishable on the future leaderboard.
  const existing = await db.learnerProfile.findUnique({
    where: { nickname: parsed.data.nickname },
    select: { userId: true },
  });
  if (existing && existing.userId !== userId) {
    return {
      status: "error",
      message: (await getOnboardingActionMessages(locale)).nicknameTaken,
    };
  }

  await db.learnerProfile.update({
    where: { userId },
    data: {
      displayName: parsed.data.displayName,
      nickname: parsed.data.nickname,
    },
  });
  return idleState;
}

export async function saveGoalStepAction(
  _prevState: OnboardingStepState,
  formData: FormData,
): Promise<OnboardingStepState> {
  const locale = onboardingLocale(formData.get("locale"));
  const parsed = goalStepSchema.safeParse({
    learningGoals: formData.getAll("learningGoals"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: localizeOnboardingValidation(
        parsed.error.issues[0]?.message,
        await getOnboardingActionMessages(locale),
      ),
    };
  }
  const userId = await requireUserId(locale);
  await db.learnerProfile.update({
    where: { userId },
    data: { learningGoals: parsed.data.learningGoals },
  });
  return idleState;
}

export async function saveLevelStepAction(
  _prevState: OnboardingStepState,
  formData: FormData,
): Promise<OnboardingStepState> {
  const locale = onboardingLocale(formData.get("locale"));
  const parsed = levelStepSchema.safeParse({
    currentLevel: formData.get("currentLevel"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: localizeOnboardingValidation(
        parsed.error.issues[0]?.message,
        await getOnboardingActionMessages(locale),
      ),
    };
  }
  const userId = await requireUserId(locale);
  await db.learnerProfile.update({
    where: { userId },
    data: { currentLevel: parsed.data.currentLevel },
  });
  return idleState;
}

export async function saveExplanationLanguageStepAction(
  _prevState: OnboardingStepState,
  formData: FormData,
): Promise<OnboardingStepState> {
  const locale = onboardingLocale(formData.get("locale"));
  const parsed = explanationLanguageStepSchema.safeParse({
    explanationLanguage: formData.get("explanationLanguage"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: localizeOnboardingValidation(
        parsed.error.issues[0]?.message,
        await getOnboardingActionMessages(locale),
      ),
    };
  }
  const userId = await requireUserId(locale);
  await db.learnerProfile.update({
    where: { userId },
    data: { explanationLanguage: parsed.data.explanationLanguage },
  });
  return idleState;
}

export async function saveSkillsStepAction(
  _prevState: OnboardingStepState,
  formData: FormData,
): Promise<OnboardingStepState> {
  const locale = onboardingLocale(formData.get("locale"));
  const parsed = skillsStepSchema.safeParse({
    skillPriorities: formData.getAll("skillPriorities"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: localizeOnboardingValidation(
        parsed.error.issues[0]?.message,
        await getOnboardingActionMessages(locale),
      ),
    };
  }
  const userId = await requireUserId(locale);
  await db.learnerProfile.update({
    where: { userId },
    data: { skillPriorities: parsed.data.skillPriorities },
  });
  return idleState;
}

export async function saveDailyTargetStepAction(
  _prevState: OnboardingStepState,
  formData: FormData,
): Promise<OnboardingStepState> {
  const locale = onboardingLocale(formData.get("locale"));
  const parsed = dailyTargetStepSchema.safeParse({
    dailyStudyTargetMinutes: formData.get("dailyStudyTargetMinutes"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: localizeOnboardingValidation(
        parsed.error.issues[0]?.message,
        await getOnboardingActionMessages(locale),
      ),
    };
  }
  const userId = await requireUserId(locale);
  await db.learnerProfile.update({
    where: { userId },
    data: { dailyStudyTargetMinutes: parsed.data.dailyStudyTargetMinutes },
  });
  return idleState;
}

/**
 * Marks the one-time placement-exam offer as resolved, whether the learner
 * skipped it or started the exam (2026-08-24 "como unica vez" request) -
 * resolveResumeStep uses this to never show the offer step again.
 */
export async function acknowledgePlacementOfferAction(
  localeValue?: string,
): Promise<void> {
  const locale = onboardingLocale(localeValue ?? null);
  const userId = await requireUserId(locale);
  await db.learnerProfile.update({
    where: { userId },
    data: { placementExamOfferAcknowledgedAt: new Date() },
  });
}

export async function getRecommendationAction(
  currentLevel: SelfReportedLevel,
  learningGoals: string[],
  skillPriorities: string[],
  localeValue?: string,
): Promise<Recommendation> {
  const locale = onboardingLocale(localeValue ?? null);
  const userId = await requireUserId(locale);
  return computeRecommendation({
    userId,
    currentLevel,
    learningGoals,
    skillPriorities,
    locale,
  });
}

export async function completeOnboardingAction(
  localeValue?: string,
): Promise<void> {
  const locale = onboardingLocale(localeValue ?? null);
  const userId = await requireUserId(locale);
  await db.learnerProfile.update({
    where: { userId },
    data: { onboardingCompletedAt: new Date() },
  });
  redirect(localePath(locale, "/dashboard"));
}
