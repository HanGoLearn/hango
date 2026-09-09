"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrator } from "@/lib/admin-auth";
import {
  setDailyUsageCap,
  setUserAiUsageCap,
  InvalidDailyCapError,
  InvalidUserAiUsageCapError,
  type UserAiUsageCapMode,
} from "@/lib/admin-ai-usage";
import { AI_USAGE_FEATURES, type AiUsageFeature } from "@/lib/ai-usage";

export type UpdateDailyCapResult = { ok: true } | { ok: false; error: string };

/** Admin-only (2026-09-05 cost audit) - see app/(admin)/admin/limits/page.tsx. */
export async function updateDailyUsageCapAction(
  feature: string,
  dailyLimitUsd: number,
): Promise<UpdateDailyCapResult> {
  await requireAdministrator();

  if (!AI_USAGE_FEATURES.includes(feature as AiUsageFeature)) {
    return { ok: false, error: "Función desconocida." };
  }

  try {
    await setDailyUsageCap(feature as AiUsageFeature, dailyLimitUsd);
    revalidatePath("/admin/limits");
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

  if (!AI_USAGE_FEATURES.includes(feature as AiUsageFeature)) {
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
      feature: feature as AiUsageFeature,
      mode: mode as UserAiUsageCapMode,
      dailyLimitUsd,
    });
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/operations");
    return { ok: true };
  } catch (error) {
    if (error instanceof InvalidUserAiUsageCapError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "No se pudo guardar. Inténtalo nuevamente." };
  }
}
