import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: authMock,
  signOut: vi.fn().mockRejectedValue({ digest: "NEXT_REDIRECT;push;/;307;" }),
}));

const {
  updateDisplayNameAction,
  updateAccountNameAction,
  updateLearningPreferencesAction,
  updateDefaultAiModeAction,
  updateHanAudioSettingsAction,
  updateRecordingRetentionAction,
  deleteAccountAction,
} = await import("@/lib/actions/settings");

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
  await db.learnerProfile.create({ data: { userId: user.id } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

function formDataOf(entries: [string, string][]): FormData {
  const formData = new FormData();
  for (const [key, value] of entries) formData.append(key, value);
  return formData;
}

describe("Settings actions (integration, real database)", () => {
  it("updates the display name (the name Han uses) freely, any number of times", async () => {
    const user = await createTestUser(
      `settings-displayname-${Date.now()}@hango.dev`,
    );

    let result = await updateDisplayNameAction(
      { status: "idle" },
      formDataOf([["displayName", "First Name"]]),
    );
    expect(result.status).toBe("idle");

    result = await updateDisplayNameAction(
      { status: "idle" },
      formDataOf([["displayName", "Changed My Mind"]]),
    );
    expect(result.status).toBe("idle");

    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.displayName).toBe("Changed My Mind");
  });

  it("sets the Account Name retroactively (2026-08-29 - accounts from before onboarding's profile step existed)", async () => {
    const user = await createTestUser(
      `settings-accountname-${Date.now()}@hango.dev`,
    );

    const result = await updateAccountNameAction(
      { status: "idle" },
      formDataOf([["nickname", `retro${Date.now()}`]]),
    );

    expect(result.status).toBe("idle");
    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.nickname).toMatch(/^retro\d+$/);
  });

  it("rejects changing the Account Name once it's already set (2026-08-29 - permanent for the life of the account)", async () => {
    const user = await createTestUser(
      `settings-accountname-locked-${Date.now()}@hango.dev`,
    );
    const firstNickname = `locked${Date.now()}`;
    await updateAccountNameAction(
      { status: "idle" },
      formDataOf([["nickname", firstNickname]]),
    );

    const result = await updateAccountNameAction(
      { status: "idle" },
      formDataOf([["nickname", `different${Date.now()}`]]),
    );

    expect(result.status).toBe("error");
    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.nickname).toBe(firstNickname);
  });

  it("rejects an Account Name already taken by another user", async () => {
    const nickname = `lbtaken${Date.now()}`;
    await createTestUser(`settings-accountname-a-${Date.now()}@hango.dev`);
    await updateAccountNameAction(
      { status: "idle" },
      formDataOf([["nickname", nickname]]),
    );

    await createTestUser(`settings-accountname-b-${Date.now()}@hango.dev`);
    const result = await updateAccountNameAction(
      { status: "idle" },
      formDataOf([["nickname", nickname]]),
    );

    expect(result.status).toBe("error");
  });

  it("rejects an Account Name with invalid characters", async () => {
    await createTestUser(
      `settings-accountname-invalid-${Date.now()}@hango.dev`,
    );

    const result = await updateAccountNameAction(
      { status: "idle" },
      formDataOf([["nickname", "not a valid nickname!"]]),
    );

    expect(result.status).toBe("error");
  });

  it("updates learning preferences together", async () => {
    const user = await createTestUser(
      `settings-learning-${Date.now()}@hango.dev`,
    );

    const formData = formDataOf([
      ["interfaceLanguage", "ES"],
      ["explanationLanguage", "ZH"],
      ["learningGoals", "TRAVEL"],
      ["skillPriorities", "SPEAKING"],
      ["dailyStudyTargetMinutes", "30"],
      ["correctionStyle", "IMMEDIATE"],
    ]);

    const result = await updateLearningPreferencesAction(
      { status: "idle" },
      formData,
    );

    expect(result.status).toBe("idle");
    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.interfaceLanguage).toBe("ES");
    expect(profile.explanationLanguage).toBe("ZH");
    expect(profile.learningGoals).toEqual(["TRAVEL"]);
    expect(profile.skillPriorities).toEqual(["SPEAKING"]);
    expect(profile.dailyStudyTargetMinutes).toBe(30);
    expect(profile.correctionStyle).toBe("IMMEDIATE");
  });

  it("rejects learning preferences with no goals selected", async () => {
    await createTestUser(`settings-learning-invalid-${Date.now()}@hango.dev`);

    const formData = formDataOf([
      ["interfaceLanguage", "EN"],
      ["explanationLanguage", "EN"],
      ["skillPriorities", "SPEAKING"],
      ["dailyStudyTargetMinutes", "30"],
      ["correctionStyle", "IMMEDIATE"],
    ]);

    const result = await updateLearningPreferencesAction(
      { status: "idle" },
      formData,
    );
    expect(result.status).toBe("error");
  });

  it("updates the default AI mode", async () => {
    const user = await createTestUser(
      `settings-aimode-${Date.now()}@hango.dev`,
    );

    await updateDefaultAiModeAction("PRACTICE");

    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.defaultAiMode).toBe("PRACTICE");
  });

  it("updates Han's response mode and voice", async () => {
    const user = await createTestUser(`settings-han-${Date.now()}@hango.dev`);

    await updateHanAudioSettingsAction("TEXT_AND_AUDIO", "cedar");

    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.hanResponseMode).toBe("TEXT_AND_AUDIO");
    expect(profile.hanVoice).toBe("cedar");
  });

  it("accepts the audio-only response mode (2026-08-21)", async () => {
    const user = await createTestUser(
      `settings-han-audio-only-${Date.now()}@hango.dev`,
    );

    await updateHanAudioSettingsAction("AUDIO_ONLY", "cedar");

    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.hanResponseMode).toBe("AUDIO_ONLY");
  });

  it("rejects any voice other than cedar (2026-08-21, voice restricted to cedar only)", async () => {
    await createTestUser(`settings-han-voice-${Date.now()}@hango.dev`);

    await expect(
      updateHanAudioSettingsAction("TEXT_AND_AUDIO", "marin"),
    ).rejects.toThrow("Invalid Han voice");
  });

  it("updates the recording retention preference, including clearing it back to indefinite", async () => {
    const user = await createTestUser(
      `settings-retention-${Date.now()}@hango.dev`,
    );

    await updateRecordingRetentionAction(90);
    let profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.recordingRetentionDays).toBe(90);

    await updateRecordingRetentionAction(null);
    profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: user.id },
    });
    expect(profile.recordingRetentionDays).toBeNull();
  });

  it("permanently deletes the account", async () => {
    const user = await createTestUser(
      `settings-delete-${Date.now()}@hango.dev`,
    );

    await expect(deleteAccountAction()).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });

    expect(await db.user.findUnique({ where: { id: user.id } })).toBeNull();
  });

  it("Server Actions require an authenticated session", async () => {
    authMock.mockResolvedValue(null);
    await expect(
      updateDisplayNameAction(
        { status: "idle" },
        formDataOf([["displayName", "x"]]),
      ),
    ).rejects.toThrow("Not authenticated");
  });
});
