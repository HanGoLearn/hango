import { db } from "@/lib/db";
import type { AppLocale } from "@/i18n/config";
import { queryCurriculumTranslationCoverage } from "@/lib/content/translation-coverage-query";

export async function getCurriculumTranslationCoverage(locale: AppLocale) {
  return queryCurriculumTranslationCoverage(db, locale);
}
