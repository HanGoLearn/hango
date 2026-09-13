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
  saveProfileStepAction,
  saveGoalStepAction,
  saveLevelStepAction,
  saveExplanationLanguageStepAction,
  saveSkillsStepAction,
  saveDailyTargetStepAction,
  acknowledgePlacementOfferAction,
  completeOnboardingAction,
} = await import("@/lib/actions/onboarding");
const { saveAvatarAnimalAction } = await import("@/lib/actions/avatar");

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

/** avatarAnimal lives on the separate LearnerAvatar table (2026-08-30) - resolveResumeStep needs it merged in, same as app/onboarding/page.tsx does for real. */
async function resumeStepFor(userId: string) {
  const [profile, avatar] = await Promise.all([
    db.learnerProfile.findUniqueOrThrow({ where: { userId } }),
    db.learnerAvatar.findUnique({ where: { userId }, select: { animal: true } }),
  ]);
  return resolveResumeStep({ ...profile, avatarAnimal: avatar?.animal ?? null });
}

describe("onboarding (integration, real database)", () => {
  it("resolves to 'welcome' for a brand-new profile", async () => {
    const user = await createTestUser(
      `onboarding-fresh-${Date.now()}@hango.dev`,
    );
    await getOrCreateLearnerProfile(user.id);
    expect(await resumeStepFor(user.id)).toBe("welcome");
  });

  it("uses the route locale as the interface language for a new profile", async () => {
    const user = await createTestUser(
      `onboarding-spanish-${Date.now()}@hango.dev`,
    );
    const profile = await getOrCreateLearnerProfile(user.id, "ES");
    expect(profile.interfaceLanguage).toBe("ES");
  });

  it("returns Spanish validation feedback when onboarding is in Spanish", async () => {
    const user = await createTestUser(
      `onboarding-spanish-validation-${Date.now()}@hango.dev`,
    );
    await getOrCreateLearnerProfile(user.id, "ES");
    const result = await saveGoalStepAction(
      { status: "idle" },
      formDataOf([["locale", "es"]]),
    );
    expect(result).toEqual({
      status: "error",
      message: "Selecciona al menos un objetivo",
    });
  });

  it("advances the resume step as each step is saved", async () => {
    const user = await createTestUser(
      `onboarding-flow-${Date.now()}@hango.dev`,
    );
    await getOrCreateLearnerProfile(user.id);

    await saveProfileStepAction(
      { status: "idle" },
      formDataOf([
        ["displayName", "Test Learner"],
        ["nickname", `tester${Date.now()}`],
      ]),
    );
    expect(await resumeStepFor(user.id)).toBe("avatar");

    await saveAvatarAnimalAction("RABBIT");
    expect(await resumeStepFor(user.id)).toBe("goal");

    await saveGoalStepAction(
      { status: "idle" },
      formDataOf([["learningGoals", "TRAVEL"]]),
    );
    expect(await resumeStepFor(user.id)).toBe("level");

    await saveLevelStepAction(
      { status: "idle" },
      formDataOf([["currentLevel", "HSK_4"]]),
    );
    expect(await resumeStepFor(user.id)).toBe("explanation-language");

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
    expect(await resumeStepFor(user.id)).toBe("placement-offer");

    await acknowledgePlacementOfferAction();

    expect(await resumeStepFor(user.id)).toBe("recommendation");
    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.onboardingCompletedAt).toBeNull();
  });

  it("rejects a nickname already taken by another user", async () => {
    const nickname = `taken${Date.now()}`;

    const firstUser = await createTestUser(
      `onboarding-nick-a-${Date.now()}@hango.dev`,
    );
    await getOrCreateLearnerProfile(firstUser.id);
    const firstResult = await saveProfileStepAction(
      { status: "idle" },
      formDataOf([
        ["displayName", "First Learner"],
        ["nickname", nickname],
      ]),
    );
    expect(firstResult.status).toBe("idle");

    const secondUser = await createTestUser(
      `onboarding-nick-b-${Date.now()}@hango.dev`,
    );
    await getOrCreateLearnerProfile(secondUser.id);
    const secondResult = await saveProfileStepAction(
      { status: "idle" },
      formDataOf([
        ["displayName", "Second Learner"],
        ["nickname", nickname],
      ]),
    );
    expect(secondResult.status).toBe("error");

    const secondProfile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: secondUser.id },
    });
    expect(secondProfile.nickname).toBeNull();
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
