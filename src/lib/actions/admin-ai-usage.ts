"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrator } from "@/lib/admin-auth";
import {
  setDailyUsageCap,
  setGlobalAiBudgetPolicy,
  setUserAiUsageCap,
  InvalidDailyCapError,
  InvalidGlobalAiBudgetPolicyError,
  InvalidUserAiUsageCapError,
  type UserAiUsageCapMode,
} from "@/lib/admin-ai-usage";
import { normalizeAiLimitKey } from "@/lib/ai-experiences";

export type UpdateDailyCapResult = { ok: true } | { ok: false; error: string };

export async function updateGlobalAiBudgetPolicyAction(input: {
  dailyLimitUsd: number;
  textEnabled: boolean;
  sttEnabled: boolean;
  ttsEnabled: boolean;
  realtimeEnabled: boolean;
}): Promise<UpdateDailyCapResult> {
  await requireAdministrator();

  try {
    await setGlobalAiBudgetPolicy(input);
    revalidatePath("/admin/limits");
    return { ok: true };
  } catch (error) {
    if (error instanceof InvalidGlobalAiBudgetPolicyError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "No se pudo guardar. Inténtalo nuevamente." };
  }
}

/** Admin-only (2026-09-05 cost audit) - see app/(admin)/admin/limits/page.tsx. */
export async function updateDailyUsageCapAction(
  feature: string,
  dailyLimitUsd: number,
): Promise<UpdateDailyCapResult> {
  await requireAdministrator();

  if (!normalizeAiLimitKey(feature)) {
    return { ok: false, error: "Función desconocida." };
  }

  try {
    await setDailyUsageCap(feature, dailyLimitUsd);
    revalidatePath("/admin/limits");
    revalidatePath("/admin/analytics");
    return { ok: true };
  } catch (error) {
    if (error instanceof InvalidDailyCapError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "No se pudo guardar. Inténtalo nuevamente." };
  }
}

export async function updateUserAiUsageCapAction(
  userId: string,
  feature: string,
  mode: string,
  dailyLimitUsd?: number,
): Promise<UpdateDailyCapResult> {
  await requireAdministrator();

  if (!normalizeAiLimitKey(feature)) {
    return { ok: false, error: "Función desconocida." };
  }
  if (
    !(["GENERAL", "CUSTOM", "BLOCKED"] as const).includes(
      mode as UserAiUsageCapMode,
    )
  ) {
    return { ok: false, error: "Tipo de límite desconocido." };
  }

  try {
    await setUserAiUsageCap({
      userId,
      feature,
      mode: mode as UserAiUsageCapMode,
      dailyLimitUsd,
    });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/operations");
    revalidatePath("/admin/analytics");
    revalidatePath("/admin/limits");
    return { ok: true };
  } catch (error) {
    if (error instanceof InvalidUserAiUsageCapError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "No se pudo guardar. Inténtalo nuevamente." };
  }
}
