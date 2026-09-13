"use server";

import { revalidatePath } from "next/cache";
import { revalidateLocalizedPath } from "@/i18n/revalidate";
import { z } from "zod";
import { requireAdministrator } from "@/lib/admin-auth";
import { grantAdminCoins } from "@/lib/admin-communications";
import { db } from "@/lib/db";

export type AdminFormState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const announcementSchema = z
  .object({
    title: z.string().trim().min(3, "Escribe un título.").max(90),
    message: z
      .string()
      .trim()
      .min(10, "El anuncio necesita más contexto.")
      .max(1200),
    type: z.enum(["INFO", "UPDATE", "MAINTENANCE", "CELEBRATION", "IMPORTANT"]),
    priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]),
    publication: z.enum(["DRAFT", "PUBLISHED"]),
    startsAt: z.string().trim().optional(),
    endsAt: z.string().trim().optional(),
    ctaLabel: z.string().trim().max(40).optional(),
    ctaHref: z.string().trim().max(200).optional(),
  })
  .superRefine((data, context) => {
    if (Boolean(data.ctaLabel) !== Boolean(data.ctaHref)) {
      context.addIssue({
        code: "custom",
        path: ["ctaLabel"],
        message: "Completa tanto el texto como el destino del botón.",
      });
    }
    if (
      data.ctaHref &&
      (!data.ctaHref.startsWith("/") || data.ctaHref.startsWith("//"))
    ) {
      context.addIssue({
        code: "custom",
        path: ["ctaHref"],
        message: "Usa una ruta interna de HanGo, por ejemplo /learn.",
      });
    }
  });

const coinGrantSchema = z.object({
  requestId: z.string().uuid(),
  recipientUserId: z.string().min(1, "Elige un usuario."),
  amount: z.coerce
    .number()
    .int()
    .min(1, "El mínimo es 1 HanCoin.")
    .max(10_000, "El máximo por entrega es 10.000 HanCoins."),
  message: z
    .string()
    .trim()
    .min(3, "Escribe el mensaje que verá el usuario.")
    .max(300),
  internalNote: z.string().trim().max(300).optional(),
});

function fields(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function invalid(error: z.ZodError): AdminFormState {
  return {
    ok: false,
    message: "Revisa los campos marcados.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

export async function createAnnouncementAction(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const administrator = await requireAdministrator();
  const parsed = announcementSchema.safeParse(fields(formData));
  if (!parsed.success) return invalid(parsed.error);

  const startsAt = parsed.data.startsAt
    ? new Date(parsed.data.startsAt)
    : new Date();
  const endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
  if (
    Number.isNaN(startsAt.getTime()) ||
    (endsAt && Number.isNaN(endsAt.getTime()))
  ) {
    return { ok: false, message: "Las fechas no son válidas." };
  }
  if (endsAt && endsAt <= startsAt) {
    return {
      ok: false,
      message: "La fecha de finalización debe ser posterior al inicio.",
    };
  }

  await db.announcement.create({
    data: {
      title: parsed.data.title,
      message: parsed.data.message,
      type: parsed.data.type,
      priority: parsed.data.priority,
      status: parsed.data.publication,
      startsAt,
      endsAt,
      ctaLabel: parsed.data.ctaLabel || null,
      ctaHref: parsed.data.ctaHref || null,
      createdByUserId: administrator.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/communications");
  revalidateLocalizedPath("/dashboard");
  return {
    ok: true,
    message:
      parsed.data.publication === "PUBLISHED"
        ? "Anuncio publicado."
        : "Borrador guardado.",
  };
}

export async function archiveAnnouncementAction(announcementId: string) {
  await requireAdministrator();
  await db.announcement.update({
    where: { id: announcementId },
    data: { status: "ARCHIVED", endsAt: new Date() },
  });
  revalidatePath("/admin/communications");
  revalidateLocalizedPath("/dashboard");
}

export async function grantHanCoinsAction(
  _previous: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const administrator = await requireAdministrator();
  const parsed = coinGrantSchema.safeParse(fields(formData));
  if (!parsed.success) return invalid(parsed.error);

  const recipient = await db.user.findUnique({
    where: { id: parsed.data.recipientUserId },
    select: { id: true, email: true },
  });
  if (
    !recipient ||
    recipient.email?.toLowerCase() === administrator.email?.toLowerCase()
  ) {
    return {
      ok: false,
      message: "Ese usuario no está disponible para recibir HanCoins.",
    };
  }

  try {
    const result = await grantAdminCoins({
      recipientUserId: recipient.id,
      grantedByUserId: administrator.id,
      requestId: parsed.data.requestId,
      amount: parsed.data.amount,
      message: parsed.data.message,
      internalNote: parsed.data.internalNote,
    });
    if (result.alreadyProcessed) {
      return {
        ok: true,
        message: "Esta entrega ya había sido procesada.",
      };
    }
  } catch {
    return {
      ok: false,
      message: "No se pudo completar la entrega. Inténtalo nuevamente.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${recipient.id}`);
  revalidatePath("/admin/communications");
  revalidateLocalizedPath("/dashboard");
  return {
    ok: true,
    message: `${parsed.data.amount.toLocaleString("es-CO")} HanCoins otorgados correctamente.`,
  };
}
