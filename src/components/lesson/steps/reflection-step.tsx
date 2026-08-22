"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  SectionTitle,
  Body,
  Caption,
  Display,
} from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { HanSpeechButton } from "@/components/ai-teacher/han-speech-button";
import { cn } from "@/lib/cn";
import {
  getLessonReflectionReportAction,
  getLessonScoreBreakdownAction,
} from "@/lib/actions/reflection";
import type {
  LessonReflectionReportView,
  LessonScoreBreakdown,
  ScoreCounts,
} from "@/lib/reflection";
import type { SpeakingConversationFeedback } from "@/lib/reflection-prompt";
import { REFLECTION_PASS_SCORE } from "@/lib/points-system";
import type { LessonWithContent } from "@/lib/content/lesson-data";

const DEFAULT_HAN_VOICE = "cedar";

type ReportState =
  | { status: "loading" }
  | { status: "ready"; report: LessonReflectionReportView }
  | { status: "error" };

/**
 * Redesigned 2026-08-08 (user request): a real scored report card, not a
 * static "here's what you covered" count list - see
 * src/lib/reflection.ts. Generated once per (learner, lesson), cached.
 */
export function ReflectionStep({
  lesson,
  onContinue,
}: {
  lesson: LessonWithContent;
  onContinue: () => void;
}) {
  const [state, setState] = useState<ReportState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void getLessonReflectionReportAction(lesson.id).then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: "ready", report: result.report }
          : { status: "error" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [lesson.id]);

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>Reflection</SectionTitle>

      {state.status === "loading" && (
        <div className="flex items-center gap-2 rounded-panel border border-border bg-surface px-4 py-6 text-text-secondary">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <Body>Putting your report together...</Body>
        </div>
      )}

      {state.status === "error" && (
        <Body className="text-error-500" role="alert">
          Couldn&apos;t put together your report right now. You can still finish
          the lesson below.
        </Body>
      )}

      {state.status === "ready" && (
        <ReflectionReport report={state.report} lessonId={lesson.id} />
      )}

      <Button type="button" onClick={onContinue} className="mt-2 self-start">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Finish Lesson
      </Button>
    </div>
  );
}

function ScoreBar({ percent }: { percent: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full bg-current"
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

/**
 * Press-and-hold to reveal a score's correct/incorrect breakdown
 * (2026-08-16 user request). Pointer events cover both touch (long-press)
 * and mouse (press-and-hold); onKeyDown gives keyboard users an equivalent
 * without a hold gesture, since "hold" has no keyboard analogue.
 */
function useLongPress(onLongPress: () => void, delayMs = 550) {
  const timerRef = useRef<number | null>(null);
  const clear = useCallback(() => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);
  const start = useCallback(() => {
    clear();
    timerRef.current = window.setTimeout(onLongPress, delayMs);
  }, [clear, onLongPress, delayMs]);
  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onLongPress();
      }
    },
  };
}

function ScoreCard({
  label,
  value,
  colorClass,
  pressHandlers,
  children,
}: {
  label: string;
  value: string;
  colorClass: string;
  pressHandlers?: ReturnType<typeof useLongPress>;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3.5"
      role={pressHandlers ? "button" : undefined}
      tabIndex={pressHandlers ? 0 : undefined}
      aria-label={pressHandlers ? `${label} — press and hold for a breakdown` : undefined}
      {...pressHandlers}
    >
      <Caption className="font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </Caption>
      <Display className={cn("text-[1.7rem] leading-none", colorClass)}>
        {value}
      </Display>
      <div className={colorClass}>{children}</div>
    </div>
  );
}

function ScoreBreakdownLine({
  loading,
  counts,
  noun,
}: {
  loading: boolean;
  counts: ScoreCounts | null | undefined;
  noun: string;
}) {
  if (loading) {
    return (
      <Caption className="mt-1 block text-text-muted">
        Loading breakdown…
      </Caption>
    );
  }
  if (!counts || counts.total === 0) {
    return (
      <Caption className="mt-1 block text-text-muted">
        Nothing graded yet for {noun}.
      </Caption>
    );
  }
  return (
    <Caption className="mt-1 block text-text-muted">
      {counts.correct} of {counts.total} {noun} correct (
      {counts.total - counts.correct} missed)
    </Caption>
  );
}

