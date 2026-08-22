import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import {
  getOrCreateLearnerProfile,
  resolveResumeStep,
} from "@/lib/learner-profile";

// Only auth() is mocked (these actions need a session to know the user id) —
// everything else runs against the real database, same as the other
// integration tests.
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const {
  saveGoalStepAction,
  saveLevelStepAction,
  saveExplanationLanguageStepAction,
  saveSkillsStepAction,
  saveDailyTargetStepAction,
  saveAiPreferencesStepAction,
  completeOnboardingAction,
} = await import("@/lib/actions/onboarding");

function formDataOf(entries: [string, string][]): FormData {
  const formData = new FormData();
  for (const [key, value] of entries) formData.append(key, value);
  return formData;
}

const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

describe("onboarding (integration, real database)", () => {
  it("resolves to 'welcome' for a brand-new profile", async () => {
    const user = await createTestUser(
      `onboarding-fresh-${Date.now()}@hango.dev`,
    );
    const profile = await getOrCreateLearnerProfile(user.id);
    expect(resolveResumeStep(profile)).toBe("welcome");
  });

  it("advances the resume step as each step is saved", async () => {
    const user = await createTestUser(
      `onboarding-flow-${Date.now()}@hango.dev`,
    );
    await getOrCreateLearnerProfile(user.id);

    await saveGoalStepAction(
      { status: "idle" },
      formDataOf([["learningGoals", "TRAVEL"]]),
    );
    let profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(resolveResumeStep(profile)).toBe("level");

    await saveLevelStepAction(
      { status: "idle" },
      formDataOf([["currentLevel", "HSK_4"]]),
    );
    profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(resolveResumeStep(profile)).toBe("explanation-language");

    await saveExplanationLanguageStepAction(
      { status: "idle" },
      formDataOf([["explanationLanguage", "EN"]]),
    );
    await saveSkillsStepAction(
      { status: "idle" },
      formDataOf([["skillPriorities", "SPEAKING"]]),
    );
    await saveDailyTargetStepAction(
      { status: "idle" },
      formDataOf([["dailyStudyTargetMinutes", "20"]]),
    );
    await saveAiPreferencesStepAction(
      { status: "idle" },
      formDataOf([["correctionStyle", "ONLY_IMPORTANT"]]),
    );

    profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(resolveResumeStep(profile)).toBe("recommendation");
    expect(profile.onboardingCompletedAt).toBeNull();
  });

  it("rejects invalid step input without writing to the database", async () => {
    const user = await createTestUser(
      `onboarding-invalid-${Date.now()}@hango.dev`,
    );
    await getOrCreateLearnerProfile(user.id);

    const result = await saveLevelStepAction(
      { status: "idle" },
      formDataOf([["currentLevel", "NOT_A_REAL_LEVEL"]]),
    );
    expect(result.status).toBe("error");

    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.currentLevel).toBeNull();
  });

  it("marks onboarding complete and redirects to /dashboard", async () => {
    const user = await createTestUser(
      `onboarding-complete-${Date.now()}@hango.dev`,
    );
    await getOrCreateLearnerProfile(user.id);

    await expect(completeOnboardingAction()).rejects.toMatchObject({
      digest: expect.stringContaining("/dashboard"),
    });

    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.onboardingCompletedAt).not.toBeNull();
  });
});
