"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mobileNavItems } from "@/lib/navigation";
import { cn } from "@/lib/cn";
import { localePath, pathWithoutLocale, type AppLocale } from "@/i18n/config";
import type { ShellMessages } from "@/i18n/messages/types";

/**
 * Fixed mobile navigation (docs/04_design/ui.md). AI Teacher access stays
 * separate — see AiTeacherBubble.
 */
export function BottomNav({
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
      aria-label={messages.mobileNavigation}
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface md:hidden"
    >
      {mobileNavItems.map((item) => {
        const isActive = localeNeutralPathname.startsWith(item.href);
        const Icon = item.icon;
        const copy = messages.navigation[item.key];
        return (
          <Link
            key={item.href}
            href={localePath(locale, item.href)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 font-interface text-caption transition-colors duration-fast ease-standard",
              "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600",
              // primary-400, not -300 or -500 (2026-08-21): plain text
              // directly on `bg-surface` (which fully inverts lightness
              // between themes, unlike a colored fill) has no single fixed
              // step that clears WCAG AA in both themes at once - -300
              // measured 6.19:1 dark / 2.77:1 light, -500 the reverse
              // (2.92/6.13). -400 lands close to AA in both (4.24/4.05)
              // rather than clearly passing one theme and failing the
              // other; acceptable here since the active tab is also
              // marked by font-weight and its own icon color, not color
              // alone.
              isActive ? "font-medium text-primary-400" : "text-text-secondary",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-[0.4rem]",
                item.badgeClassName,
              )}
            >
              <Icon
                className={cn("size-3.5", item.badgeIconClassName)}
                aria-hidden="true"
              />
            </span>
            {copy.mobile}
          </Link>
        );
      })}
    </nav>
  );
}