/**
 * Speaking's score is multiplicative (points_system.md Part 1), not an
 * average: base_average × vocabularyUsageRatio × objectiveCompletionRatio.
 * A learner can see "50, 40, 50, 40" for the 5 core metrics and "20%, 25%"
 * for the two ratios as separate numbers without realizing they multiply
 * down catastrophically (2026-08-16 user report: a 2/100 Speaking score
 * looked broken next to dimensions in the 40s-50s, even though the math
 * was correct - 44 × 0.2 × 0.25 ≈ 2). This makes the actual arithmetic
 * visible instead of leaving the learner to do it themselves.
 *
 * `finalScore` is passed in rather than recomputed, and stated first and
 * explicitly - opening with "Your 5 core skills averaged X" (no restated
 * final number) read as if "5" were itself a score, confusing it with the
 * real, much-lower final score shown above this card (2026-08-16 second
 * user report on this same card).
 */
function SpeakingScoreExplainer({
  finalScore,
  dimensions,
}: {
  finalScore: number;
  dimensions: SpeakingConversationFeedback;
}) {
  const baseAverage = Math.round(
    (dimensions.pronunciation +
      dimensions.fluency +
      dimensions.accuracy +
      dimensions.complexity +
      dimensions.communicationEffectiveness) /
      5,
  );
  const vocabularyPercent = Math.round(dimensions.vocabularyUsageRatio * 100);
  const objectivePercent = Math.round(
    dimensions.objectiveCompletionRatio * 100,
  );
  if (vocabularyPercent >= 70 && objectivePercent >= 70) return null;

  return (
    <Caption className="rounded-control bg-warning-500/10 px-2.5 py-1.5 text-warning-500">
      Your final score is {finalScore}/100: your 5 core skills averaged{" "}
      {baseAverage}/100, but you only used {vocabularyPercent}% of the target
      vocabulary and completed {objectivePercent}% of the objective — those
      two percentages multiply the average down ({baseAverage} ×{" "}
      {vocabularyPercent}% × {objectivePercent}% ≈ {finalScore}) rather than
      just lowering it a little, which is why the final score is so far
      below the core skills average.
    </Caption>
  );
}

type BreakdownCategory = "vocabulary" | "grammar" | "comprehension" | "speaking";

