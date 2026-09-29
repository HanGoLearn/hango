"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Coins,
  Gauge,
  Megaphone,
  MessageSquareText,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

const navigation = [
  { href: "/admin", label: "Resumen", icon: BarChart3, exact: true },
  { href: "/admin/analytics", label: "Analítica", icon: TrendingUp },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/invitations", label: "Invitaciones", icon: UserPlus },
  {
    href: "/admin/communications",
    label: "Comunicaciones",
    icon: Megaphone,
  },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquareText },
  { href: "/admin/limits", label: "Límites de IA", icon: Gauge },
  {
    href: "/admin/operations",
    label: "Operaciones",
    icon: ShieldAlert,
  },
];

export function AdminShell({
  administratorName,
  children,
}: {
  administratorName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-page text-text-primary">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-card bg-primary-500 text-on-color-light">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-interface text-body font-semibold">
                HanGo Admin
              </p>
              <p className="font-interface text-caption text-text-muted">
                Consola privada de {administratorName}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="rounded-control border border-border-strong px-3 py-2 font-interface text-supporting font-medium text-text-primary transition-colors hover:bg-elevated"
          >
            Volver a HanGo
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px] flex-col lg:min-h-[calc(100dvh-65px)] lg:flex-row">
        <aside className="border-b border-border bg-surface lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
          <nav
            aria-label="Administración"
            className="flex gap-1 overflow-x-auto p-3 lg:sticky lg:top-[65px] lg:flex-col lg:p-4"
          >
            {navigation.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-control px-3 py-2.5 font-interface text-supporting font-medium transition-colors",
                    active
                      ? "bg-primary-500 text-on-color-light"
                      : "text-text-secondary hover:bg-elevated hover:text-text-primary",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
            <div className="my-2 hidden border-t border-border lg:block" />
            <Link
              href="/admin/communications?compose=coins"
              className="hidden items-center gap-3 rounded-control px-3 py-2.5 font-interface text-supporting font-medium text-accent-300 transition-colors hover:bg-elevated lg:flex"
            >
              <Coins className="size-4" aria-hidden="true" />
              Otorgar HanCoins
            </Link>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
