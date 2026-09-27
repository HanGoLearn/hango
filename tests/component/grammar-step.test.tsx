// @vitest-environment jsdom
/**
 * Regression test for the 2026-09-26 "no pudimos cargar esta lección" report
 * in Grammar, reproducing the actual bug found by reading the code: pagination
 * reuses one `ExerciseItem` instance across screens (same tree position, new
 * `item` prop) - without a `key`, its internal per-exercise state doesn't
 * reset between exercises of different types, which is exactly what this test
 * exercises (MULTIPLE_CHOICE screen -> SENTENCE_ORDERING screen -> MATCHING
 * screen). It also covers the newly added "answer locks it in and
 * auto-advances" behavior (user request, "lo mismo que vocabulario").
 */
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Same pattern as tests/component/shell.test.tsx: next/navigation and the
// AI Teacher server actions pull in next-auth (-> next/server), which
// Vitest's jsdom environment can't resolve the way Next's own bundler does.
// GrammarScreenCard always renders AskAiButton (for the explanation screen),
// which reaches this chain through AiTeacherProvider/useAiTeacher.
vi.mock("next/navigation", () => ({
  usePathname: () => "/es/lesson/test-lesson",
}));
vi.mock("@/lib/actions/ai-teacher", () => ({
  sendAiTeacherMessageAction: vi.fn(),
  resetAiTeacherConversationAction: vi.fn(),
}));
vi.mock("@/lib/actions/exercise-progress", () => ({
  submitExerciseAttemptsAction: vi.fn(),
}));
vi.mock("@/lib/actions/grammar-interactivity", () => ({
  getGrammarExampleAudioAction: vi.fn(),
}));

import { LessonMessagesProvider } from "@/components/lesson/lesson-messages";
import { LessonDisplayPrefsProvider } from "@/components/lesson/lesson-display-prefs";
import { AiTeacherProvider } from "@/components/ai-teacher/ai-teacher-provider";
import { GrammarStep } from "@/components/lesson/steps/grammar-step";
import { messages as spanishMessages } from "@/i18n/messages/es";
import { submitExerciseAttemptsAction } from "@/lib/actions/exercise-progress";
import type { LessonWithContent } from "@/lib/content/lesson-data";

// vi.mock's submitExerciseAttemptsAction is one module-level vi.fn() shared
// by every test in this file - without resetting it, a later test's call
// count includes calls from earlier tests too.
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function buildGrammar(): LessonWithContent["grammar"] {
  return [
    {
      grammarPoint: {
        id: "point-1",
        name: "Punto 1",
        structure: "S + V + O",
        communicationPurpose: null,
        explanation: "Explicación del punto 1.",
        commonMistake: null,
        examples: [],
        exercises: [
          {
            id: "exercise-mc",
            type: "MULTIPLE_CHOICE",
            prompt: "Elige la opción correcta",
            options: [
              { id: "opt-a", content: "Opción A" },
              { id: "opt-b", content: "Opción B" },
            ],
            tokens: [],
            leftTerms: [],
            rightTerms: [],
            hints: [],
          },
          {
            id: "exercise-order",
            type: "SENTENCE_ORDERING",
            prompt: "Ordena la oración",
            options: [],
            tokens: ["我", "是", "学生"],
            leftTerms: [],
            rightTerms: [],
            hints: [],
          },
        ],
      },
    },
    {
      grammarPoint: {
        id: "point-2",
        name: "Punto 2",
        structure: "A 跟 B 一样",
        communicationPurpose: null,
        explanation: "Explicación del punto 2.",
        commonMistake: null,
        examples: [],
        exercises: [
          {
            id: "exercise-match",
            type: "MATCHING",
            prompt: "Empareja los términos",
            options: [],
            tokens: [],
            leftTerms: ["猫"],
            rightTerms: ["cat"],
            hints: [],
          },
        ],
      },
    },
  ] as unknown as LessonWithContent["grammar"];
}

