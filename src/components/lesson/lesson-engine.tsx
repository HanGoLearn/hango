"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LessonDisplayPrefsProvider } from "@/components/lesson/lesson-display-prefs";
import { useAiTeacher } from "@/components/ai-teacher/ai-teacher-provider";
import { DisplayToggles } from "@/components/lesson/display-toggles";
import { LessonHeader } from "@/components/lesson/lesson-header";
import { StepNavigation } from "@/components/lesson/step-navigation";
import { SituationStep } from "@/components/lesson/steps/situation-step";
import { DialogueStep } from "@/components/lesson/steps/dialogue-step";
import { ComprehensionStep } from "@/components/lesson/steps/comprehension-step";
import { VocabularyStep } from "@/components/lesson/steps/vocabulary-step";
import { GrammarStep } from "@/components/lesson/steps/grammar-step";
import { GuidedPracticeStep } from "@/components/lesson/steps/guided-practice-step";
import { SpeakingStep } from "@/components/lesson/steps/speaking-step";
import { WritingStep } from "@/components/lesson/steps/writing-step";
import { QuizStep } from "@/components/lesson/steps/quiz-step";
import { MissionStep } from "@/components/lesson/steps/mission-step";
import { ReflectionStep } from "@/components/lesson/steps/reflection-step";
import { resolveStepAvailability } from "@/lib/lesson-progress";
import {
  advanceLessonStepAction,
  goToLessonStepAction,
} from "@/lib/actions/lesson-progress";
import type { LessonWithContent } from "@/lib/content/lesson-data";
import { localePath, type AppLocale } from "@/i18n/config";

export interface LessonEngineProps {
  lesson: LessonWithContent;
  initialCurrentStepId: string;
  initialCompletedStepIds: string[];
  locale: AppLocale;
}

