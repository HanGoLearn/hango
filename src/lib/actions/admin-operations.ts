"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdministrator } from "@/lib/admin-auth";
import { db } from "@/lib/db";

const resolveSchema = z.object({ eventId: z.string().min(1).max(100) });

export async function resolveOperationalEventAction(formData: FormData) {
  await requireAdministrator();
  const parsed = resolveSchema.safeParse({ eventId: formData.get("eventId") });
  if (!parsed.success) return;

  await db.operationalEvent.updateMany({
    where: { id: parsed.data.eventId, resolvedAt: null },
    data: { resolvedAt: new Date() },
  });
  revalidatePath("/admin/operations");
}
