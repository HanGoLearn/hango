"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { setInterfaceLocaleAction } from "@/lib/actions/locale";
import { localePath, type AppLocale } from "@/i18n/config";
import { cn } from "@/lib/cn";

export function LanguageSwitcher({
  locale,
  label,
  className,
}: {
  locale: AppLocale;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingLocale, setPendingLocale] = useState<AppLocale | null>(null);

  async function changeLocale(nextLocale: AppLocale) {
    if (nextLocale === locale || pendingLocale !== null) return;
    setPendingLocale(nextLocale);

    try {
      await setInterfaceLocaleAction(nextLocale);
      const search = window.location.search;
      const hash = window.location.hash;
      router.replace(`${localePath(nextLocale, pathname)}${search}${hash}`);
    } catch {
      setPendingLocale(null);
    }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface/90 p-1 shadow-sm",
        className,
      )}
      role="group"
      aria-label={label}
    >
      <Languages className="ml-1.5 size-4 text-text-muted" aria-hidden="true" />
      {(["es", "en"] as const).map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            disabled={pendingLocale !== null}
            onClick={() => changeLocale(option)}
            className={cn(
              "min-w-9 rounded-full px-2.5 py-1.5 text-caption font-bold uppercase transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
              active
                ? "bg-primary-500 text-on-color-light"
                : "text-text-secondary hover:bg-elevated hover:text-text-primary",
              pendingLocale === option && "opacity-70",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