function renderGrammarStep(onContinue = vi.fn()) {
  render(
    <LessonMessagesProvider messages={spanishMessages.lesson}>
      <LessonDisplayPrefsProvider>
        <AiTeacherProvider initialMessages={[]}>
          <GrammarStep grammar={buildGrammar()} onContinue={onContinue} />
        </AiTeacherProvider>
      </LessonDisplayPrefsProvider>
    </LessonMessagesProvider>,
  );
  return onContinue;
}

describe("GrammarStep pagination", () => {
  it("does not crash walking through mixed exercise types and locks each answer in place", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      delay: null,
      advanceTimers: vi.advanceTimersByTime,
    });

    renderGrammarStep();

    // Screen 1: MULTIPLE_CHOICE for point 1 - answering it must not throw,
    // must lock the option, and must auto-advance to the next screen.
    expect(screen.getByText("Opción A")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Opción A/ }));
    expect(screen.getByRole("button", { name: /Opción A/ })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Screen 2: SENTENCE_ORDERING for the SAME point - this is the exact
    // scenario that broke before `key={exercise.id}` was added: the
    // MULTIPLE_CHOICE screen's leftover internal state must not leak in and
    // must not throw while rendering a completely different exercise shape.
    expect(await screen.findByText("我")).toBeInTheDocument();
    expect(screen.getByText("是")).toBeInTheDocument();
    expect(screen.getByText("学生")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "我" }));
    await user.click(screen.getByRole("button", { name: "是" }));
    await user.click(screen.getByRole("button", { name: "学生" }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Screen 3: MATCHING for point 2 - again a different shape entirely.
    expect(await screen.findByText("猫")).toBeInTheDocument();
    expect(screen.getByText("cat")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "猫" }));
    await user.click(screen.getByRole("button", { name: "cat" }));

    const submit = vi.mocked(submitExerciseAttemptsAction);
    submit.mockResolvedValue({
      "exercise-mc": {
        isCorrect: true,
        explanation: null,
        correctOptionId: "opt-a",
      },
      "exercise-order": {
        isCorrect: true,
        explanation: null,
        correctOptionId: null,
      },
      "exercise-match": {
        isCorrect: true,
        explanation: null,
        correctOptionId: null,
      },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // The batched submission fired automatically after the last exercise
    // was answered, exactly once, with exactly the three answers collected
    // across every screen - proving the pagination never lost or duplicated
    // an answer while resetting per-screen state.
    expect(submit).toHaveBeenCalledTimes(1);
    const [payload] = submit.mock.calls[0]!;
    expect(payload.map((p) => p.exerciseId).sort()).toEqual([
      "exercise-match",
      "exercise-mc",
      "exercise-order",
    ]);

    vi.useRealTimers();
  });

  it("never submits the batch twice even if triggered twice in quick succession", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      delay: null,
      advanceTimers: vi.advanceTimersByTime,
    });
    const submit = vi.mocked(submitExerciseAttemptsAction);
    let resolveSubmit: (value: Record<string, unknown>) => void;
    submit.mockReturnValue(
      new Promise((resolve) => {
        resolveSubmit = resolve as typeof resolveSubmit;
      }),
    );

    renderGrammarStep();

    await user.click(screen.getByRole("button", { name: /Opción A/ }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    await user.click(screen.getByRole("button", { name: "我" }));
    await user.click(screen.getByRole("button", { name: "是" }));
    await user.click(screen.getByRole("button", { name: "学生" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    await user.click(screen.getByRole("button", { name: "猫" }));
    await user.click(screen.getByRole("button", { name: "cat" }));

    // The auto-advance timer is about to fire "Comprobar respuestas" on its
    // own; also click the manual button right on top of it, simulating the
    // exact race a fast learner (or a double-tap) could cause.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    const checkButton = screen.queryByRole("button", {
      name: "Comprobar respuestas",
    });
    if (checkButton && !checkButton.hasAttribute("disabled")) {
      await user.click(checkButton);
    }

    resolveSubmit!({});
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(submit).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
