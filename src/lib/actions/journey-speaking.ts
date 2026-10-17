"use server";

import { auth } from "@/lib/auth";
import {
  startJourneySpeakingAttempt,
  sealJourneySpeakingAttempt,
} from "@/lib/journey-speaking-attempts";
import type { JourneyAttemptSnapshot } from "@/lib/journey-speaking-attempt-contract";
import type { JourneySpeakingBanks } from "@/lib/content/journey-speaking-bank-contract";

type StartResult =
  | { ok: true; attemptId: string; banks: JourneySpeakingBanks }
  | { ok: false; code: "UNAUTHENTICATED" | "UNAVAILABLE" };

/** Identity and snapshot are always server-owned; no grading/provider calls. */
export async function startJourneySpeakingAttemptAction(
  input: unknown,
): Promise<StartResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: "UNAUTHENTICATED" };
  try {
    const attempt = await startJourneySpeakingAttempt(session.user.id, input);
    if (attempt.status !== "ACTIVE") return { ok: false, code: "UNAVAILABLE" };
    return {
      ok: true,
      attemptId: attempt.id,
      banks: (attempt.snapshot as unknown as JourneyAttemptSnapshot).banks,
    };
  } catch {
    return { ok: false, code: "UNAVAILABLE" };
  }
}

export async function sealJourneySpeakingAttemptAction(
  input: unknown,
): Promise<
  | { ok: true; attemptId: string }
  | { ok: false; code: "UNAUTHENTICATED" | "UNAVAILABLE" }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, code: "UNAUTHENTICATED" };
  try {
    const attempt = await sealJourneySpeakingAttempt(session.user.id, input);
    return { ok: true, attemptId: attempt.id };
  } catch {
    return { ok: false, code: "UNAVAILABLE" };
  }
}
