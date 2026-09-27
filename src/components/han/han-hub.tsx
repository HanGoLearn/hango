"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Lock, Loader2 } from "lucide-react";
import {
  PageTitle,
  SectionTitle,
  Body,
  Caption,
} from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InformationBanner } from "@/components/ui/banner";
import { HanAvatar } from "@/components/ui/han-mascot";
import { AiTeacherChat } from "@/components/ai-teacher/ai-teacher-chat";
import { HanVoiceConversation } from "@/components/ai-teacher/han-voice-conversation";
import { useAiTeacher } from "@/components/ai-teacher/ai-teacher-provider";
import { lookupVocabularyWordAction } from "@/lib/actions/vocabulary-lookup";
import { VocabularyLookupCard } from "@/components/han/vocabulary-lookup-card";
import type { VocabularyLookupResult } from "@/lib/vocabulary-lookup-prompt";
import type { HanVocabularyMessages } from "@/i18n/messages/types";
import { localePath, type AppLocale } from "@/i18n/config";
import { localizeVocabularyError } from "@/i18n/vocabulary";

type View = "hub" | "tutor" | "companion" | "vocabulary";

const TUTOR_BENEFITS = [
  "Explains grammar & vocabulary in your language",
  "Tells you why an answer was right or wrong",
  "Quick answers about your current lesson",
  "Available anytime, anywhere in the app",
];

const COMPANION_BENEFITS = [
  "Real conversation, 100% spoken, 100% in Chinese",
  "Talks like a friend — warmth, encouragement, real advice",
  "Remembers things about you, across conversations",
  "Notices your progress and brings it up on its own",
  "Open-ended conversation — just tap and start talking",
  "Corrects gently, by example — no grading, no red X's",
];

const CLASS_BENEFITS = [
  "Grammar taught in a fun, dynamic way",
  "Practice content generated fresh by AI",
];

function BenefitList({
  items,
  muted = false,
}: {
  items: string[];
  muted?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Check
            className={
              "mt-0.5 size-4 shrink-0 " +
              (muted ? "text-text-muted" : "text-secondary-500")
            }
            aria-hidden="true"
          />
          <Body className={muted ? "text-text-muted" : "text-text-primary"}>
            {item}
          </Body>
        </li>
      ))}
    </ul>
  );
}

/**
 * Han Companion, voice-only (2026-08-31, user's explicit call - "no quiero
 * que sea algo escrito ni que aparezca el chat de Han, todo 100% hablado").
 * Renders `HanVoiceConversation` directly (its voice-reactive `orb`
 * variant - one start/end control, no message list, captions, or text box)
 * instead of the
 * text+voice `AiTeacherChat` Han Tutor still uses. The barge-in/noise-floor
 * behavior the user asked about ("si le interrumpo se calla, salvo que sea
 * ruido") is not new work - it's the same realtime turn-detection
 * (`isConfidentLearnerBargeIn`, ambient noise floor tracking,
 * `han-realtime.ts`) already shipped for Speaking Lab's free-topic practice,
 * reused here as-is.
 *
 * Deliberately never scores (user decision, 2026-08-31): no SpeakingSession,
 * no points, achievements, typed scenario builder, or RolePlayContext. It is
 * an open-ended spoken conversation with Han, not another Speaking exercise.
 */
