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
import type { ComponentProps } from "react";
import type { HanVoiceConversation } from "@/components/ai-teacher/han-voice-conversation";
const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  seal: vi.fn(),
  voiceProps: null as ComponentProps<typeof HanVoiceConversation> | null,
  setMode: vi.fn(),
  setContext: vi.fn(),
}));
vi.mock("@/lib/actions/journey-speaking", () => ({
  startJourneySpeakingAttemptAction: mocks.start,
  sealJourneySpeakingAttemptAction: mocks.seal,
}));
vi.mock("@/components/ai-teacher/han-voice-conversation", () => ({
  HanVoiceConversation: (
    props: ComponentProps<typeof HanVoiceConversation>,
  ) => {
    mocks.voiceProps = props;
    return <div>Simulated voice</div>;
  },
}));
vi.mock("@/components/ai-teacher/ai-teacher-chat", () => ({
  AiTeacherChat: () => <div>Global Han chat</div>,
}));
vi.mock("@/components/ai-teacher/ai-teacher-provider", () => ({
  useAiTeacher: () => ({
    context: {},
    voice: "cedar",
    explanationLanguage: "ES",
    setMode: mocks.setMode,
    setContext: mocks.setContext,
    appendRealtimeMessage: vi.fn(),
  }),
}));
import { SpeakingStep } from "@/components/lesson/steps/speaking-step";
import { LessonMessagesProvider } from "@/components/lesson/lesson-messages";
import { messages } from "@/i18n/messages/es";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.start.mockResolvedValue({ ok: true, attemptId: "owned", banks: {} });
  mocks.seal.mockResolvedValue({ ok: true, attemptId: "owned" });
});
afterEach(cleanup);
function show(testMode = false, evidenceCapture = true) {
  const onContinue = vi.fn();
  const mission = {
    aiRole: "Classmate",
    learnerRole: "Learner",
    context: "Meet",
    objective: "Introduce yourself",
  } as ComponentProps<typeof SpeakingStep>["mission"];
  render(
    <LessonMessagesProvider messages={messages.lesson}>
      <SpeakingStep
        lessonId="lesson"
        locale="es"
        mission={mission}
        vocabulary={[]}
        grammar={[]}
        dialogues={[]}
        hskReference={1}
        testMode={testMode}
        evidenceCapture={evidenceCapture}
        onContinue={onContinue}
      />
    </LessonMessagesProvider>,
  );
  return onContinue;
}
async function complete() {
  await act(async () => {
    await mocks.voiceProps!.prepareJourneyAttempt?.();
  });
  await act(async () => {
    await mocks.voiceProps!.onComplete?.(
      [
        { role: "assistant", content: "你好" },
        { role: "user", content: "我叫Arean。" },
      ],
      {
        learnerTurnConfidences: [],
        speakingEvidence: [],
        closeReason: "USER_END",
        capturedTurns: [
          { role: "assistant", content: "你好" },
          { role: "user", content: "我叫Arean。" },
        ],
      },
    );
  });
}
describe("Speaking attempt save adapter", () => {
  it("a no-microphone save retry retains the same attempt and empty capture", async () => {
    mocks.seal
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValue({ ok: true, attemptId: "owned" });
    const onContinue = show();
    act(() => mocks.voiceProps!.onUnavailable?.());
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar sin evaluación oral" }),
    );
    await screen.findByRole("alert");
    expect(onContinue).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar sin evaluación oral" }),
    );
    await waitFor(() =>
      expect(onContinue).toHaveBeenCalledExactlyOnceWith({
        journeySpeakingAttemptId: "owned",
      }),
    );
    expect(mocks.start).toHaveBeenCalledTimes(1);
    expect(mocks.seal.mock.calls[1]).toEqual(mocks.seal.mock.calls[0]);
  });
  it("unavailable voice seals an empty technical attempt, never opens Tutor history or fabricates oral evidence", async () => {
    const onContinue = show();
    act(() => mocks.voiceProps!.onUnavailable?.());
    expect(
      screen.getByText(messages.lesson.speaking.captureUnavailable),
    ).toBeVisible();
    expect(screen.queryByText("Global Han chat")).not.toBeInTheDocument();
    expect(
      screen.queryByText(messages.lesson.speaking.microphoneUnavailable),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Continuar sin evaluación oral" }),
    );
    await waitFor(() =>
      expect(onContinue).toHaveBeenCalledWith({
        journeySpeakingAttemptId: "owned",
      }),
    );
    expect(mocks.seal).toHaveBeenCalledWith({
      attemptId: "owned",
      lessonId: "lesson",
      closeReason: "TECHNICAL_FAILURE",
      turns: [],
    });
    expect(mocks.start).toHaveBeenCalledTimes(1);
  });
  it("uses the route locale, does not change Tutor context and forwards only a sealed attempt ID", async () => {
    const onContinue = show();
    await complete();
    expect(mocks.start).toHaveBeenCalledWith(
      expect.objectContaining({
        lessonId: "lesson",
        locale: "es",
        requestKey: expect.any(String),
      }),
    );
    expect(mocks.seal).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptId: "owned",
        lessonId: "lesson",
        closeReason: "USER_END",
      }),
    );
    expect(mocks.setContext).not.toHaveBeenCalled();
    expect(mocks.setMode).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onContinue).toHaveBeenCalledWith({
      journeySpeakingAttemptId: "owned",
    });
  });
  it("does not falsely say saved; retry submits the same sealed payload without a new session or AI", async () => {
    mocks.seal.mockResolvedValueOnce({ ok: false, code: "UNAVAILABLE" });
    show();
    await complete();
    expect(
      screen.getByText(messages.lesson.speaking.captureFailed),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Reintentar guardado" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled(),
    );
    expect(mocks.seal.mock.calls[1]![0]).toEqual(mocks.seal.mock.calls[0]![0]);
    expect(mocks.start).toHaveBeenCalledTimes(1);
  });
  it("leaves rollout off by default and local QA does not save a real attempt or legacy history", async () => {
    show(false, false);
    expect(mocks.voiceProps!.prepareJourneyAttempt).toBeUndefined();
    cleanup();
    show(true, true);
    expect(mocks.voiceProps!.prepareJourneyAttempt).toBeUndefined();
    expect(mocks.voiceProps!.saveConversationHistory).toBe(false);
    await act(async () => {
      await mocks.voiceProps!.onComplete?.([], {
        learnerTurnConfidences: [],
        speakingEvidence: [],
      });
    });
    expect(mocks.start).not.toHaveBeenCalled();
    expect(mocks.seal).not.toHaveBeenCalled();
  });
});
