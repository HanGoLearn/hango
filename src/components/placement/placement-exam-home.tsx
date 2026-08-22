"use client";

import { useEffect, useState } from "react";
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

const HSK_LABEL: Record<number, string> = {
  0: "Pre-HSK",
  1: "HSK 1",
  2: "HSK 2",
  3: "HSK 3",
  4: "HSK 4",
  5: "HSK 5",
  6: "HSK 6",
  7: "HSK 7-9",
};

/** HSK7-9 is diagnostic only - never real placement/points (points_system.md's Lab-evidence-only rule). */
const DIAGNOSTIC_ONLY_LEVEL = 7;

/**
 * 10s-per-question limit for HSK1-2 Vocabulary/Grammar only (2026-08-16
 * user request: keep the exam from running long, since most test-takers
 * clear this tier fast - combined with the HSK1-2 content trim the same
 * day). Those two skills are quick single-pattern recall, so 10s is
 * plenty. Reading and Listening are deliberately excluded even at HSK1-2
 * (2026-08-16 live-testing fix): a Reading question shows a real
 * multi-sentence passage to actually read, and Listening needs the audio
 * clip to finish playing first - 10s isn't a "fast recall" limit for
 * either, it's just not enough time regardless of level. HSK3+ questions
 * are untimed - they're meant to take real thought.
 */
const TIMED_MAX_HSK_LEVEL = 2;
const TIMED_SKILLS = new Set(["VOCABULARY", "GRAMMAR"]);
const QUESTION_TIME_LIMIT_SECONDS = 10;

/**
 * A Reading/Listening block (PlacementQuestionView.questionGroup - all of
 * one passage/script's remaining questions answered together, added
 * 2026-08-16 live-testing fix so the same text/audio doesn't re-appear
 * later mid-way through) gets its own generous 2-minute budget for the
 * whole passage/script at HSK1-2, instead of either no timer or the
 * single-question 10s limit - "read/listen once, answer everything about
 * it, then move on" per the user's own description of the desired flow.
 */