function HanCompanionView() {
  const {
    voice,
    explanationLanguage,
    context,
    setContext,
    appendRealtimeMessage,
    resetConversation,
  } = useAiTeacher();
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    // Defense-in-depth against a stale rolePlay left over from Speaking Lab
    // (see the module doc comment on the "Han" nav bug fix). `resetConversation(true)`
    // is what actually turns on personal-memory extraction (2026-08-31 fix) -
    // Han Tutor's own reset (openTeacher(), ai-teacher-provider.tsx) passes
    // no argument and defaults to `false`, so only Companion ever extracts.
    setContext({ rolePlay: undefined });
    void resetConversation(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActiveChange = useCallback(
    (active: boolean) => {
      if (!active) {
        // Companion must never inherit a role-play from another app area.
        setContext({ rolePlay: undefined });
      }
    },
    [setContext],
  );

  return (
    <div>
      <HanVoiceConversation
        disabled={false}
        voice={voice}
        explanationLanguage={explanationLanguage}
        mode="PRACTICE"
        context={context}
        open
        variant="orb"
        roleLabel="Han"
        appendMessage={appendRealtimeMessage}
        onActiveChange={handleActiveChange}
      />
    </div>
  );
}

/**
 * Han Vocabulary (2026-08-31) - a reference/lookup tool, not a chat and
 * not a practice activity: type a word (characters or pinyin - no Chinese
 * keyboard required), Han explains it at the learner's real, automatic
 * level (vocabulary-lookup-data.ts's `hskNumberForPoints`). No manual
 * level picker by explicit user decision (would mean a second full AI call
 * per press). Never touches points/achievements/coins - same "pure
 * reference, no scoring" spirit as Han Companion.
 */
function HanVocabularyView({
  locale,
  messages,
}: {
  locale: AppLocale;
  messages: HanVocabularyMessages;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VocabularyLookupResult | null>(null);

  async function handleLookup() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    const response = await lookupVocabularyWordAction(trimmed, locale);
    setLoading(false);
    if (!response.ok) {
      setError(localizeVocabularyError(response.error, messages.errors));
      setResult(null);
      return;
    }
    setResult(response.result);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleLookup();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-panel border border-border bg-surface p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={messages.lookup.placeholder}
            aria-label={messages.lookup.inputLabel}
            className="min-h-11 w-full"
            rows={1}
          />
        </div>
        <Button
          type="button"
          onClick={() => void handleLookup()}
          disabled={loading || !input.trim()}
          className="shrink-0 gap-1.5"
        >
          {loading && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          {loading ? messages.lookup.loading : messages.lookup.explain}
        </Button>
      </div>

      {error && <InformationBanner variant="error">{error}</InformationBanner>}

      {result && (
        <VocabularyLookupCard result={result} messages={messages.card} />
      )}

      {!result && !error && !loading && (
        <Caption className="text-text-muted">{messages.lookup.hint}</Caption>
      )}
    </div>
  );
}

const VIEW_TITLE: Record<Exclude<View, "hub">, string> = {
  tutor: "Han Tutor",
  companion: "Han Companion",
  vocabulary: "Han Vocabulary",
};

/**
 * "Han" as its own primary-nav section (2026-08-31) - the app's real
 * competitive differentiator, not a hidden tab inside the floating bubble.
 * Two-column layout (user's explicit request): Tutor/Companion/Class stack
 * on the left, Han Vocabulary stands on the right, not stacked below them.
 * Picking any of the 4 swaps the whole page into a full-page view ("like a
 * new tab"): Tutor reuses the same text+voice `AiTeacherChat` the floating
 * bubble uses elsewhere; Companion is its own voice-only view; Vocabulary
 * is its own lookup view (see above). The floating bubble hides itself on
 * this route (ai-teacher-bubble.tsx) since both would otherwise fight over
 * the same shared `open`/`mode`/`context` state. Han Class is an inert
 * teaser - explicitly out of scope for this build (user's own call,
 * 2026-08-31).
 */
export function HanHub({
  locale,
  messages,
  initialView,
}: {
  locale: AppLocale;
  messages: HanVocabularyMessages;
  /**
   * Set when this hub is rendered by one of Han's own routes
   * (`/han/tutor`, `/han/companion`, `/han/vocabulary`), added 2026-09-23 so
   * the nav group can land on a surface directly instead of dropping the
   * learner on the picker. Unset on `/han` itself, which still opens the
   * picker exactly as before.
   */
  initialView?: Exclude<View, "hub">;
}) {
  const router = useRouter();
  const { setMode, openTeacher } = useAiTeacher();
  const [view, setView] = useState<View>(initialView ?? "hub");

  // The Tutor card does this on click; a direct visit to /han/tutor has to
  // do the same, or the shared chat state stays on whatever mode was last
  // used. Runs only for the tutor route - the other two views own their
  // own state and need no priming.
  useEffect(() => {
    if (initialView !== "tutor") return;
    setMode("TUTOR");
    void openTeacher({ rolePlay: undefined });
    // setMode/openTeacher are stable (useCallback in the provider).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialView]);

  function openTutor() {
    setMode("TUTOR");
    void openTeacher({ rolePlay: undefined });
    setView("tutor");
  }

  function openCompanion() {
    setView("companion");
  }

  function openVocabulary() {
    setView("vocabulary");
  }

  if (view !== "hub") {
    return (
      <div
        data-activity-surface={
          view === "tutor"
            ? "HAN_TUTOR"
            : view === "companion"
              ? "HAN_COMPANION"
              : "HAN_VOCABULARY"
        }
        className="flex h-full flex-col gap-4"
      >
        <Button
          type="button"
          variant="tertiary"
          className="w-fit gap-1.5 px-0"
          onClick={() => {
            // On Han's own routes the picker lives at a different URL, so
            // going "back" is a navigation, not a state change - otherwise
            // the address bar would still read /han/tutor while showing
            // the picker, and the browser's own back button would disagree
            // with this one.
            if (initialView) router.push(localePath(locale, "/han"));
            else setView("hub");
          }}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {view === "vocabulary" ? messages.backToHan : "Back to Han"}
        </Button>
        <div className="flex items-center gap-2">
          <HanAvatar
            pose={
              view === "companion"
                ? "heart"
                : view === "vocabulary"
                  ? "curious"
                  : "curious"
            }
            size={32}
          />
          <SectionTitle>{VIEW_TITLE[view]}</SectionTitle>
        </div>
        {view === "companion" ? (
          <HanCompanionView />
        ) : view === "vocabulary" ? (
          <HanVocabularyView locale={locale} messages={messages} />
        ) : (
          <div className="min-h-[32rem] flex-1 rounded-panel border border-border bg-surface p-4">
            <AiTeacherChat rolePlayEnabled={false} spacious />
          </div>
        )}
      </div>
    );
  }

  return (
    <div data-activity-surface="GENERAL" className="flex flex-col gap-6">
      <PageTitle>Han</PageTitle>
      <Body className="max-w-prose text-text-secondary">
        Han isn&apos;t one thing - pick the kind of help you need right now.
      </Body>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            data-activity-surface="HAN_TUTOR"
            onClick={openTutor}
            className="text-left"
          >
            <Card
              interactive
              size="lg"
              className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6"
            >
              <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                <HanAvatar pose="curious" size={48} />
                <SectionTitle>Han Tutor</SectionTitle>
              </div>
              <BenefitList items={TUTOR_BENEFITS} />
            </Card>
          </button>

          <button
            type="button"
            data-activity-surface="HAN_COMPANION"
            onClick={openCompanion}
            className="text-left"
          >
            <Card
              interactive
              size="lg"
              className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6"
            >
              <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                <HanAvatar pose="heart" size={48} />
                <SectionTitle>Han Companion</SectionTitle>
              </div>
              <BenefitList items={COMPANION_BENEFITS} />
            </Card>
          </button>

          <Card
            size="lg"
            className="flex flex-col gap-3 bg-elevated sm:flex-row sm:items-start sm:gap-6"
          >
            <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
              <span className="flex size-12 items-center justify-center rounded-full bg-surface text-text-muted">
                <Lock className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-0.5">
                <SectionTitle className="text-text-muted">
                  Han Class
                </SectionTitle>
                <Caption className="font-semibold uppercase tracking-wide text-text-muted">
                  Coming soon
                </Caption>
              </div>
            </div>
            <BenefitList items={CLASS_BENEFITS} muted />
          </Card>
        </div>

        <button
          type="button"
          data-activity-surface="HAN_VOCABULARY"
          onClick={openVocabulary}
          className="text-left"
        >
          <Card
            interactive
            size="lg"
            className="flex flex-col gap-4 border-accent-500/30"
          >
            <div className="flex items-center gap-3">
              <HanAvatar pose="curious" size={48} />
              <SectionTitle>Han Vocabulary</SectionTitle>
            </div>
            <BenefitList items={[...messages.benefits]} />
          </Card>
        </button>
      </div>
    </div>
  );
}
