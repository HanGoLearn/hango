"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requireAdministrator } from "@/lib/admin-auth";
import {
  BETA_FEEDBACK_CATEGORIES,
  BETA_FEEDBACK_STATUSES,
  createBetaFeedback,
  getRecentBetaFeedbackForUser,
} from "@/lib/beta-feedback";
import { db } from "@/lib/db";

const submitSchema = z.object({
  category: z.enum(BETA_FEEDBACK_CATEGORIES),
  rating: z.number().int().min(1).max(5).nullable(),
  message: z.string().trim().min(2).max(2000),
  path: z
    .string()
    .trim()
    .max(300)
    .refine((path) => path.startsWith("/") && !path.startsWith("//")),
  locale: z.enum(["es", "en"]),
});

export type SubmitBetaFeedbackResult =
  | { ok: true }
  | { ok: false; code: "UNAUTHORIZED" | "INVALID" | "RATE_LIMITED" | "ERROR" };

export async function submitBetaFeedbackAction(
  input: unknown,
): Promise<SubmitBetaFeedbackResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, code: "UNAUTHORIZED" };

  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "INVALID" };

  try {
    const result = await createBetaFeedback({
      userId,
      category: parsed.data.category,
      rating: parsed.data.rating,
      message: parsed.data.message,
      path: parsed.data.path,
      locale: parsed.data.locale === "en" ? "EN" : "ES",
    });
    return result === "CREATED"
      ? { ok: true }
      : { ok: false, code: "RATE_LIMITED" };
  } catch {
    return { ok: false, code: "ERROR" };
  }
}

export async function getMyBetaFeedbackAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];
  return getRecentBetaFeedbackForUser(userId);
}

export type AdminFeedbackFormState = {
  ok: boolean;
  message: string;
};

const adminUpdateSchema = z.object({
  feedbackId: z.string().trim().min(1),
  status: z.enum(BETA_FEEDBACK_STATUSES),
  adminResponse: z.string().trim().max(2000).optional(),
  internalNote: z.string().trim().max(2000).optional(),
});

export async function updateBetaFeedbackAction(
  _previous: AdminFeedbackFormState,
  formData: FormData,
): Promise<AdminFeedbackFormState> {
  const administrator = await requireAdministrator();
  const parsed = adminUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa el estado y la longitud de los textos.",
    };
  }

  const existing = await db.betaFeedback.findUnique({
    where: { id: parsed.data.feedbackId },
    select: { id: true },
  });
  if (!existing) return { ok: false, message: "El reporte ya no existe." };

  const now = new Date();
  await db.betaFeedback.update({
    where: { id: existing.id },
    data: {
      status: parsed.data.status,
      adminResponse: parsed.data.adminResponse || null,
      internalNote: parsed.data.internalNote || null,
      reviewedByUserId: administrator.id,
      reviewedAt: now,
      resolvedAt: parsed.data.status === "RESOLVED" ? now : null,
    },
  });

  revalidatePath("/admin/feedback");
  return { ok: true, message: "Reporte actualizado." };
}
