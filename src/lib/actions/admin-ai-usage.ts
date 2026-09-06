"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrator } from "@/lib/admin-auth";
import { setDailyUsageCap, InvalidDailyCapError } from "@/lib/admin-ai-usage";
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
