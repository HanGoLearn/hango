// @vitest-environment jsdom
/**
 * Regression test for the 2026-09-26 "no pudimos cargar esta lección" report
 * (reported again after the Grammar pagination fixes, with the real error
 * text this time: "This lesson step is not available" - lesson-progress-
 * data.ts's setCurrentLessonStep). That error was always possible whenever a
 * step-nav click and the server disagreed about whether the target step was
 * reachable (e.g. optimistic completedStepIds drifting from the server
 * during a slow/racy save) - `handleSelectStep`/`handleAdvance` in
 * lesson-engine.tsx never caught the rejection, so it propagated up and
 * crashed the whole route to the generic error boundary instead of just
 * failing that one click. This test mocks the server actions to reject and
 * asserts the lesson keeps rendering (no crash) and reverts instead.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  usePathname: () => "/es/lesson/test-lesson",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/actions/ai-teacher", () => ({
  sendAiTeacherMessageAction: vi.fn(),
  resetAiTeacherConversationAction: vi.fn(),
}));
vi.mock("@/lib/actions/lesson-progress", () => ({
  goToLessonStepAction: vi.fn(),
  advanceLessonStepAction: vi.fn(),
}));
// SituationStep (the one real step rendered here) renders DialogueLines,
// which pulls this in.
vi.mock("@/lib/actions/dialogue-audio", () => ({
  getDialogueLineAudioAction: vi.fn(),
  getDialogueAudioAction: vi.fn(),
}));
// LessonEngine statically imports every step component regardless of which
// one is actually active (`renderStep`'s switch isn't lazy), and this test
// only exercises SITUATION - stubbing the other, unused step components
// directly sidesteps their whole real import chain (several reach
// next-auth -> next/server via their own "use server" actions, which jsdom
// can't resolve) instead of having to mock every transitive dependency.
vi.mock("@/components/lesson/steps/dialogue-step", () => ({
  DialogueStep: () => null,
}));
vi.mock("@/components/lesson/steps/comprehension-step", () => ({
  ComprehensionStep: () => null,
}));
vi.mock("@/components/lesson/steps/vocabulary-step", () => ({
  VocabularyStep: () => null,
}));
vi.mock("@/components/lesson/steps/grammar-step", () => ({
  GrammarStep: () => null,
}));
vi.mock("@/components/lesson/steps/guided-practice-step", () => ({
  GuidedPracticeStep: () => null,
}));
vi.mock("@/components/lesson/steps/speaking-step", () => ({
  SpeakingStep: () => null,
}));
vi.mock("@/components/lesson/steps/writing-step", () => ({
  WritingStep: () => null,
}));
vi.mock("@/components/lesson/steps/quiz-step", () => ({
  QuizStep: () => null,
}));
vi.mock("@/components/lesson/steps/mission-step", () => ({
  MissionStep: () => null,
}));
vi.mock("@/components/lesson/steps/reflection-step", () => ({
  ReflectionStep: () => null,
}));

import { AiTeacherProvider } from "@/components/ai-teacher/ai-teacher-provider";
import { LessonMessagesProvider } from "@/components/lesson/lesson-messages";
import { LessonEngine } from "@/components/lesson/lesson-engine";
import { messages as spanishMessages } from "@/i18n/messages/es";
import {
  goToLessonStepAction,
  advanceLessonStepAction,
} from "@/lib/actions/lesson-progress";
import type { LessonWithContent } from "@/lib/content/lesson-data";
import type { AppLocale } from "@/i18n/config";

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

function buildLesson(): LessonWithContent {
  return {
    id: "lesson-1",
    title: "Lección de prueba",
    communicationObjective: "Pedir comida en un restaurante.",
    learningObjectives: [],
    dialogues: [],
    vocabulary: [],
    grammar: [],
    scenarioLevel: {
      difficulty: "BEGINNER",
      scenario: { name: "Restaurante", slug: "restaurant" },
    },
    steps: [
      { id: "step-completed", type: "SITUATION", order: 0 },
      { id: "step-current", type: "SITUATION", order: 1 },
    ],
  } as unknown as LessonWithContent;
}

function renderLesson() {
  render(
    <LessonMessagesProvider messages={spanishMessages.lesson}>
      <AiTeacherProvider initialMessages={[]}>
        <LessonEngine
          lesson={buildLesson()}
          initialCurrentStepId="step-current"
          initialCompletedStepIds={["step-completed"]}
          locale={"es" as AppLocale}
        />
      </AiTeacherProvider>
    </LessonMessagesProvider>,
  );
}

describe("LessonEngine step-navigation failure handling", () => {
  it("does not crash the lesson when jumping to a step the server rejects, and reverts", async () => {
    const user = userEvent.setup();
    vi.mocked(goToLessonStepAction).mockRejectedValue(
      new Error("This lesson step is not available."),
    );

    renderLesson();

    // "Situación — completado" is the previously-finished step's node -
    // clickable client-side, but the mocked server disagrees (exactly the
    // real-world drift this test reproduces).
    const completedStepButton = screen.getByRole("button", {
      name: /completado/i,
    });
    await user.click(completedStepButton);

    // The click must not throw/crash the tree - the page keeps rendering
    // its normal content (SituationStep's Continue button) instead of the
    // route's generic error boundary taking over.
    expect(
      await screen.findByRole("button", { name: "Continuar" }),
    ).toBeInTheDocument();
    expect(goToLessonStepAction).toHaveBeenCalledTimes(1);

    // The header's save-state icon must reflect the failure (role="status").
    expect(screen.getByRole("status")).toHaveTextContent(
      "No pudimos guardar eso. Inténtalo de nuevo.",
    );
  });

  it("does not crash the lesson when Continue is rejected by the server, and reverts", async () => {
    const user = userEvent.setup();
    vi.mocked(advanceLessonStepAction).mockRejectedValue(
      new Error("This is not the current step for this lesson."),
    );

    renderLesson();

    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(
      await screen.findByRole("button", { name: "Continuar" }),
    ).toBeInTheDocument();
    expect(advanceLessonStepAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "No pudimos guardar eso. Inténtalo de nuevo.",
    );
  });
});
