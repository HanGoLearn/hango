"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Sparkles, Loader2 } from "lucide-react";
import {
  SectionTitle,
  Body,
  Caption,
  Display,
} from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalDescription,
  ModalClose,
} from "@/components/ui/modal";
import {
  getScenarioCompletionAction,
  redoScenarioAction,
} from "@/lib/actions/scenario-completion";
import type { ScenarioCompletionResult } from "@/lib/scenario-completion";

export interface ScenarioCompletionLesson {
  id: string;
  title: string;
  reflectionTotalScore: number | null;
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; completion: ScenarioCompletionResult | null }
  | { status: "error" };

/**
 * Points & Leveling System (docs/02_academy/points_system.md Part 1) - the
 * scenario completion screen: shown once every lesson in the scenario has
 * a Reflection score. Lazily fetches/generates the ScenarioCompletion
 * (same pattern as ReflectionStep) and offers "Redo this scenario", which
 * clears everything (progress, attempts, the old ScenarioCompletion) so a
 * retry counts as a genuinely fresh attempt, not a stacked one.
 */
export function ScenarioCompletionSummary({
  scenarioId,
  scenarioSlug,
  lessons,
}: {
  scenarioId: string;
  scenarioSlug: string;
  lessons: ScenarioCompletionLesson[];
}) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [redoing, setRedoing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getScenarioCompletionAction(scenarioId).then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: "ready", completion: result.completion }
          : { status: "error" },
      );
    });
    return () => {
      cancelled = true;
    };
  }, [scenarioId]);

  async function handleRedo() {
    setRedoing(true);
    const result = await redoScenarioAction(scenarioId, scenarioSlug);
    setRedoing(false);
    setConfirmOpen(false);
    if (result.ok) {
      router.refresh();
    }
  }

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 rounded-panel border border-border bg-surface px-4 py-6 text-text-secondary">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <Body>Putting together your scenario summary...</Body>
      </div>
    );
  }

  if (state.status === "error" || !state.completion) {
    return null;
  }

  const { completion } = state;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-panel bg-linear-to-br from-secondary-900 via-secondary-700 to-accent-700 px-5 pt-5 pb-6">
        <div className="flex items-center gap-1.5 text-accent-100">
          <Sparkles className="size-4" aria-hidden="true" />
          <Caption>Scenario completed</Caption>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <Display className="text-[2rem] text-on-color-light">
            +{completion.earnedPoints.toFixed(1)}
          </Display>
          <Caption className="text-on-color-light/75">
            of {completion.scenarioPointsBudget.toFixed(1)} points toward your
            General Level
          </Caption>
        </div>
        <Caption className="mt-1 text-on-color-light/75">
          {completion.weightedReflectionAverage}% weighted average across this
          scenario&apos;s lessons
        </Caption>
      </div>

      <Card className="flex flex-col gap-2">
        <Caption className="font-semibold uppercase tracking-wide text-text-muted">
          Lesson scores
        </Caption>
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="flex items-center justify-between gap-3 border-t border-border pt-2 first:border-t-0 first:pt-0"
          >
            <Body className="text-text-primary">{lesson.title}</Body>
            <Body className="font-semibold text-text-secondary">
              {lesson.reflectionTotalScore ?? "—"}
            </Body>
          </div>
        ))}
      </Card>

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Button
          type="button"
          variant="tertiary"
          onClick={() => setConfirmOpen(true)}
          className="self-start"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Redo this scenario
        </Button>
        <ModalContent>
          <ModalTitle>Redo this scenario?</ModalTitle>
          <ModalDescription>
            This clears your progress and scores for every lesson in this
            scenario so you can attempt it fresh. Your new result will replace
            this one — it won&apos;t stack on top of it.
          </ModalDescription>
          <div className="mt-4 flex justify-end gap-2">
            <ModalClose asChild>
              <Button type="button" variant="tertiary">
                Cancel
              </Button>
            </ModalClose>
            <Button type="button" onClick={handleRedo} loading={redoing}>
              Yes, redo it
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
