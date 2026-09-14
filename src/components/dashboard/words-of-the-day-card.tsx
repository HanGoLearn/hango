"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { HanAvatar } from "@/components/ui/han-mascot";
import { Caption, Body } from "@/components/ui/typography";
import { InformationBanner } from "@/components/ui/banner";
import { Modal, ModalContent, ModalTitle } from "@/components/ui/modal";
import { lookupVocabularyWordAction } from "@/lib/actions/vocabulary-lookup";
import { VocabularyLookupCard } from "@/components/han/vocabulary-lookup-card";
import type { VocabularyLookupResult } from "@/lib/vocabulary-lookup-prompt";
import type { WordOfTheDay } from "@/lib/words-of-the-day";
import type {
  DashboardMessages,
  HanVocabularyMessages,
} from "@/i18n/messages/types";
import type { AppLocale } from "@/i18n/config";
import { formatMessage } from "@/i18n/format";
import { localizeVocabularyError } from "@/i18n/vocabulary";

/**
 * Dashboard teaser (2026-09-01) - same 3 words for every learner at this
 * level today (words-of-the-day.ts), shown for $0 since chineseForm/pinyin/
 * meaning already sit on VocabularyItem. Tapping a word is the only thing
 * that can cost anything, and it reuses lookupVocabularyWordAction and
 * VocabularyLookupCard exactly as Han Vocabulary already does - no new
 * AI/prompt code here, just a compact entry point into that same pipeline.
 *
 * Opens in the shared Modal (ui/modal.tsx, Radix Dialog) rather than
 * expanding inline (2026-09-01, user's call) - the full card is tall
 * (hero + several sections), and inline expansion pushed the rest of the
 * sidebar down. The Modal sizes to its content instead of taking over the
 * screen, and the swap gets focus trapping/ESC/overlay-click dismissal for
 * free from Radix instead of only a hand-rolled close button.
 */
export function WordsOfTheDayCard({
  locale,
  words,
  messages,
  vocabularyMessages,
}: {
  locale: AppLocale;
  words: WordOfTheDay[];
  messages: DashboardMessages["words"];
  vocabularyMessages: HanVocabularyMessages;
}) {
  const [openWord, setOpenWord] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VocabularyLookupResult | null>(null);

  if (words.length === 0) return null;

  async function handleTap(chineseForm: string) {
    setOpenWord(chineseForm);
    setLoading(true);
    setError(null);
    setResult(null);
    const response = await lookupVocabularyWordAction(chineseForm, locale);
    setLoading(false);
    if (!response.ok) {
      setError(
        localizeVocabularyError(response.error, vocabularyMessages.errors),
      );
      return;
    }
    setResult(response.result);
  }

  function handleOpenChange(open: boolean) {
    if (open) return;
    setOpenWord(null);
    setLoading(false);
    setError(null);
    setResult(null);
  }

  return (
    <div
      data-activity-surface="HAN_VOCABULARY"
      className="flex flex-col gap-3 rounded-panel bg-elevated p-5"
    >
      <div className="flex items-center gap-2">
        <HanAvatar pose="curious" size={28} />
        <Caption className="font-semibold uppercase tracking-wide text-text-muted">
          {messages.title}
        </Caption>
      </div>

      <div className="flex gap-2">
        {words.map((word) => (
          <button
            key={word.chineseForm}
            type="button"
            onClick={() => void handleTap(word.chineseForm)}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-control border border-border bg-surface px-2 py-3 text-center transition-colors duration-fast ease-standard hover:border-primary-500/40"
          >
            <span className="font-chinese text-card-title font-semibold text-text-primary">
              {word.chineseForm}
            </span>
            <span className="font-mono text-caption text-text-muted">
              {word.pinyin}
            </span>
          </button>
        ))}
      </div>

      <Modal open={openWord !== null} onOpenChange={handleOpenChange}>
        <ModalContent className="max-w-xl overflow-hidden p-0">
          <div className="max-h-[85vh] overflow-y-auto">
            {/* Visually hidden - VocabularyLookupCard's own hero already
                shows the word prominently; this only satisfies Radix's
                accessible-name requirement for the dialog. */}
            <ModalTitle className="sr-only">
              {openWord ?? messages.modalTitle}
            </ModalTitle>
            {loading && (
              <div className="flex items-center justify-center gap-2 p-10 text-text-secondary">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <Body>
                  {formatMessage(messages.loading, { word: openWord ?? "" })}
                </Body>
              </div>
            )}
            {error && (
              <div className="p-6">
                <InformationBanner variant="error">{error}</InformationBanner>
              </div>
            )}
            {result && (
              <VocabularyLookupCard
                result={result}
                messages={vocabularyMessages.card}
              />
            )}
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
