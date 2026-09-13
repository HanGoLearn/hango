import type { AppLocale } from "@/i18n/config";

export type ContentInterfaceLanguage = "EN" | "ES";

interface TranslationRow {
  locale: ContentInterfaceLanguage;
}

export function contentLanguageForLocale(
  locale: AppLocale,
): ContentInterfaceLanguage {
  return locale === "es" ? "ES" : "EN";
}

/**
 * Picks the requested authored translation, then an explicit English row.
 * When neither exists, callers retain the canonical English fields already
 * stored on the base content record.
 */
export function selectContentTranslation<T extends TranslationRow>(
  translations: readonly T[],
  locale: AppLocale,
): T | undefined {
  const requested = contentLanguageForLocale(locale);
  return (
    translations.find((translation) => translation.locale === requested) ??
    (requested === "EN"
      ? undefined
      : translations.find((translation) => translation.locale === "EN"))
  );
}

/**
 * Applies only explicitly listed display fields and removes the translation
 * relation from the returned learner-facing record. Null translation values
 * fall back to the base English field so partially migrated optional copy
 * never disappears from the interface.
 */
export function localizeContentRecord<
  TRecord extends { translations: readonly TranslationRow[] },
>(
  record: TRecord,
  locale: AppLocale,
  fields: readonly string[],
): Omit<TRecord, "translations"> {
  const { translations, ...base } = record;
  const localized = { ...base } as Record<string, unknown>;
  const translation = selectContentTranslation(translations, locale);

  if (translation) {
    const values = translation as unknown as Record<string, unknown>;
    for (const field of fields) {
      const value = values[field];
      if (value !== null && value !== undefined) localized[field] = value;
    }
  }

  return localized as Omit<TRecord, "translations">;
}
