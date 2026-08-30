"use server";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  learningPreferencesSchema,
  defaultAiModeSchema,
  recordingRetentionSchema,
} from "@/lib/validation/settings";
import { profileStepSchema } from "@/lib/validation/onboarding";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export interface SettingsActionState {
  status: "idle" | "error";
  message?: string;
}

const idleState: SettingsActionState = { status: "idle" };

export async function setAiConversationStorageEnabledAction(
  enabled: boolean,
): Promise<void> {
  const userId = await requireUserId();
  await db.learnerProfile.update({
    where: { userId },
    data: { aiConversationStorageEnabled: enabled },
  });
}

/**
 * The name Han uses to address the learner (2026-08-29) - unlike the
 * Account Name below, this was never meant to be permanent (user: "el
 * nombre de la persona, al que Han lo llamará así, ese sí se puede
 * cambiar"). Always allowed, no uniqueness constraint - this is the same
 * `displayName` field the onboarding "profile" step first sets, just a
 * second, ongoing entry point into it.
 */
export async function updateDisplayNameAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = profileStepSchema.shape.displayName.safeParse(
    formData.get("displayName"),
  );
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }
  const userId = await requireUserId();
  await db.learnerProfile.update({
    where: { userId },
    data: { displayName: parsed.data },
  });
  return idleState;
}

/**
 * The permanent leaderboard handle (2026-08-29, user: "el Account Name...
 * el cual ya no se puede cambiar y se va a mantener así por el resto de
 * la vida de la cuenta"). Settable exactly once - the onboarding
 * "profile" step is the normal path (nickname is always null there,
 * since `resolveResumeStep` never shows that step again once it's set);
 * this is the retroactive path for every account that finished
 * onboarding before that step existed. Enforced server-side, not just by
 * hiding the input once set (`leaderboard-profile-section.tsx`'s
 * predecessor only did the latter) - a direct POST after the field is
 * already set must still be rejected.
 */
export async function updateAccountNameAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = profileStepSchema.shape.nickname.safeParse(
    formData.get("nickname"),
  );
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }
  const userId = await requireUserId();

  const current = await db.learnerProfile.findUnique({
    where: { userId },
    select: { nickname: true },
  });
  if (current?.nickname) {
    return {
      status: "error",
      message: "Your Account Name is already set and can't be changed.",
    };
  }

  const existing = await db.learnerProfile.findUnique({
    where: { nickname: parsed.data },
    select: { userId: true },
  });
  if (existing) {
    return {
      status: "error",
      message: "That Account Name is taken. Try another one.",
    };
  }

  await db.learnerProfile.update({
    where: { userId },
    data: { nickname: parsed.data },
  });
  return idleState;
}

export async function updateLearningPreferencesAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = learningPreferencesSchema.safeParse({
    interfaceLanguage: formData.get("interfaceLanguage"),
    explanationLanguage: formData.get("explanationLanguage"),
    learningGoals: formData.getAll("learningGoals"),
    skillPriorities: formData.getAll("skillPriorities"),
    dailyStudyTargetMinutes: formData.get("dailyStudyTargetMinutes"),
    correctionStyle: formData.get("correctionStyle"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message };
  }
  const userId = await requireUserId();
  await db.learnerProfile.update({ where: { userId }, data: parsed.data });
  return idleState;
}

export async function updateDefaultAiModeAction(mode: string): Promise<void> {
  const parsed = defaultAiModeSchema.parse(mode);
  const userId = await requireUserId();
  await db.learnerProfile.update({
    where: { userId },
    data: { defaultAiMode: parsed },
  });
}

/**
 * Restricted to "cedar" only (2026-08-21, user request) - the other 12
 * voices are no longer selectable; this Set is the actual enforcement
 * point (the Select in han-audio-settings.tsx only offers "cedar" too, but
 * this is what a request can't bypass). Every existing profile was
 * backfilled to "cedar" in migration 20260821223212_add_audio_only_han_response_mode.
 */
const HAN_VOICES = new Set(["cedar"]);

export async function updateHanAudioSettingsAction(
  responseMode: string,
  voice: string,
): Promise<void> {
  if (
    responseMode !== "TEXT_ONLY" &&
    responseMode !== "TEXT_AND_AUDIO" &&
    responseMode !== "AUDIO_ONLY"
  ) {
    throw new Error("Invalid Han response mode");
  }
  if (!HAN_VOICES.has(voice)) throw new Error("Invalid Han voice");
  const userId = await requireUserId();
  await db.learnerProfile.update({
    where: { userId },
    data: { hanResponseMode: responseMode, hanVoice: voice },
  });
}

export async function updateRecordingRetentionAction(
  days: number | null,
): Promise<void> {
  const parsed = recordingRetentionSchema.parse(days);
  const userId = await requireUserId();
  await db.learnerProfile.update({
    where: { userId },
    data: { recordingRetentionDays: parsed },
  });
}

/**
 * "Request account deletion" (14.4) - implemented as immediate, learner-
 * confirmed self-service deletion (the client requires an explicit typed
 * confirmation before calling this), not a queued request an admin
 * reviews - no such review workflow exists in this project. Every related
 * table cascades from `User` via `onDelete: Cascade`.
 */
export async function deleteAccountAction(): Promise<void> {
  const userId = await requireUserId();
  await db.user.delete({ where: { id: userId } });
  await signOut({ redirectTo: "/" });
}
