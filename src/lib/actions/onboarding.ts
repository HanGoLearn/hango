"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
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

export interface OnboardingStepState {
  status: "idle" | "error";
  message?: string;
}

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

const idleState: OnboardingStepState = { status: "idle" };

export async function saveGoalStepAction(
  _prevState: OnboardingStepState,
  formData: FormData,
): Promise<OnboardingStepState> {
  const parsed = goalStepSchema.safeParse({
    learningGoals: formData.getAll("learningGoals"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }
  const userId = await requireUserId();
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
  const parsed = levelStepSchema.safeParse({
    currentLevel: formData.get("currentLevel"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }
  const userId = await requireUserId();
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
  const parsed = explanationLanguageStepSchema.safeParse({
    explanationLanguage: formData.get("explanationLanguage"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }
  const userId = await requireUserId();
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
  const parsed = skillsStepSchema.safeParse({
    skillPriorities: formData.getAll("skillPriorities"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }
  const userId = await requireUserId();
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
  const parsed = dailyTargetStepSchema.safeParse({
    dailyStudyTargetMinutes: formData.get("dailyStudyTargetMinutes"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }
  const userId = await requireUserId();
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
export async function acknowledgePlacementOfferAction(): Promise<void> {
  const userId = await requireUserId();
  await db.learnerProfile.update({
    where: { userId },
    data: { placementExamOfferAcknowledgedAt: new Date() },
  });
}

export async function getRecommendationAction(
  currentLevel: SelfReportedLevel,
  learningGoals: string[],
  skillPriorities: string[],
): Promise<Recommendation> {
  const userId = await requireUserId();
  return computeRecommendation({ userId, currentLevel, learningGoals, skillPriorities });
}

export async function completeOnboardingAction(): Promise<void> {
  const userId = await requireUserId();
  await db.learnerProfile.update({
    where: { userId },
    data: { onboardingCompletedAt: new Date() },
  });
  redirect("/dashboard");
}
