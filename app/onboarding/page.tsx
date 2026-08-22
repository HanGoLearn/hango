import { auth } from "@/lib/auth";
import {
  getOrCreateLearnerProfile,
  resolveResumeStep,
} from "@/lib/learner-profile";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await auth();
  // Layout already redirects if there's no session — this satisfies TypeScript.
  const profile = await getOrCreateLearnerProfile(session!.user.id);
  const resumeStep = resolveResumeStep(profile);

  return (
    <OnboardingWizard
      initialStep={resumeStep}
      initialValues={{
        learningGoals: profile.learningGoals,
        currentLevel: profile.currentLevel,
        explanationLanguage: profile.explanationLanguage,
        skillPriorities: profile.skillPriorities,
        dailyStudyTargetMinutes: profile.dailyStudyTargetMinutes,
        correctionStyle: profile.correctionStyle,
      }}
    />
  );
}
