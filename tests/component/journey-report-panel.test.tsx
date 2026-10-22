// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  read: vi.fn(),
  evaluate: vi.fn(),
  recover: vi.fn(),
  save: vi.fn(),
  legacy: vi.fn(),
  redo: vi.fn(),
}));
vi.mock("@/lib/actions/journey-lesson-report", () => ({
  getJourneyLessonReportAction: mocks.read,
  evaluateJourneyLessonReportAction: mocks.evaluate,
  recoverJourneyLessonReportAction: mocks.recover,
  saveJourneyLessonReportAction: mocks.save,
}));
vi.mock("@/lib/actions/reflection", () => ({
  getLessonReflectionReportAction: mocks.legacy,
  getLessonScoreBreakdownAction: vi.fn(),
  getReflectionStreakAction: vi.fn(),
}));
vi.mock("@/lib/actions/scenario-completion", () => ({
  redoLessonAction: mocks.redo,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/ai-teacher/han-speech-button", () => ({
  HanSpeechButton: () => null,
}));
import { JourneyReportPanel } from "@/components/lesson/journey-report-panel";
import { ReflectionStep } from "@/components/lesson/steps/reflection-step";
import type { LessonWithContent } from "@/lib/content/lesson-data";
import { LessonResultsView } from "@/components/lesson/lesson-results-view";
import { LessonMessagesProvider } from "@/components/lesson/lesson-messages";
import { messages } from "@/i18n/messages/es";
import {
  buildJourneyLessonReport,
  JOURNEY_LESSON_REPORT_VERSION,
} from "@/lib/journey-lesson-report";
import { unifiedView } from "../fixtures/journey-unified";
function report(
  state: "PENDING" | "PROCESSING" | "INSUFFICIENT" = "PENDING",
  locale: "es" | "en" = "es",
) {
  return buildJourneyLessonReport(
    "own-attempt",
    locale,
    {
      version: JOURNEY_LESSON_REPORT_VERSION,
      progressId: "run",
      progressStartedAt: "2026-10-11T12:00:00.000Z",
      capturedAt: "2026-10-11T12:01:00.000Z",
      vocabulary: [],
      grammar: [],
      comprehension: [],
    },
    state,
    null,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.read.mockResolvedValue({ ok: true, report: report() });
});
afterEach(cleanup);
describe("Journey report action boundary", () => {
  it("evaluates an integrated lesson only on request, saves one result, and cannot award or finish it as teacher-validated", async () => {
    const pending = report();
    pending.unified = {
      ...unifiedView(),
      phase: "WAITING",
      speakingScore: null,
      lessonScore: null,
    };
    const ready = {
      ...pending,
      unified: unifiedView(),
      speaking: { ...pending.speaking, state: "PARTIAL" as const },
    };
    mocks.read.mockResolvedValue({ ok: true, report: pending });
    mocks.evaluate.mockResolvedValue({ ok: true, report: ready });
    const exit = vi.fn(),
      finish = vi.fn();
    render(
      <JourneyReportPanel
        lessonId="lesson"
        locale="es"
        onExit={exit}
        onContinue={finish}
      />,
    );
    const button = await screen.findByRole("button", {
      name: "Evaluar esta conversación",
    });
    expect(mocks.evaluate).not.toHaveBeenCalled();
    fireEvent.click(button);
    await screen.findByRole("group", {
      name: "Nota provisional de la lección: 93/100",
    });
    expect(mocks.evaluate).toHaveBeenCalledTimes(1);
    expect(mocks.save).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Finalizar lección" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Volver a la ruta" }));
    expect(exit).toHaveBeenCalledTimes(1);
    expect(finish).not.toHaveBeenCalled();
    expect(mocks.legacy).not.toHaveBeenCalled();
    expect(mocks.recover).not.toHaveBeenCalled();
  });
  it.each(["es", "en"] as const)(
    "discloses a saved-candidate review as no additional AI (%s)",
    async (locale) => {
      const failed = report("PENDING", locale);
      failed.speaking = {
        state: "FAILED",
        score: null,
        report: null,
        canRetry: true,
        canRepairWithoutAi: true,
      };
      mocks.read.mockResolvedValue({ ok: true, report: failed });
      mocks.recover.mockResolvedValue({ ok: true, report: failed });
      render(<JourneyReportPanel lessonId="lesson" locale={locale} />);
      const button = await screen.findByRole("button", {
        name:
          locale === "es"
            ? "Revisar evaluación guardada"
            : "Review saved evaluation",
      });
      expect(
        screen.getByText(
          locale === "es" ? /no utiliza IA adicional/ : /uses no additional AI/,
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText(/consumo adicional/)).not.toBeInTheDocument();
      expect(mocks.recover).not.toHaveBeenCalled();
      fireEvent.click(button);
      await waitFor(() => expect(mocks.recover).toHaveBeenCalledTimes(1));
      expect(mocks.evaluate).not.toHaveBeenCalled();
    },
  );
  it("can leave a failed report without paying for recovery or resetting the lesson", async () => {
    const failed = report();
    failed.speaking = {
      state: "FAILED",
      score: null,
      report: null,
      canRetry: true,
    };
    mocks.read.mockResolvedValue({ ok: true, report: failed });
    const exit = vi.fn();
    render(<JourneyReportPanel lessonId="lesson" locale="es" onExit={exit} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Volver a la ruta" }),
    );
    expect(exit).toHaveBeenCalledTimes(1);
    expect(mocks.recover).not.toHaveBeenCalled();
    expect(mocks.redo).not.toHaveBeenCalled();
  });
  it("recovers saved speech only after an explicit press and discloses extra AI usage", async () => {
    const failed = report();
    failed.speaking = {
      state: "FAILED",
      score: null,
      report: null,
      canRetry: true,
    };
    mocks.read.mockResolvedValue({ ok: true, report: failed });
    mocks.recover.mockResolvedValue({
      ok: true,
      report: { ...failed, speaking: { ...failed.speaking, canRetry: false } },
    });
    render(<JourneyReportPanel lessonId="lesson" locale="es" />);
    const recover = await screen.findByRole("button", {
      name: "Recuperar evaluación",
    });
    expect(screen.getByText(/consumo adicional/)).toBeInTheDocument();
    expect(mocks.recover).not.toHaveBeenCalled();
    fireEvent.click(recover);
    fireEvent.click(recover);
    await waitFor(() =>
      expect(mocks.recover).toHaveBeenCalledExactlyOnceWith({
        lessonId: "lesson",
      }),
    );
    expect(mocks.evaluate).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Recuperar evaluación" }),
    ).not.toBeInTheDocument();
  });
  it("Reflection mounts only the new reader and provides explicit redo recovery", async () => {
    const lesson = {
      id: "lesson",
      slug: "slug",
      scenarioLevel: { scenario: { slug: "scenario" } },
    } as LessonWithContent;
    render(
      <LessonMessagesProvider messages={messages.lesson}>
        <ReflectionStep
          lesson={lesson}
          journeyReport
          locale="es"
          onContinue={vi.fn()}
        />
      </LessonMessagesProvider>,
    );
    await screen.findByLabelText("Nota global: —");
    expect(mocks.legacy).not.toHaveBeenCalled();
    expect(mocks.evaluate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: messages.lesson.common.tryAgain }),
    ).toBeInTheDocument();
    expect(mocks.redo).not.toHaveBeenCalled();
  });
  it.each(["es", "en"] as const)(
    "opening in %s only reads; evaluation requires a press",
    async (locale) => {
      mocks.read.mockResolvedValue({
        ok: true,
        report: report("PENDING", locale),
      });
      mocks.evaluate.mockResolvedValue({
        ok: true,
        report: report("INSUFFICIENT", locale),
      });
      render(<JourneyReportPanel lessonId="lesson" locale={locale} />);
      const evaluate = await screen.findByRole("button", {
        name:
          locale === "es"
            ? "Evaluar esta conversación"
            : "Evaluate this conversation",
      });
      expect(mocks.evaluate).not.toHaveBeenCalled();
      expect(mocks.save).not.toHaveBeenCalled();
      fireEvent.click(evaluate);
      await waitFor(() =>
        expect(mocks.evaluate).toHaveBeenCalledExactlyOnceWith({
          lessonId: "lesson",
        }),
      );
      expect(mocks.legacy).not.toHaveBeenCalled();
    },
  );
  it("a save failure offers save-only retry and no automatic evaluation retry", async () => {
    mocks.evaluate.mockResolvedValue({ ok: false, code: "UNAVAILABLE" });
    mocks.save.mockResolvedValue({ ok: true, report: report("INSUFFICIENT") });
    const onContinue = vi.fn();
    const onExit = vi.fn();
    render(
      <JourneyReportPanel
        lessonId="lesson"
        locale="es"
        onContinue={onContinue}
        onExit={onExit}
      />,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Evaluar esta conversación" }),
    );
    const retry = await screen.findByRole("button", {
      name: "Reintentar solo el guardado",
    });
    expect(
      screen.queryByRole("button", { name: "Finalizar lección" }),
    ).not.toBeInTheDocument();
    fireEvent.click(retry);
    fireEvent.click(
      await screen.findByRole("button", { name: "Volver a la ruta" }),
    );
    expect(mocks.evaluate).toHaveBeenCalledTimes(1);
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith({ lessonId: "lesson" });
    expect(onContinue).not.toHaveBeenCalled();
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Nota global: —")).toBeInTheDocument();
  });
  it("processing can be checked without paid dispatch and cannot finish", async () => {
    mocks.read.mockResolvedValue({ ok: true, report: report("PROCESSING") });
    render(
      <JourneyReportPanel lessonId="lesson" locale="es" onContinue={vi.fn()} />,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Comprobar estado" }),
    );
    await waitFor(() => expect(mocks.read).toHaveBeenCalledTimes(2));
    expect(mocks.evaluate).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Finalizar lección" }),
    ).not.toBeInTheDocument();
  });
  it("ignores late reads belonging to a previous lesson", async () => {
    let resolve!: (value: unknown) => void;
    mocks.read
      .mockImplementationOnce(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      )
      .mockResolvedValue({ ok: true, report: report("INSUFFICIENT", "en") });
    const view = render(<JourneyReportPanel lessonId="old" locale="es" />);
    view.rerender(<JourneyReportPanel lessonId="new" locale="en" />);
    await screen.findByLabelText("Overall score: —");
    await act(async () => resolve({ ok: true, report: report() }));
    expect(screen.queryByLabelText("Nota global: —")).not.toBeInTheDocument();
  });
  it("completed v2 lessons never mount legacy report generation, keep explicit redo", async () => {
    render(
      <LessonMessagesProvider messages={messages.lesson}>
        <LessonResultsView
          lessonId="lesson"
          lessonTitle="Title"
          lessonSlug="slug"
          scenarioSlug="scenario"
          journeyReport
          locale="es"
        />
      </LessonMessagesProvider>,
    );
    await screen.findByLabelText("Nota global: —");
    expect(mocks.legacy).not.toHaveBeenCalled();
    expect(mocks.evaluate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: messages.lesson.common.tryAgain }),
    ).toBeInTheDocument();
    expect(mocks.redo).not.toHaveBeenCalled();
  });
});