export function LessonEngine({
  lesson,
  initialCurrentStepId,
  initialCompletedStepIds,
  locale,
}: LessonEngineProps) {
  const router = useRouter();
  const [currentStepId, setCurrentStepId] = useState(initialCurrentStepId);
  const [completedStepIds, setCompletedStepIds] = useState(
    new Set(initialCompletedStepIds),
  );
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState(false);

  const steps = lesson.steps;
  const statuses = resolveStepAvailability(steps, completedStepIds);
  const currentStep =
    steps.find((step) => step.id === currentStepId) ?? steps[0]!;

  const { setContext, clearSelection } = useAiTeacher();

  useEffect(() => {
    clearSelection();
    setContext({
      scenarioName: lesson.scenarioLevel.scenario.name,
      lessonTitle: lesson.title,
      lessonStepType: currentStep.type,
      lessonVocabulary: lesson.vocabulary.map(({ vocabularyItem }) => ({
        chineseForm: vocabularyItem.chineseForm,
        pinyin: vocabularyItem.pinyin,
        meaning: vocabularyItem.meaning,
      })),
      lessonGrammar: lesson.grammar.map(({ grammarPoint }) => ({
        name: grammarPoint.name,
        structure: grammarPoint.structure,
      })),
    });
    // Re-syncs the AI Teacher's context whenever the active step changes;
    // setContext/clearSelection are stable (useCallback in the provider).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep.id]);

  function handleSelectStep(stepId: string) {
    // Guards the same race handleAdvance does below: without this, tapping
    // a step icon while a previous save is still in flight fires a second
    // action before `currentStepId` has caught up, sending a stale step id
    // that the server would otherwise reject.
    if (isSaving) return;
    const previousStepId = currentStepId;
    setCurrentStepId(stepId);
    startSaving(async () => {
      try {
        await goToLessonStepAction(lesson.id, stepId);
        setSaveError(false);
      } catch (error) {
        // 2026-09-26 ("no pudimos cargar esta lección", reported recurring
        // in Grammar): this rejected uncaught before - `setCurrentLessonStep`
        // throws "This lesson step is not available" whenever the clicked
        // step turns out to be neither the current one nor genuinely
        // completed server-side, which nothing here used to catch. That
        // throw propagated up through the transition and hit the route's
        // generic error boundary instead of just failing this one click.
        // Revert the optimistic jump and surface it inline instead.
        console.error("goToLessonStepAction failed:", error);
        setCurrentStepId(previousStepId);
        setSaveError(true);
      }
    });
  }

  /**
   * Bug fix (2026-09-26): "No pudimos cargar esta lección" showed up when a
   * learner tapped Continue twice - the button was never disabled while
   * saving, and on a slower connection to the remote database that's an
   * easy double-tap. The first request advances `currentStepId` server-side;
   * the second, still carrying the now-stale `currentStep.id` from before
   * this component re-rendered, arrived after and got rejected by
   * `advanceLessonStep`'s "not the current step" check - an error nothing
   * here caught, which is exactly what surfaces the route's generic error
   * boundary.
   *
   * The real fix is this guard: while a save from this same step is already
   * in flight, a second call is a no-op rather than a second request. The
   * server-side check also became idempotent for a genuine race (a dropped
   * response causing a real resend), but that is a safety net - this guard
   * is what stops the double-tap from ever reaching the network twice.
   */
  function handleAdvance(response: unknown = undefined) {
    if (isSaving) return;
    const previousCompleted = completedStepIds;
    const nextCompleted = new Set(completedStepIds);
    nextCompleted.add(currentStep.id);
    setCompletedStepIds(nextCompleted);

    startSaving(async () => {
      try {
        const result = await advanceLessonStepAction(
          lesson.id,
          currentStep.id,
          response,
        );
        setSaveError(false);
        if (result.completedAt) {
          router.push(
            localePath(
              locale,
              `/learning-journey/${lesson.scenarioLevel.scenario.slug}`,
            ),
          );
          return;
        }
        const currentIndex = steps.findIndex(
          (step) => step.id === currentStep.id,
        );
        const next = steps[currentIndex + 1];
        if (next) setCurrentStepId(next.id);
      } catch (error) {
        // Same class of bug as handleSelectStep above: a rejected save used
        // to throw uncaught here too, crashing the whole route instead of
        // just failing this one Continue tap. Revert the optimistic
        // completion and surface it inline so the learner can retry.
        console.error("advanceLessonStepAction failed:", error);
        setCompletedStepIds(previousCompleted);
        setSaveError(true);
      }
    });
  }

  const currentIndex = steps.findIndex((step) => step.id === currentStep.id);

  return (
    <LessonDisplayPrefsProvider>
      <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-16">
        {/* One sticky block, edge to edge (the negative margins cancel the
            app shell's own padding), so the bar and the path travel
            together and the step's content starts right under them instead
            of ~503px down. */}
        <div
          data-tour-id="lesson-steps"
          className="sticky top-0 z-20 -mx-4 -mt-4 flex flex-col gap-1 border-b border-border bg-surface px-3 pt-2 pb-2"
        >
          <LessonHeader
            locale={locale}
            scenarioSlug={lesson.scenarioLevel.scenario.slug}
            lessonTitle={lesson.title}
            currentStepType={currentStep.type}
            position={currentIndex + 1}
            totalCount={steps.length}
            saving={isSaving}
            saveError={saveError}
          />

          <StepNavigation
            steps={steps}
            statuses={statuses}
            currentStepId={currentStep.id}
            onSelect={handleSelectStep}
          />
        </div>

        <DisplayToggles />

        {renderStep(currentStep.type, lesson, handleAdvance)}
      </div>
    </LessonDisplayPrefsProvider>
  );
}

function renderStep(
  type: string,
  lesson: LessonWithContent,
  onContinue: (response?: unknown) => void,
) {
  switch (type) {
    case "SITUATION":
    case "OBJECTIVE":
      return <SituationStep lesson={lesson} onContinue={() => onContinue()} />;
    case "DIALOGUE":
      return (
        <DialogueStep
          dialogues={lesson.dialogues}
          onContinue={() => onContinue()}
        />
      );
    case "COMPREHENSION":
      return (
        <ComprehensionStep
          exercises={lesson.comprehensionExercises}
          dialogues={lesson.dialogues}
          onContinue={() => onContinue()}
        />
      );
    case "VOCABULARY":
      return (
        <VocabularyStep
          vocabulary={lesson.vocabulary}
          difficulty={lesson.scenarioLevel.difficulty}
          lessonId={lesson.id}
          onContinue={() => onContinue()}
        />
      );
    case "GRAMMAR":
      return (
        <GrammarStep grammar={lesson.grammar} onContinue={() => onContinue()} />
      );
    case "GUIDED_PRACTICE":
      return (
        <GuidedPracticeStep
          exercises={lesson.guidedPracticeExercises}
          onContinue={() => onContinue()}
        />
      );
    case "SPEAKING":
    case "AI_CHALLENGE":
      return (
        <SpeakingStep
          mission={lesson.mission}
          vocabulary={lesson.vocabulary}
          grammar={lesson.grammar}
          dialogues={lesson.dialogues}
          hskReference={lesson.hskReference}
          onContinue={() => onContinue()}
        />
      );
    case "WRITING":
      return <WritingStep onContinue={() => onContinue()} />;
    case "QUIZ":
      return (
        <QuizStep quizzes={lesson.quizzes} onContinue={() => onContinue()} />
      );
    case "MISSION":
      return (
        <MissionStep mission={lesson.mission} onContinue={() => onContinue()} />
      );
    case "REFLECTION":
      return <ReflectionStep lesson={lesson} onContinue={() => onContinue()} />;
    default:
      return null;
  }
}
