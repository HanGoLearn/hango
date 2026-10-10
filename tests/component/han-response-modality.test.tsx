// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const actionMocks = vi.hoisted(() => ({
  sendAiTeacherMessageAction: vi.fn(),
  resetAiTeacherConversationAction: vi.fn(),
  updateHanAudioSettingsAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/dashboard",
}));

vi.mock("@/lib/actions/ai-teacher", () => ({
  sendAiTeacherMessageAction: actionMocks.sendAiTeacherMessageAction,
  resetAiTeacherConversationAction:
    actionMocks.resetAiTeacherConversationAction,
}));

vi.mock("@/lib/actions/settings", () => ({
  updateHanAudioSettingsAction: actionMocks.updateHanAudioSettingsAction,
}));

vi.mock("@/components/ai-teacher/han-voice-input", () => ({
  HanVoiceInput: ({
    onTranscript,
  }: {
    onTranscript: (
      transcript: string,
      evidence: {
        targetHanzi: string;
        targetPinyin: string;
        attempt: number;
        overallToneScore: number;
        syllables: Array<{
          pinyin: string;
          toneNumber: 1 | 2 | 3 | 4 | 5;
          score: number;
        }>;
        rhythm: {
          durationSeconds: number;
          syllablesPerSecond: number;
          longestInternalPauseMs: number;
          observation: "connected";
          confidence: "useful";
        };
      } | null,
    ) => void;
  }) => (
    <>
      <button type="button" onClick={() => onTranscript("你好", null)}>
        Send recorded voice
      </button>
      <button
        type="button"
        onClick={() =>
          onTranscript("你好", {
            targetHanzi: "你好",
            targetPinyin: "nǐ hǎo",
            attempt: 1,
            overallToneScore: 72,
            syllables: [
              { pinyin: "nǐ", toneNumber: 2, score: 80 },
              { pinyin: "hǎo", toneNumber: 3, score: 64 },
            ],
            rhythm: {
              durationSeconds: 1.1,
              syllablesPerSecond: 1.82,
              longestInternalPauseMs: 120,
              observation: "connected",
              confidence: "useful",
            },
          })
        }
      >
        Send pronunciation attempt
      </button>
    </>
  ),
}));

vi.mock("@/components/ai-teacher/han-voice-conversation", () => ({
  HanVoiceConversation: () => null,
}));

vi.mock("@/components/ai-teacher/han-speech-button", () => ({
  HanSpeechButton: ({
    text,
    autoPlay,
    speechStyle,
  }: {
    text: string;
    autoPlay?: boolean;
    speechStyle?: "tutor" | "companion";
  }) => (
    <button
      type="button"
      aria-label={`Playback for ${text}`}
      data-auto-play={String(Boolean(autoPlay))}
      data-speech-style={speechStyle}
    />
  ),
}));