export function ReflectionReport({
  report,
  lessonId,
}: {
  report: LessonReflectionReportView;
  lessonId?: string;
}) {
  const overall = report.totalScore ?? 0;
  const passed = overall >= REFLECTION_PASS_SCORE;

  const [breakdown, setBreakdown] = useState<LessonScoreBreakdown | null>(
    null,
  );
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [activeBreakdown, setActiveBreakdown] =
    useState<BreakdownCategory | null>(null);

  const revealBreakdown = useCallback(
    (category: BreakdownCategory) => {
      setActiveBreakdown((current) =>
        current === category ? null : category,
      );
      if (!lessonId || breakdown || breakdownLoading) return;
      setBreakdownLoading(true);
      void getLessonScoreBreakdownAction(lessonId).then((result) => {
        setBreakdownLoading(false);
        if (result.ok) setBreakdown(result.breakdown);
      });
    },
    [breakdown, breakdownLoading, lessonId],
  );

  const vocabularyPress = useLongPress(() => revealBreakdown("vocabulary"));
  const grammarPress = useLongPress(() => revealBreakdown("grammar"));
  const comprehensionPress = useLongPress(() =>
    revealBreakdown("comprehension"),
  );
  const speakingPress = useLongPress(() => revealBreakdown("speaking"));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-panel bg-linear-to-br from-secondary-900 via-secondary-700 to-accent-700 px-5 pt-5 pb-6">
        <Caption className="text-accent-100">
          {passed ? "Nice work today" : "Keep practicing"}
        </Caption>
        <div className="mt-1 flex items-baseline gap-2">
          <Display className="text-[2.6rem] text-on-color-light">{overall}</Display>
          <Caption className="text-on-color-light/75">
            / 100 — {REFLECTION_PASS_SCORE}+ to pass
          </Caption>
        </div>
        <div className="mt-2">
          <ScoreBar percent={overall} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <ScoreCard
          label="Vocabulary"
          value={
            report.vocabularyScore !== null ? `${report.vocabularyScore}` : "—"
          }
          colorClass="text-secondary-300"
          pressHandlers={lessonId ? vocabularyPress : undefined}
        >
          {report.vocabularyScore !== null && (
            <ScoreBar percent={report.vocabularyScore} />
          )}
          <Caption className="mt-1 block text-text-muted">
            {report.vocabularyCovered}/{report.vocabularyTotal} words explored
          </Caption>
          {activeBreakdown === "vocabulary" && (
            <ScoreBreakdownLine
              loading={breakdownLoading}
              counts={breakdown?.vocabulary}
              noun="quiz questions"
            />
          )}
        </ScoreCard>
        <ScoreCard
          label="Comprehension"
          value={
            report.comprehensionScore !== null
              ? `${report.comprehensionScore}`
              : "—"
          }
          colorClass="text-info-500"
          pressHandlers={lessonId ? comprehensionPress : undefined}
        >
          {report.comprehensionScore !== null && (
            <ScoreBar percent={report.comprehensionScore} />
          )}
          {activeBreakdown === "comprehension" && (
            <ScoreBreakdownLine
              loading={breakdownLoading}
              counts={breakdown?.comprehension}
              noun="exercises"
            />
          )}
        </ScoreCard>
        <ScoreCard
          label="Grammar"
          value={report.grammarScore !== null ? `${report.grammarScore}` : "—"}
          colorClass="text-primary-300"
          pressHandlers={lessonId ? grammarPress : undefined}
        >
          {report.grammarScore !== null && (
            <ScoreBar percent={report.grammarScore} />
          )}
          {activeBreakdown === "grammar" && (
            <ScoreBreakdownLine
              loading={breakdownLoading}
              counts={breakdown?.grammar}
              noun="exercises"
            />
          )}
        </ScoreCard>
        <div
          className="col-span-2 flex flex-col gap-2 rounded-card border border-accent-500 bg-surface p-3.5"
          role={lessonId ? "button" : undefined}
          tabIndex={lessonId ? 0 : undefined}
          aria-label={lessonId ? "Speaking — press and hold for a breakdown" : undefined}
          {...(lessonId ? speakingPress : {})}
        >
          <Caption className="font-semibold uppercase tracking-wide text-text-muted">
            Speaking
          </Caption>
          {report.speakingScore !== null && report.speakingDimensions ? (
            <>
              <Display className="text-[1.7rem] leading-none text-accent-300">
                {report.speakingScore}
              </Display>
              <ScoreBar percent={report.speakingScore} />
              <Caption className="mt-1 text-text-secondary">
                Reaching 30/30 needs strong vocabulary use and a fully
                completed objective, not just fluent conversation.
              </Caption>
              {activeBreakdown === "speaking" && (
                <Caption className="block text-text-muted">
                  {breakdownLoading
                    ? "Loading breakdown…"
                    : breakdown?.speakingMistakeCount != null
                      ? `${breakdown.speakingMistakeCount} specific issue${breakdown.speakingMistakeCount === 1 ? "" : "s"} identified in this conversation.`
                      : "No speaking evaluation yet."}
                </Caption>
              )}
              <SpeakingScoreExplainer
                finalScore={report.speakingScore}
                dimensions={report.speakingDimensions}
              />
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2">
                {(
                  [
                    ["Pronunciation", report.speakingDimensions.pronunciation],
                    ["Fluency", report.speakingDimensions.fluency],
                    ["Accuracy", report.speakingDimensions.accuracy],
                    ["Lesson language", report.speakingDimensions.complexity],
                    [
                      "Communication",
                      report.speakingDimensions.communicationEffectiveness,
                    ],
                    [
                      "Vocabulary used",
                      Math.round(
                        report.speakingDimensions.vocabularyUsageRatio * 100,
                      ),
                    ],
                    [
                      "Objective completed",
                      Math.round(
                        report.speakingDimensions.objectiveCompletionRatio *
                          100,
                      ),
                    ],
                  ] as const
                ).map(([dimLabel, dimValue]) => (
                  <div key={dimLabel} className="flex flex-col gap-1">
                    <div className="flex justify-between text-caption text-text-secondary">
                      <span>{dimLabel}</span>
                      <span>{dimValue}</span>
                    </div>
                    <div className="text-accent-300">
                      <ScoreBar percent={dimValue} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Body className="text-text-secondary">
              {report.speakingDimensions?.recommendedNextStep === "Speaking evaluation pending."
                ? "Speaking evaluation is temporarily unavailable. Reopen Reflection to retry."
                : "Not enough data yet — practice in the Speaking step to see your score here."}
            </Body>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-panel border border-error-500/35 bg-error-500/5 p-4">
        <div className="flex items-center gap-2">
          <Body className="font-display text-[1.05rem]">Speaking errors</Body>
        </div>
        {report.speakingDimensions?.mistakes?.length ? (
          <div className="flex flex-col gap-3">
            {report.speakingDimensions.mistakes.map((mistake, index) => (
              <div key={`${mistake.category}-${index}`} className="rounded-card border border-border bg-surface p-3">
                <Caption className="font-semibold uppercase tracking-wide text-error-500">
                  {mistake.category}
                </Caption>
                <Body className="mt-1 font-chinese text-text-primary">
                  &ldquo;{mistake.evidence}&rdquo;
                </Body>
                <Body className="mt-1 text-text-secondary">{mistake.feedback}</Body>
              </div>
            ))}
          </div>
        ) : report.speakingDimensions?.recommendedNextStep === "Speaking evaluation pending." ? (
          <Body className="text-text-secondary">
            Your transcript was saved, but automatic evaluation is temporarily unavailable. Reopen Reflection to retry.
          </Body>
        ) : report.speakingScore === null ? (
          <Body className="text-text-secondary">
            Complete a longer Speaking conversation to receive specific feedback here.
          </Body>
        ) : (
          <Body className="text-text-secondary">
            No specific speaking errors were detected in the available evidence.
          </Body>
        )}
        {report.speakingScore !== null && report.speakingDimensions?.recommendedNextStep && (
          <div className="rounded-card bg-accent-500/10 p-3">
            <Caption className="font-semibold text-accent-300">Recommended next step</Caption>
            <Body className="mt-1 text-text-secondary">
              {report.speakingDimensions.recommendedNextStep}
            </Body>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-4">
        <div className="flex items-center gap-2">
          <Body className="font-display text-[1.05rem]">A note from Han</Body>
          <div className="ml-auto">
            <HanSpeechButton
              text={report.hanNarrative}
              voice={DEFAULT_HAN_VOICE}
              responseLanguage="English"
            />
          </div>
        </div>
        <Body className="font-display text-[1rem] text-text-secondary italic">
          &ldquo;{report.hanNarrative}&rdquo;
        </Body>

        {report.strengths.length > 0 && (
          <div className="flex flex-col gap-1">
            <Caption className="font-semibold text-accent-300">
              What went well
            </Caption>
            <ul className="flex flex-col gap-1 pl-4">
              {report.strengths.map((item) => (
                <li
                  key={item}
                  className="list-disc text-body text-text-secondary"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.improvements.length > 0 && (
          <div className="flex flex-col gap-1">
            <Caption className="font-semibold text-accent-300">
              What to improve
            </Caption>
            <ul className="flex flex-col gap-1 pl-4">
              {report.improvements.map((item) => (
                <li
                  key={item}
                  className="list-disc text-body text-text-secondary"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
