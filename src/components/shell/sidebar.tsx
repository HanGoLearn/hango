"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavItems } from "@/lib/navigation";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";

/**
 * Persistent desktop navigation (docs/04_design/ui.md, components.md).
 * Hidden below the md breakpoint — MobileBottomNav takes over there.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="hidden w-56 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4 md:flex"
    >
      <Link
        href="/dashboard"
        className="w-fit rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <Logo />
      </Link>

      <ul className="flex flex-1 flex-col gap-1">
        {primaryNavItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-control px-3 py-2 font-interface text-body transition-colors duration-fast ease-standard",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
                  isActive
                    ? // Solid fill, not a translucent wash (2026-08-21): a
                      // fixed text shade over a `/15` wash can't stay legible
                      // in both themes at once (the wash's rendered color
                      // depends on what's behind it, which flips lightness
                      // between themes) - confirmed via contrast check,
                      // primary-100 measured 1.02:1 (invisible) on the light
                      // theme's wash. A solid primary-500 fill + the same
                      // fixed on-color-light token Button/Checkbox use
                      // (verified 5.60/6.29:1 in both themes) sidesteps the
                      // problem entirely instead of chasing a fixed shade
                      // that can't work against a variable-lightness wash.
                      "bg-primary-500 text-on-color-light font-medium"
                    : "text-text-secondary hover:bg-elevated hover:text-text-primary",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-[0.4rem]",
                    item.badgeClassName,
                  )}
                >
                  <Icon
                    className={cn("size-3.5", item.badgeIconClassName)}
                    aria-hidden="true"
                  />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border pt-4 font-interface text-supporting text-text-secondary">
        Learner profile
      </div>
    </nav>
  );
}
