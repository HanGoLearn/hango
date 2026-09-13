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
    setCurrentStepId(stepId);
    startSaving(async () => {
      await goToLessonStepAction(lesson.id, stepId);
    });
  }

  function handleAdvance(response: unknown = undefined) {
    const nextCompleted = new Set(completedStepIds);
    nextCompleted.add(currentStep.id);
    setCompletedStepIds(nextCompleted);

    startSaving(async () => {
      const result = await advanceLessonStepAction(
        lesson.id,
        currentStep.id,
        steps,
        response,
      );
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
    });
  }

  return (
    <LessonDisplayPrefsProvider>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-16">
        <LessonHeader
          locale={locale}
          scenarioName={lesson.scenarioLevel.scenario.name}
          scenarioSlug={lesson.scenarioLevel.scenario.slug}
          lessonTitle={lesson.title}
          communicationObjective={lesson.communicationObjective}
          currentStepType={currentStep.type}
          completedCount={completedStepIds.size}
          totalCount={steps.length}
          saving={isSaving}
        />

        <StepNavigation
          steps={steps}
          statuses={statuses}
          currentStepId={currentStep.id}
          onSelect={handleSelectStep}
        />

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
