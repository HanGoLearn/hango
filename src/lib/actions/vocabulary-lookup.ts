"use server";

import { auth } from "@/lib/auth";
import {
  lookupVocabularyWord,
  VocabularyLookupInputError,
  VocabularyLookupRateLimitError,
} from "@/lib/vocabulary-lookup-data";
import { DailyUsageCapExceededError } from "@/lib/ai-usage";
import type { VocabularyLookupResult } from "@/lib/vocabulary-lookup-prompt";
import { isAppLocale } from "@/i18n/config";

export type LookupVocabularyWordResult =
  | { ok: true; result: VocabularyLookupResult }
  | { ok: false; error: string };

/**
 * Never throws for validation/rate-limit/AI failure - same ok/error
 * pattern as every other Speaking/AI Teacher action in this app.
 */
export async function lookupVocabularyWordAction(
  input: string,
  locale: string,
): Promise<LookupVocabularyWordResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  if (!isAppLocale(locale)) throw new Error("Invalid locale");

  try {
    const result = await lookupVocabularyWord(session.user.id, input, locale);
    if (!result) {
      return {
        ok: false,
        error: "Han couldn't find that word. Try rephrasing it or check the spelling.",
      };
    }
    return { ok: true, result };
  } catch (error) {
    if (error instanceof VocabularyLookupInputError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof VocabularyLookupRateLimitError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof DailyUsageCapExceededError) {
      return { ok: false, error: error.message };
    }
    return {
      ok: false,
      error: "Something went wrong looking that up. Please try again.",
    };
  }
}
