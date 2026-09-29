"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdministrator } from "@/lib/admin-auth";
import { normalizeBetaInvitationEmail } from "@/lib/beta-access";
import { db } from "@/lib/db";

export type BetaInvitationFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const invitationSchema = z.object({
  email: z.email("Escribe un correo válido.").trim().toLowerCase(),
  cohort: z.string().trim().max(60, "Máximo 60 caracteres.").optional(),
  note: z.string().trim().max(300, "Máximo 300 caracteres.").optional(),
  expiresOn: z.string().trim().max(10).optional(),
});

const invitationIdSchema = z.string().trim().min(1).max(128);

function parseExpiry(value: string | undefined): Date | null | "invalid" {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "invalid";
  const date = new Date(`${value}T23:59:59-05:00`);
  if (Number.isNaN(date.getTime()) || date <= new Date()) return "invalid";
  return date;
}

export async function createBetaInvitationAction(
  _previous: BetaInvitationFormState,
  formData: FormData,
): Promise<BetaInvitationFormState> {
  const administrator = await requireAdministrator();
  const parsed = invitationSchema.safeParse({
    email: formData.get("email"),
    cohort: formData.get("cohort"),
    note: formData.get("note"),
    expiresOn: formData.get("expiresOn"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los campos marcados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const expiresAt = parseExpiry(parsed.data.expiresOn);
  if (expiresAt === "invalid") {
    return {
      ok: false,
      message: "La fecha de vencimiento debe ser futura.",
      fieldErrors: { expiresOn: ["Elige una fecha futura."] },
    };
  }

  const email = normalizeBetaInvitationEmail(parsed.data.email);
  const existing = await db.betaInvitation.findUnique({
    where: { email },
    select: { id: true, status: true },
  });
  if (existing?.status === "ACTIVATED") {
    return {
      ok: false,
      message: "Ese correo ya activó una cuenta de la beta.",
    };
  }

  const now = new Date();
  if (existing) {
    await db.betaInvitation.update({
      where: { id: existing.id },
      data: {
        status: "PENDING",
        cohort: parsed.data.cohort || null,
        note: parsed.data.note || null,
        expiresAt,
        invitedAt: now,
        revokedAt: null,
        createdByUserId: administrator.id,
      },
    });
  } else {
    await db.betaInvitation.create({
      data: {
        email,
        cohort: parsed.data.cohort || null,
        note: parsed.data.note || null,
        expiresAt,
        createdByUserId: administrator.id,
      },
    });
  }

  revalidatePath("/admin/invitations");
  return {
    ok: true,
    message: existing
      ? "Invitación habilitada nuevamente."
      : "Invitación creada. Ya puedes compartir el acceso con ese correo.",
  };
}

export async function revokeBetaInvitationAction(invitationId: string) {
  await requireAdministrator();
  const parsedId = invitationIdSchema.safeParse(invitationId);
  if (!parsedId.success) return;

  await db.betaInvitation.updateMany({
    where: { id: parsedId.data, status: "PENDING" },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
  revalidatePath("/admin/invitations");
}

export async function reopenBetaInvitationAction(invitationId: string) {
  await requireAdministrator();
  const parsedId = invitationIdSchema.safeParse(invitationId);
  if (!parsedId.success) return;

  await db.betaInvitation.updateMany({
    where: {
      id: parsedId.data,
      status: { in: ["PENDING", "REVOKED"] },
      activatedUserId: null,
    },
    data: {
      status: "PENDING",
      invitedAt: new Date(),
      revokedAt: null,
      expiresAt: null,
    },
  });
  revalidatePath("/admin/invitations");
}
