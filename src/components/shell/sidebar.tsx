"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navEntries, type NavItem } from "@/lib/navigation";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/cn";
import { localePath, pathWithoutLocale, type AppLocale } from "@/i18n/config";
import type { ShellMessages } from "@/i18n/messages/types";

/**
 * Persistent desktop navigation (docs/04_design/ui.md, components.md).
 * Hidden below the md breakpoint — MobileBottomNav takes over there.
 */
export function Sidebar({
  locale,
  messages,
}: {
  locale: AppLocale;
  messages: ShellMessages;
}) {
  const pathname = usePathname();
  const localeNeutralPathname = pathWithoutLocale(pathname);

  return (
    <nav
      aria-label={messages.primaryNavigation}
      data-tour-id="primary-nav"
      className="hidden w-56 shrink-0 flex-col gap-6 border-r border-border bg-surface p-4 md:flex"
    >
      <Link
        href={localePath(locale, "/dashboard")}
        className="w-fit rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <Logo />
      </Link>

      <ul className="flex flex-1 flex-col gap-1">
        {navEntries.map((entry) => {
          if (entry.kind === "group") {
            const GroupIcon = entry.icon;
            return (
              <li key={entry.key} className="mt-1 flex flex-col gap-1">
                <div
                  data-tour-id={`nav-${entry.key}`}
                  className="flex items-center gap-3 px-3 py-1 font-interface text-caption font-semibold uppercase tracking-wide text-text-muted"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-[0.4rem]",
                      entry.badgeClassName,
                    )}
                  >
                    <GroupIcon
                      className={cn("size-3.5", entry.badgeIconClassName)}
                      aria-hidden="true"
                    />
                  </span>
                  {messages.navigation[entry.key].label}
                </div>
                <ul className="flex flex-col gap-1 pl-4">
                  {entry.items.map((item) => (
                    <li key={item.href}>
                      <SidebarLink
                        item={item}
                        locale={locale}
                        label={messages.navigation[item.key].label}
                        isActive={localeNeutralPathname.startsWith(item.href)}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            );
          }

          const item = entry.item;
          return (
            <li key={item.href}>
              <SidebarLink
                item={item}
                locale={locale}
                label={messages.navigation[item.key].label}
                isActive={localeNeutralPathname.startsWith(item.href)}
              />
            </li>
          );
        })}
      </ul>

      <div className="border-t border-border pt-4 font-interface text-supporting text-text-secondary">
        {messages.learnerProfile}
      </div>
    </nav>
  );
}

function SidebarLink({
  item,
  locale,
  label,
  isActive,
}: {
  item: NavItem;
  locale: AppLocale;
  label: string;
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={localePath(locale, item.href)}
      aria-current={isActive ? "page" : undefined}
      data-tour-id={`nav-${item.key}`}
      className={cn(
        "flex items-center gap-3 rounded-control px-3 py-2 font-interface text-body transition-colors duration-fast ease-standard",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600",
        isActive
          ? // Solid fill, not a translucent wash (2026-08-21): a fixed text
            // shade over a `/15` wash can't stay legible in both themes at
            // once (the wash's rendered color depends on what's behind it,
            // which flips lightness between themes) - confirmed via contrast
            // check, primary-100 measured 1.02:1 (invisible) on the light
            // theme's wash. A solid primary-500 fill + the same fixed
            // on-color-light token Button/Checkbox use (verified 5.60/6.29:1
            // in both themes) sidesteps the problem entirely instead of
            // chasing a fixed shade that can't work against a
            // variable-lightness wash.
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
      {label}
    </Link>
  );
}
