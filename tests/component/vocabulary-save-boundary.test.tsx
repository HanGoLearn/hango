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
const mocks = vi.hoisted(() => ({ save: vi.fn(), seen: vi.fn() }));
vi.mock("@/lib/actions/vocabulary-interactivity", () => ({
  recordVocabularyQuizAttemptsAction: mocks.save,
  recordVocabularyWordSeenAction: mocks.seen,
  getVocabularyItemAudioAction: vi.fn(),
  getVocabularyExampleAudioAction: vi.fn(),
}));
vi.mock("@/components/ai-teacher/han-speech-button", () => ({
  HanSpeechButton: () => null,
}));
vi.mock("@/components/lesson/audio-play-button", () => ({
  AudioPlayButton: () => null,
}));
vi.mock("@/components/lesson/ask-ai-button", () => ({
  AskAiButton: () => null,
}));
import { VocabularyStep } from "@/components/lesson/steps/vocabulary-step";
import { LessonMessagesProvider } from "@/components/lesson/lesson-messages";
import { LessonDisplayPrefsProvider } from "@/components/lesson/lesson-display-prefs";
import { messages } from "@/i18n/messages/es";
import type { LessonWithContent } from "@/lib/content/lesson-data";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.seen.mockResolvedValue(undefined);
});
afterEach(cleanup);
function show() {
  const onContinue = vi.fn();
  const vocabulary = [
    {
      vocabularyItem: {
        id: "word",
        chineseForm: "你好",
        pinyin: "nǐ hǎo",
        meaning: "Hola",
        examples: [],
      },
    },
    {
      vocabularyItem: {
        id: "word-2",
        chineseForm: "再见",
        pinyin: "zài jiàn",
        meaning: "Adiós",
        examples: [],
      },
    },
  ] as unknown as LessonWithContent["vocabulary"];
  render(
    <LessonMessagesProvider messages={messages.lesson}>
      <LessonDisplayPrefsProvider>
        <VocabularyStep
          vocabulary={vocabulary}
          lessonId="lesson"
          difficulty="BEGINNER"
          onContinue={onContinue}
        />
      </LessonDisplayPrefsProvider>
    </LessonMessagesProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Prueba rápida" }));
  fireEvent.click(screen.getByRole("button", { name: "Hola" }));
  fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
  fireEvent.click(screen.getByRole("button", { name: "Adiós" }));
  return onContinue;
}
describe("Vocabulary acknowledgment before leaving", () => {
  it("quick-test pass waits for its answers to be stored", async () => {
    let resolve!: () => void;
    mocks.save.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const onContinue = show();
    fireEvent.click(
      screen.getByRole("button", { name: "Terminar prueba rápida" }),
    );
    expect(onContinue).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Terminar prueba rápida" }),
    ).toBeDisabled();
    await act(async () => resolve());
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(mocks.save).toHaveBeenCalledExactlyOnceWith("lesson", [
      expect.objectContaining({ questionKey: "word:quicktest" }),
      expect.objectContaining({ questionKey: "word-2:quicktest" }),
    ]);
  });
  it("retains failed answers and retries without inventing a pass or advancing", async () => {
    mocks.save
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const onContinue = show();
    fireEvent.click(
      screen.getByRole("button", { name: "Terminar prueba rápida" }),
    );
    await screen.findByRole("alert");
    expect(onContinue).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Terminar prueba rápida" }),
    );
    await waitFor(() => expect(onContinue).toHaveBeenCalledTimes(1));
    expect(mocks.save.mock.calls[1]).toEqual(mocks.save.mock.calls[0]);
  });
});