import { AiTeacherChat } from "@/components/ai-teacher/ai-teacher-chat";
import { AiTeacherProvider } from "@/components/ai-teacher/ai-teacher-provider";
import { HanVoiceReplyToggle } from "@/components/settings/han-audio-settings";
import { messages as englishMessages } from "@/i18n/messages/en";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Han Tutor response modality", () => {
  it("keeps Tutor and Companion speech styles separated at the playback boundary", () => {
    const { unmount } = render(
      <AiTeacherProvider
        initialMessages={[
          { id: "tutor-answer", role: "ASSISTANT", content: "Tutor answer" },
        ]}
      >
        <AiTeacherChat voiceEnabled={false} />
      </AiTeacherProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Playback for Tutor answer" }),
    ).toHaveAttribute("data-speech-style", "tutor");
    unmount();

    render(
      <AiTeacherProvider
        initialMode="PRACTICE"
        initialMessages={[
          {
            id: "companion-answer",
            role: "ASSISTANT",
            content: "Companion answer",
          },
        ]}
      >
        <AiTeacherChat voiceEnabled={false} />
      </AiTeacherProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Playback for Companion answer" }),
    ).toHaveAttribute("data-speech-style", "companion");
  });

  it("keeps typed replies silent and speaks recorded-voice replies while showing both", async () => {
    actionMocks.sendAiTeacherMessageAction.mockImplementation(
      async (message: string) => ({
        ok: true,
        reply: message === "typed question" ? "typed answer" : "voice answer",
        responseLanguage: "English",
      }),
    );

    render(
      <AiTeacherProvider>
        <AiTeacherChat voiceEnabled={false} />
      </AiTeacherProvider>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Message Han" }), {
      target: { value: "typed question" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    const typedPlayback = await screen.findByRole("button", {
      name: "Playback for typed answer",
    });
    expect(screen.getByText("typed answer")).toBeInTheDocument();
    expect(typedPlayback).toHaveAttribute("data-auto-play", "false");
    expect(typedPlayback).toHaveAttribute("data-speech-style", "tutor");

    fireEvent.click(
      screen.getByRole("button", { name: "Send recorded voice" }),
    );

    const voicePlayback = await screen.findByRole("button", {
      name: "Playback for voice answer",
    });
    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("voice answer")).toBeInTheDocument();
    expect(voicePlayback).toHaveAttribute("data-auto-play", "true");
    await waitFor(() =>
      expect(actionMocks.sendAiTeacherMessageAction).toHaveBeenCalledTimes(2),
    );
  });

  it("replaces the old three-mode selector with one automatic-playback toggle", async () => {
    actionMocks.updateHanAudioSettingsAction.mockResolvedValue(undefined);

    render(
      <HanVoiceReplyToggle
        initialEnabled
        messages={englishMessages.settings.han}
      />,
    );

    const toggle = screen.getByRole("switch", {
      name: "Play the reply after I speak",
    });
    expect(toggle).toBeChecked();
    expect(screen.queryByText("Text only")).not.toBeInTheDocument();
    expect(screen.queryByText("Text and audio")).not.toBeInTheDocument();
    expect(screen.queryByText("Audio only")).not.toBeInTheDocument();

    fireEvent.click(toggle);

    await waitFor(() =>
      expect(actionMocks.updateHanAudioSettingsAction).toHaveBeenCalledWith(
        "TEXT_ONLY",
        "cedar",
      ),
    );
    expect(toggle).not.toBeChecked();
  });

  it("passes local tone and rhythm evidence privately to the same Han Tutor turn", async () => {
    actionMocks.sendAiTeacherMessageAction.mockResolvedValue({
      ok: true,
      reply: "El segundo tono ya sube; une un poco más las dos sílabas.",
      responseLanguage: "Spanish",
    });

    render(
      <AiTeacherProvider>
        <AiTeacherChat voiceEnabled={false} />
      </AiTeacherProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Send pronunciation attempt" }),
    );

    await waitFor(() =>
      expect(actionMocks.sendAiTeacherMessageAction).toHaveBeenCalledWith(
        "你好",
        expect.objectContaining({
          pronunciationAttempt: expect.objectContaining({
            targetHanzi: "你好",
            targetPinyin: "nǐ hǎo",
            attempt: 1,
            overallToneScore: 72,
          }),
        }),
        "TUTOR",
      ),
    );
    expect(
      await screen.findByText(
        "El segundo tono ya sube; une un poco más las dos sílabas.",
      ),
    ).toBeInTheDocument();
  });

  it("can mute automatic playback after a recorded voice turn", async () => {
    actionMocks.sendAiTeacherMessageAction.mockResolvedValue({
      ok: true,
      reply: "visible muted answer",
      responseLanguage: "English",
    });

    render(
      <AiTeacherProvider initialAutoPlayVoiceReplies={false}>
        <AiTeacherChat voiceEnabled={false} />
      </AiTeacherProvider>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Send recorded voice" }),
    );

    const playback = await screen.findByRole("button", {
      name: "Playback for visible muted answer",
    });
    expect(screen.getByText("visible muted answer")).toBeInTheDocument();
    expect(playback).toHaveAttribute("data-auto-play", "false");
  });
});
