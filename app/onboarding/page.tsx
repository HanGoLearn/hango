import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getOrCreateLearnerProfile,
  resolveResumeStep,
} from "@/lib/learner-profile";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();
  // Layout already redirects if there's no session — this satisfies TypeScript.
  const userId = session!.user.id;
  const [profile, avatar] = await Promise.all([
    getOrCreateLearnerProfile(userId),
    // LearnerAvatar is its own table (2026-08-30), not a LearnerProfile
    // field - fetched alongside it so both feed resolveResumeStep the same way.
    db.learnerAvatar.findUnique({ where: { userId }, select: { animal: true } }),
  ]);
  const resumeStep = resolveResumeStep({
    ...profile,
    avatarAnimal: avatar?.animal ?? null,
  });

  return (
    <OnboardingWizard
      initialStep={resumeStep}
      initialValues={{
        displayName: profile.displayName,
        nickname: profile.nickname,
        avatarAnimal: avatar?.animal ?? null,
        learningGoals: profile.learningGoals,
        currentLevel: profile.currentLevel,
        explanationLanguage: profile.explanationLanguage,
        skillPriorities: profile.skillPriorities,
        dailyStudyTargetMinutes: profile.dailyStudyTargetMinutes,
      }}
    />
  );
}
