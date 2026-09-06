import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdministrator } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const administrator = await requireAdministrator();

  return (
    <AdminShell administratorName={administrator.name ?? "Arean"}>
      {children}
    </AdminShell>
  );
}