const GROUP_TIME_LIMIT_SECONDS = 120;

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
}: {
  sessionId: string;
  initialQuestion: PlacementQuestionView | null;
}) {
  const [startedAt] = useState(() => Date.now());
  const [question, setQuestion] = useState<PlacementQuestionView | null>(initialQuestion);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [pool, setPool] = useState<string[]>(initialQuestion?.tokens ?? []);
  const [built, setBuilt] = useState<string[]>([]);
  /** Reading/Listening block only - one selection per grouped sub-question, keyed by questionId. */
  const [groupSelections, setGroupSelections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [speakingOutcome, setSpeakingOutcome] =
    useState<PlacementSpeakingOutcome | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_LIMIT_SECONDS);

  function loadQuestion(next: PlacementQuestionView | null) {
    setQuestion(next);
    setSelectedOptionId(null);
    setPool(next?.tokens ?? []);
    setBuilt([]);
    setGroupSelections({});
    const groupSize = next?.questionGroup?.length ?? 1;
    const nextIsGrouped = groupSize > 1;
    // Vocabulary/Grammar batches (2026-08-19 "agrupar preguntas por
    // pantalla") are several quick recall questions, not one passage/audio
    // to read or listen to first - GROUP_TIME_LIMIT_SECONDS's generous 2
    // minutes was tuned for the latter (see its own doc comment), so a
    // gated batch instead gets the single-question budget scaled by how
    // many questions are actually in it.
    const isGatedBatch = nextIsGrouped && !next?.passage && !next?.listening;
    setSecondsLeft(
      isGatedBatch
        ? QUESTION_TIME_LIMIT_SECONDS * groupSize
        : nextIsGrouped
          ? GROUP_TIME_LIMIT_SECONDS
          : QUESTION_TIME_LIMIT_SECONDS,
    );
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
    applyAdvanceResult(await submitPlacementAnswerAction(sessionId, question.id, answer));
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
    applyAdvanceResult(await recordPlacementTimeoutAction(sessionId, question.id));
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
    applyAdvanceResult(await submitPlacementQuestionBlockAction(sessionId, answers));
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
    applyAdvanceResult(await submitPlacementQuestionBlockAction(sessionId, answers));
  }

  const isGrouped = Boolean(question?.questionGroup && question.questionGroup.length > 1);
  const isTimed = Boolean(
    question &&
      question.hskLevel <= TIMED_MAX_HSK_LEVEL &&
      (isGrouped || TIMED_SKILLS.has(question.skill)),
  );

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
      />
    );
  }

  if (!question) {
    return (
      <div className="flex flex-col gap-4">
        <SectionTitle>Placement Exam</SectionTitle>
        <Body>No questions are available right now.</Body>
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
        <SectionTitle>Placement Exam</SectionTitle>
        <div className="flex items-center gap-3">
          {isTimed && (
            <QuestionCountdown questionId={question.id} secondsLeft={secondsLeft} />
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
              label="listening passage"
              fetchUrl={async () => {
                const response = await getPlacementListeningAudioAction(question.id);
                return response.ok
                  ? { ok: true, url: response.value.url }
                  : { ok: false };
              }}
            />
            <Caption className="text-text-muted">
              Listen, then answer below - the text isn&apos;t shown.
            </Caption>
          </div>
        )}

        {isGrouped && question.questionGroup ? (
          <>
            <Caption className="text-text-muted">
              {question.listening
                ? "Answer every question about this audio, then submit them all together."
                : question.passage
                  ? "Answer every question about this passage, then submit them all together."
                  : "Answer every question below, then submit them all together."}
            </Caption>
            <div className="flex flex-col gap-5">
              {question.questionGroup.map((groupQuestion, index) => (
                <div key={groupQuestion.id} className="flex flex-col gap-2">
                  <Body className="font-semibold">
                    {index + 1}. {groupQuestion.prompt}
                  </Body>
                  <div className="flex flex-col gap-2">
                    {groupQuestion.options.map((option) => {
                      const isSelected = groupSelections[groupQuestion.id] === option.id;
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
                            isSelected && "border-primary-500 bg-primary-500/15",
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
                    <Caption>Tap the words below in the right order.</Caption>
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

        {error && <InformationBanner variant="error">{error}</InformationBanner>}

        <Button
          type="button"
          disabled={isGrouped ? !isGroupComplete() || submitting : !canSubmit || submitting}
          onClick={() => void (isGrouped ? handleGroupSubmit() : handleSubmit())}
          className="self-start"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : "Next"}
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
}: {
  result: PlacementResult;
  speakingOutcome: PlacementSpeakingOutcome | null;
  answeredCount: number;
  elapsedMs: number;
}) {
  const totalMinutes = Math.max(1, Math.round(elapsedMs / 60000));
  const rows: { label: string; level: number | null }[] = [
    { label: "Vocabulary", level: result.vocabularyHskLevel },
    { label: "Grammar", level: result.grammarHskLevel },
    { label: "Reading", level: result.readingHskLevel },
    { label: "Listening", level: result.listeningHskLevel },
    { label: "Speaking", level: speakingOutcome?.creditedLevel ?? null },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Your placement result</SectionTitle>
      <Body className="text-text-secondary">
        {answeredCount} questions in about {totalMinutes} minute
        {totalMinutes === 1 ? "" : "s"}. Each skill gets its own level -
        recognizing and producing Chinese are different abilities, so this is
        never a single number.
      </Body>
      <Card className="flex flex-col gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <Body>{row.label}</Body>
            <span className="rounded-full bg-accent-300/20 px-3 py-1 font-interface text-supporting font-semibold text-accent-300">
              {row.level == null ? "Not reached" : (HSK_LABEL[row.level] ?? `HSK ${row.level}`)}
            </span>
          </div>
        ))}
      </Card>
      {rows.some((row) => row.level === DIAGNOSTIC_ONLY_LEVEL) && (
        <Caption className="text-text-muted">
          HSK 7-9 is shown for your reference only - it doesn&apos;t grant
          real placement or points, since that tier is only ever earned
          through sustained Lab evidence.
        </Caption>
      )}
      {speakingOutcome?.diagnosticLevel === 7 && (
        <Caption className="text-text-muted">
          Your HSK 7-9 Speaking attempt is diagnostic only. Your credited
          Speaking placement remains HSK 6 or below.
        </Caption>
      )}
      <Caption className="text-text-muted">
        Lesson-skipping and point credit from this result aren&apos;t wired
        up yet - see project/TASKS.md for the phased plan.
      </Caption>
    </div>
  );
}
