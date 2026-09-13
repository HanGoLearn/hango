"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InformationBanner } from "@/components/ui/banner";
import {
  SectionTitle,
  Body,
  ChineseText,
  Caption,
} from "@/components/ui/typography";
import { AudioPlayButton } from "@/components/lesson/audio-play-button";
import { cn } from "@/lib/cn";
import {
  applyPlacementCreditAction,
  getPlacementListeningAudioAction,
  recordPlacementTimeoutAction,
  submitPlacementAnswerAction,
  submitPlacementQuestionBlockAction,
} from "@/lib/actions/placement-exam";
import type {
  PlacementQuestionView,
  PlacementResult,
} from "@/lib/placement-exam-data";
import {
  PlacementSpeakingExam,
  type PlacementSpeakingOutcome,
} from "@/components/placement/placement-speaking-exam";
import { placementSpeakingStartLevel } from "@/lib/placement-speaking";
import { tierNameForLevel } from "@/lib/points-system";
import type { AppLocale } from "@/i18n/config";
import type { OnboardingMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

/**
 * Levels 7, 8, and 9 are all diagnostic only - never real placement/points
 * (points_system.md's Lab-evidence-only rule for that range). Fixed
 * 2026-08-24: this used to be checked with `=== 7`, so a written skill that
 * climbed all the way to level 8 or 9 (PILOT_MAX_HSK_LEVEL allows it) never
 * triggered the caption below explaining why - `>=` catches the whole band.
 */
const DIAGNOSTIC_ONLY_LEVEL = 7;

/**
 * Every question is timed now (2026-08-27 request - a real exam doesn't
 * leave HSK3+ open-ended). Difficulty tiers, not raw hskLevel, drive the
 * budget - HSK1-2 keeps the original, live-tested 10s baseline for a solo
 * Vocabulary/Grammar recall question; each tier above that gets more time
 * as content gets genuinely harder to parse, not just "harder so more
 * time" arbitrarily - roughly +5s/tier, doubling by HSK7-9.
 */
type TimeTier = 1 | 2 | 3 | 4;
function timeTierForLevel(hskLevel: number): TimeTier {
  if (hskLevel <= 2) return 1;
  if (hskLevel <= 4) return 2;
  if (hskLevel <= 6) return 3;
  return 4;
}

/** Solo Vocabulary/Grammar multiple-choice recall - the original HSK1-2 10s baseline, scaled up per tier. */
const MC_SECONDS_BY_TIER: Record<TimeTier, number> = {
  1: 10,
  2: 15,
  3: 20,
  4: 25,
};

/** SENTENCE_ORDERING (Grammar only) needs real time to think through word order, not just recall - +10s over that tier's MC baseline. */
const ORDERING_SECONDS_BY_TIER: Record<TimeTier, number> = {
  1: 20,
  2: 25,
  3: 30,
  4: 35,
};

/**
 * A Reading block (PlacementQuestionView.questionGroup - all of one
 * passage's remaining questions answered together, 2026-08-16 live-testing
 * fix so the same text doesn't re-appear later mid-way through) gets a
 * budget for the whole passage, not per question - "read once, answer
 * everything about it, then move on".
 */
const READING_GROUP_SECONDS_BY_TIER: Record<TimeTier, number> = {
  1: 120,
  2: 150,
  3: 180,
  4: 210,
};

/**
 * Same shape as Reading's group budget, slightly less generous at every
 * tier - Listening audio can now only be heard once (AudioPlayButton's
 * maxPlays, 2026-08-27), so there's no "go back and re-read" cost the way
 * Reading has, just recalling what was already heard.
 */
const LISTENING_GROUP_SECONDS_BY_TIER: Record<TimeTier, number> = {
  1: 100,
  2: 130,
  3: 160,
  4: 190,
};

/**
 * How many seconds a given question gets, shared by the initial-state
 * calculation (the very first question, before any loadQuestion call) and
 * loadQuestion (every question after that) so the two never drift apart.
 * Checked by passage/listening presence, not by questionGroup - a lone
 * remaining question in a passage/script (every sibling already attempted)
 * still needs the full read/listen budget, not the short recall-question
 * one.
 */
function secondsForQuestion(question: PlacementQuestionView): number {
  const tier = timeTierForLevel(question.hskLevel);
  if (question.listening) return LISTENING_GROUP_SECONDS_BY_TIER[tier];
  if (question.passage) return READING_GROUP_SECONDS_BY_TIER[tier];
  // Vocabulary/Grammar batch (2026-08-19 "agrupar preguntas por pantalla")
  // - several quick recall questions on one screen, so the solo-question
  // budget scales by how many are actually in it.
  const groupSize = question.questionGroup?.length ?? 1;
  if (groupSize > 1) return MC_SECONDS_BY_TIER[tier] * groupSize;
  return question.type === "SENTENCE_ORDERING"
    ? ORDERING_SECONDS_BY_TIER[tier]
    : MC_SECONDS_BY_TIER[tier];
}

function QuestionCountdown({
  questionId,
  secondsLeft,
}: {
  questionId: string;
  secondsLeft: number;
}) {
  void questionId;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return (
    <Caption
      className={cn(
        "font-mono",
        secondsLeft <= 3 ? "text-error-500" : "text-text-muted",
      )}
      role="timer"
      aria-live="polite"
    >
      {minutes}:{seconds.toString().padStart(2, "0")}
    </Caption>
  );
}

function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [elapsedMs, setElapsedMs] = useState(() => Date.now() - startedAt);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <Caption className="font-mono text-text-muted" aria-live="off">
      {minutes}:{seconds.toString().padStart(2, "0")}
    </Caption>
  );
}

