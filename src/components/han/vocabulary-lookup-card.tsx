import { Body, Caption } from "@/components/ui/typography";
import { cn } from "@/lib/cn";
import type { VocabularyLookupResult } from "@/lib/vocabulary-lookup-prompt";
import type { HanVocabularyMessages } from "@/i18n/messages/types";

const FREQUENCY_KEY = {
  "very common": "veryCommon",
  common: "common",
  "less common": "lessCommon",
} as const satisfies Record<
  VocabularyLookupResult["frequencyTier"],
  keyof HanVocabularyMessages["card"]["frequency"]
>;

/**
 * Renders a `VocabularyLookupResult` (vocabulary-lookup-prompt.ts) as the
 * card design validated in the live demo shared with the user before this
 * was built - real HanGo tokens (chip.tsx's wash convention), not the
 * demo's standalone palette. Sections whose data is null are simply not
 * rendered, never shown empty (mistakes/chineseGloss/curiosity are all
 * legitimately absent at lower levels - see the prompt's own rules).
 */
export function VocabularyLookupCard({
  result,
  messages,
}: {
  result: VocabularyLookupResult;
  messages: HanVocabularyMessages["card"];
}) {
  return (
    <div className="overflow-hidden rounded-panel border border-border bg-elevated shadow-elevated">
      <div className="relative overflow-hidden border-b border-border bg-linear-to-br from-primary-500/10 to-accent-500/10 px-6 py-7 text-center">
        <div className="text-4xl">{result.hero.emoji}</div>
        <div className="mt-1 font-chinese text-5xl font-bold text-text-primary">
          {result.hero.title}
        </div>
        <Body className="mt-1.5 text-text-secondary">
          {result.hero.subtitle}
        </Body>
        <span className="mt-2.5 inline-block rounded-full bg-accent-500/15 px-3 py-1 font-interface text-caption font-semibold text-accent-300">
          {messages.frequency[FREQUENCY_KEY[result.frequencyTier]]}
        </span>
      </div>

      <Section label={messages.explanation} tone="primary">
        <Body className="text-text-primary">{result.explanation}</Body>
      </Section>

      <Section label={messages.examples} tone="accent">
        <div className="flex flex-col gap-2.5">
          {result.examples.map((example, index) => (
            <div
              key={index}
              className="flex gap-2.5 border-t border-border pt-2.5 first:border-t-0 first:pt-0"
            >
              <span className="shrink-0 text-lg">{example.emoji}</span>
              <div className="flex flex-col gap-0.5">
                <div>
                  <span className="font-chinese text-body font-semibold text-text-primary">
                    {example.chinese}
                  </span>
                  <span className="ml-2 font-mono text-caption text-text-muted">
                    {example.pinyin}
                  </span>
                </div>
                <Caption className="text-text-secondary">
                  {example.translation}
                </Caption>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {result.related.length > 0 && (
        <Section label={messages.related} tone="secondary">
          <div className="flex flex-col gap-1.5">
            {result.related.map((item, index) => (
              <div
                key={index}
                className="flex flex-wrap items-baseline gap-1.5"
              >
                <span className="font-chinese text-body font-semibold text-text-primary">
                  {item.chinese}
                </span>
                <span className="font-mono text-caption text-text-muted">
                  ({item.pinyin})
                </span>
                <span className="text-supporting text-text-secondary">
                  = {item.meaning}
                </span>
                {item.register && (
                  <span className="rounded-full bg-secondary-500/15 px-2 py-0.5 font-interface text-caption font-semibold uppercase tracking-wide text-secondary-300">
                    {item.register}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {result.mistakes && (
        <Section label={messages.mistakes} tone="primary">
          <Body className="text-text-primary">{result.mistakes}</Body>
        </Section>
      )}

      {result.chineseGloss && (
        <Section label={messages.chineseGloss} tone="accent">
          <Body className="font-chinese text-text-primary">
            {result.chineseGloss}
          </Body>
        </Section>
      )}

      {result.curiosity && (
        <Section label={messages.curiosity} tone="info">
          <Body className="text-text-primary">{result.curiosity}</Body>
        </Section>
      )}
    </div>
  );
}

const LABEL_TONE_CLASSES: Record<string, string> = {
  primary: "bg-primary-500/15 text-primary-300",
  secondary: "bg-secondary-500/15 text-secondary-300",
  accent: "bg-accent-500/15 text-accent-300",
  info: "bg-info-500/15 text-info-500",
};

function Section({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "primary" | "secondary" | "accent" | "info";
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border px-6 py-5 last:border-b-0">
      <span
        className={cn(
          "mb-2.5 inline-block rounded-full px-2.5 py-0.5 font-interface text-caption font-bold uppercase tracking-wide",
          LABEL_TONE_CLASSES[tone],
        )}
      >
        {label}
      </span>
      {children}
    </div>
  );
}
