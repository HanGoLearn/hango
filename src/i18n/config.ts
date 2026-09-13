export const SUPPORTED_LOCALES = ["es", "en"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "es";
export const LOCALE_COOKIE_NAME = "hango-locale";

export function isAppLocale(
  value: string | null | undefined,
): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}

export function localeFromInterfaceLanguage(
  language: string | null | undefined,
): AppLocale {
  return language === "EN" ? "en" : "es";
}

export function interfaceLanguageFromLocale(locale: AppLocale): "EN" | "ES" {
  return locale === "en" ? "EN" : "ES";
}

export function localePath(locale: AppLocale, path = "/"): string {
  if (path === "/") return `/${locale}`;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const segments = normalizedPath.split("/");
  if (isAppLocale(segments[1])) segments.splice(1, 1);
  return `/${locale}${segments.join("/")}`.replace(/\/$/, "") || `/${locale}`;
}

export function localeFromPathname(pathname: string): AppLocale | null {
  const firstSegment = pathname.split("/")[1];
  return isAppLocale(firstSegment) ? firstSegment : null;
}

export function pathWithoutLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (isAppLocale(segments[1])) segments.splice(1, 1);
  const path = segments.join("/");
  return path || "/";
}

export function localeAwareHref(locale: AppLocale, href: string): string {
  if (
    !href.startsWith("/") ||
    href.startsWith("//") ||
    href === "/admin" ||
    href.startsWith("/admin/") ||
    href === "/api" ||
    href.startsWith("/api/")
  ) {
    return href;
  }
  return localePath(locale, href);
}

export function localeFromAcceptLanguage(header: string | null): AppLocale {
  if (!header) return DEFAULT_LOCALE;

  const preferred = header
    .split(",")
    .map((entry) => {
      const [tag, qValue] = entry.trim().split(";q=");
      return {
        locale: tag?.toLowerCase().split("-")[0],
        quality: qValue ? Number(qValue) : 1,
      };
    })
    .filter(
      (entry): entry is { locale: AppLocale; quality: number } =>
        isAppLocale(entry.locale) && Number.isFinite(entry.quality),
    )
    .sort((a, b) => b.quality - a.quality)[0];

  return preferred?.locale ?? DEFAULT_LOCALE;
}