/**
 * Adaptive placement exam, HSK1-9 (project/TASKS.md, "Adaptive placement
 * exam"; project/placement-exam-questions.md is the content source of
 * truth). Redesigned after live testing (2026-08-16 user feedback): a real
 * exam never reveals per-question correctness or its own internal
 * skill/level/category targeting mid-exam - both would let the test-taker
 * learn the adaptive algorithm instead of just answering honestly. Answers
 * submit silently and advance immediately; only the final result screen
 * shows anything. Supports both MULTIPLE_CHOICE and SENTENCE_ORDERING
 * questions (added same day, user request: "ordering questions that use
 * grammar and vocabulary together"). Speaking starts only when all four
 * recognition skills reach HSK3 and climbs independently from their lowest
 * confirmed band. HSK7-9 is diagnostic only, never real placement/points.
 */
export function PlacementExamHome({
  sessionId,
  initialQuestion,
  locale,
  messages,
  footer,
}: {
  sessionId: string;
  initialQuestion: PlacementQuestionView | null;
  locale: AppLocale;
  messages: OnboardingMessages["placementExam"];
  /** Rendered at the bottom of the result screen - lets a caller (e.g. the
   * onboarding placement-offer step) add its own "Continue" action without
   * this component needing to know anything about onboarding. */
  footer?: ReactNode;
}) {
  const [startedAt] = useState(() => Date.now());
  const [question, setQuestion] = useState<PlacementQuestionView | null>(
    initialQuestion,
  );
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [pool, setPool] = useState<string[]>(initialQuestion?.tokens ?? []);
  const [built, setBuilt] = useState<string[]>([]);
  /** Reading/Listening block only - one selection per grouped sub-question, keyed by questionId. */
  const [groupSelections, setGroupSelections] = useState<
    Record<string, string>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [speakingOutcome, setSpeakingOutcome] =
    useState<PlacementSpeakingOutcome | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    initialQuestion
      ? secondsForQuestion(initialQuestion)
      : MC_SECONDS_BY_TIER[1],
  );
  const creditAppliedRef = useRef(false);

  // Applies General Level point credit the moment the result screen is
  // reached (2026-08-24, "How placement results become real Learning
  // Journey credit" - project/TASKS.md) - fire-and-forget, doesn't block
  // the learner from seeing their result. Guarded to run once per mount
  // even though result/finishedAt don't change again afterward.
  useEffect(() => {
    if (!result || !finishedAt || creditAppliedRef.current) return;
    creditAppliedRef.current = true;
    void applyPlacementCreditAction(
      sessionId,
      speakingOutcome?.creditedLevel ?? null,
      speakingOutcome?.attempts.map((attempt) => ({
        level: attempt.level,
        score: attempt.evaluation.score,
      })) ?? [],
    );
  }, [result, finishedAt, speakingOutcome, sessionId]);

  function loadQuestion(next: PlacementQuestionView | null) {
    setQuestion(next);
    setSelectedOptionId(null);
    setPool(next?.tokens ?? []);
    setBuilt([]);
    setGroupSelections({});
    if (next) setSecondsLeft(secondsForQuestion(next));
  }

  function currentAnswer() {
    if (!question) return null;
    if (question.type === "SENTENCE_ORDERING") {
      return built.length === question.tokens.length
        ? ({ type: "SENTENCE_ORDERING", order: built } as const)
        : null;
    }
    return selectedOptionId
      ? ({ type: "MULTIPLE_CHOICE", optionId: selectedOptionId } as const)
      : null;
  }

  /** Shared tail for every action that can advance the exam (single answer, single timeout, or a whole Reading/Listening block) - same AdvanceResult shape from all three. */
  function applyAdvanceResult(
    response: Awaited<ReturnType<typeof submitPlacementAnswerAction>>,
  ) {
    if (!response.ok) {
      setSubmitting(false);
      setError(response.error);
      return;
    }
    setAnsweredCount((count) => count + 1);
    setSubmitting(false);
    if (response.value.result.status === "COMPLETED") {
      const completedResult = response.value.result;
      setResult(completedResult);
      const speakingStart = placementSpeakingStartLevel([
        completedResult.vocabularyHskLevel,
        completedResult.grammarHskLevel,
        completedResult.readingHskLevel,
        completedResult.listeningHskLevel,
      ]);
      if (speakingStart == null) setFinishedAt(Date.now());
      return;
    }
    loadQuestion(response.value.nextQuestion);
  }

  async function handleSubmit() {
    if (!question || submitting) return;
    const answer = currentAnswer();
    if (!answer) return;

    setSubmitting(true);
    setError(null);
    applyAdvanceResult(
      await submitPlacementAnswerAction(sessionId, question.id, answer),
    );
  }

  async function handleTimeout() {
    if (!question || submitting) return;
    // Already has a valid, un-submitted answer when time ran out - honor it
    // rather than punishing someone who answered right as the clock hit 0.
    if (currentAnswer()) {
      await handleSubmit();
      return;
    }
    setSubmitting(true);
    setError(null);
    applyAdvanceResult(
      await recordPlacementTimeoutAction(sessionId, question.id),
    );
  }

  function isGroupComplete() {
    return Boolean(
      question?.questionGroup?.every((q) => groupSelections[q.id]),
    );
  }

  async function handleGroupSubmit() {
    if (!question?.questionGroup || submitting || !isGroupComplete()) return;
    setSubmitting(true);
    setError(null);
    const answers = question.questionGroup.map((q) => ({
      questionId: q.id,
      optionId: groupSelections[q.id] ?? null,
    }));
    applyAdvanceResult(
      await submitPlacementQuestionBlockAction(sessionId, answers),
    );
  }

  async function handleGroupTimeout() {
    if (!question?.questionGroup || submitting) return;
    // Same "honor what's already answered" rule as the single-question
    // timeout - questions left blank in the group are recorded as misses,
    // not the whole block.
    setSubmitting(true);
    setError(null);
    const answers = question.questionGroup.map((q) => ({
      questionId: q.id,
      optionId: groupSelections[q.id] ?? null,
    }));
    applyAdvanceResult(
      await submitPlacementQuestionBlockAction(sessionId, answers),
    );
  }

  const isGrouped = Boolean(
    question?.questionGroup && question.questionGroup.length > 1,
  );
  // Every question is timed now (2026-08-27) - kept as a named boolean
  // (rather than inlining `Boolean(question)`) since it's still the right
  // guard for the countdown UI and the timeout effect below.
  const isTimed = Boolean(question);

  useEffect(() => {
    if (!isTimed || !question || submitting || result) return;
    const timeout = window.setTimeout(() => {
      if (secondsLeft <= 1) {
        void (isGrouped ? handleGroupTimeout() : handleTimeout());
      } else {
        setSecondsLeft((s) => s - 1);
      }
    }, 1000);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimed, isGrouped, question?.id, secondsLeft, submitting, result]);

  const speakingStartLevel = result
    ? placementSpeakingStartLevel([
        result.vocabularyHskLevel,
        result.grammarHskLevel,
        result.readingHskLevel,
        result.listeningHskLevel,
      ])
    : null;

  if (result && speakingStartLevel && !speakingOutcome) {
    return (
      <PlacementSpeakingExam
        startingLevel={speakingStartLevel}
        messages={messages.speaking}
        levelMessages={messages.levels}
        onFinished={(outcome) => {
          setSpeakingOutcome(outcome);
          setFinishedAt(Date.now());
        }}
      />
    );
  }

  if (result && finishedAt) {
    return (
      <PlacementResultScreen
        result={result}
        speakingOutcome={speakingOutcome}
        answeredCount={answeredCount}
        elapsedMs={finishedAt - startedAt}
        messages={messages}
        footer={footer}
      />
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col gap-4">
        <SectionTitle>{messages.title}</SectionTitle>
        <Body>{messages.unavailable}</Body>
      </div>
    );
  }

  const canSubmit =
    question.type === "SENTENCE_ORDERING"
      ? built.length === question.tokens.length
      : Boolean(selectedOptionId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <SectionTitle>{messages.title}</SectionTitle>
        <div className="flex items-center gap-3">
          {isTimed && (
            <QuestionCountdown
              questionId={question.id}
              secondsLeft={secondsLeft}
            />
          )}
          <ElapsedTimer startedAt={startedAt} />
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        {question.passage && (
          <div className="rounded-card border-l-4 border-accent-500 bg-surface p-4">
            <ChineseText className="text-body">{question.passage}</ChineseText>
          </div>
        )}

        {question.listening && (
          <div className="flex items-center gap-3 rounded-card bg-surface p-4">
            <AudioPlayButton
              key={question.listening.id}
              size="md"
              label={messages.listeningLabel}
              maxPlays={1}
              fetchUrl={async () => {
                const response = await getPlacementListeningAudioAction(
                  question.id,
                );
                return response.ok
                  ? { ok: true, url: response.value.url }
                  : { ok: false };
              }}
            />
            <Caption className="text-text-muted">
              {messages.listeningInstruction}
            </Caption>
          </div>
        )}

        {isGrouped && question.questionGroup ? (
          <>
            <Caption className="text-text-muted">
              {question.listening
                ? messages.groupedListening
                : question.passage
                  ? messages.groupedPassage
                  : messages.groupedDefault}
            </Caption>
            <div className="flex flex-col gap-5">
              {question.questionGroup.map((groupQuestion, index) => (
                <div key={groupQuestion.id} className="flex flex-col gap-2">
                  <Body className="font-semibold">
                    {index + 1}. {groupQuestion.prompt}
                  </Body>
                  <div className="flex flex-col gap-2">
                    {groupQuestion.options.map((option) => {
                      const isSelected =
                        groupSelections[groupQuestion.id] === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          disabled={submitting}
                          onClick={() =>
                            setGroupSelections((prev) => ({
                              ...prev,
                              [groupQuestion.id]: option.id,
                            }))
                          }
                          className={cn(
                            "rounded-control border-2 border-border px-4 py-3 text-left font-interface text-body transition-colors duration-fast ease-standard disabled:opacity-70",
                            isSelected &&
                              "border-primary-500 bg-primary-500/15",
                          )}
                        >
                          {option.content}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <Body className="font-semibold">{question.prompt}</Body>

            {question.type === "MULTIPLE_CHOICE" ? (
              <div className="flex flex-col gap-2">
                {question.options.map((option) => {
                  const isSelected = option.id === selectedOptionId;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={submitting}
                      onClick={() => setSelectedOptionId(option.id)}
                      className={cn(
                        "rounded-control border-2 border-border px-4 py-3 text-left font-interface text-body transition-colors duration-fast ease-standard disabled:opacity-70",
                        isSelected && "border-primary-500 bg-primary-500/15",
                      )}
                    >
                      {option.content}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex min-h-11 flex-wrap gap-2 rounded-control border-2 border-dashed border-border p-2">
                  {built.length === 0 && (
                    <Caption>{messages.orderingInstruction}</Caption>
                  )}
                  {built.map((token, index) => (
                    <button
                      key={`${token}-${index}`}
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setBuilt(built.filter((_, i) => i !== index));
                        setPool([...pool, token]);
                      }}
                      className="rounded-full border-2 border-primary-500 bg-primary-500/15 px-3 py-1 font-chinese text-body"
                    >
                      {token}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {pool.map((token, index) => (
                    <button
                      key={`${token}-${index}`}
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setPool(pool.filter((_, i) => i !== index));
                        setBuilt([...built, token]);
                      }}
                      className="rounded-full border-2 border-border px-3 py-1 font-chinese text-body"
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <InformationBanner variant="error">{error}</InformationBanner>
        )}

        <Button
          type="button"
          disabled={
            isGrouped
              ? !isGroupComplete() || submitting
              : !canSubmit || submitting
          }
          onClick={() =>
            void (isGrouped ? handleGroupSubmit() : handleSubmit())
          }
          className="self-start"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            messages.next
          )}
        </Button>
      </Card>
    </div>
  );
}

function PlacementResultScreen({
  result,
  speakingOutcome,
  answeredCount,
  elapsedMs,
  messages,
  footer,
}: {
  result: PlacementResult;
  speakingOutcome: PlacementSpeakingOutcome | null;
  answeredCount: number;
  elapsedMs: number;
  messages: OnboardingMessages["placementExam"];
  footer?: ReactNode;
}) {
  const totalMinutes = Math.max(1, Math.round(elapsedMs / 60000));
  const rows: { label: string; level: number | null }[] = [
    { label: messages.skills.vocabulary, level: result.vocabularyHskLevel },
    { label: messages.skills.grammar, level: result.grammarHskLevel },
    { label: messages.skills.reading, level: result.readingHskLevel },
    { label: messages.skills.listening, level: result.listeningHskLevel },
    {
      label: messages.skills.speaking,
      level: speakingOutcome?.creditedLevel ?? null,
    },
  ];
  function localizedTier(level: number) {
    const tier = tierNameForLevel(level);
    return messages.levels[tier as keyof typeof messages.levels] ?? tier;
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>{messages.resultTitle}</SectionTitle>
      <Body className="text-text-secondary">
        {formatMessage(messages.resultSummary, {
          questions: answeredCount,
          minutes: totalMinutes,
        })}
      </Body>
      <Card className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <Body>{row.label}</Body>
            <span className="rounded-full bg-accent-300/20 px-3 py-1 font-interface text-supporting font-semibold text-accent-300">
              {row.level == null
                ? messages.notReached
                : localizedTier(row.level)}
            </span>
          </div>
        ))}
      </Card>
      {rows.some(
        (row) => row.level != null && row.level >= DIAGNOSTIC_ONLY_LEVEL,
      ) && (
        <Caption className="text-text-muted">{messages.diagnosticTop}</Caption>
      )}
      {speakingOutcome?.diagnosticLevel != null && (
        <Caption className="text-text-muted">
          {formatMessage(messages.diagnosticSpeaking, {
            level: localizedTier(speakingOutcome.diagnosticLevel),
            maximum: localizedTier(6),
          })}
        </Caption>
      )}
      <Caption className="text-text-muted">{messages.creditNote}</Caption>
      {footer}
    </div>
  );
}
