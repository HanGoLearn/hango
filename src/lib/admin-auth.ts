import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { isAdministratorEmail } from "@/lib/admin-identity";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Database-backed authorization for the private back-office. The exact
 * account check is intentional: an old JWT or an accidentally assigned role
 * must not be enough to enter the owner's console.
 */
export const requireAdministrator = cache(async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const administrator = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (
    !administrator ||
    administrator.role !== "ADMINISTRATOR" ||
    !isAdministratorEmail(administrator.email)
  ) {
    redirect("/dashboard");
  }

  return administrator;
});
