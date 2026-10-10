// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

const actionMocks = vi.hoisted(() => ({
  transcribeHanMessageAction: vi.fn(),
}));

vi.mock("@/lib/actions/ai-teacher", () => ({
  transcribeHanMessageAction: actionMocks.transcribeHanMessageAction,
}));

import { HanVoiceInput } from "@/components/ai-teacher/han-voice-input";
import { AudioRecorder } from "@/components/speaking/audio-recorder";
import { messages as englishMessages } from "@/i18n/messages/en";

const getUserMedia = vi.fn();
const stopTrack = vi.fn();
const stream = {
  getTracks: () => [{ stop: stopTrack }],
} as unknown as MediaStream;

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];

  mimeType = "audio/webm";
  state: RecordingState = "inactive";
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(_stream: MediaStream) {
    FakeMediaRecorder.instances.push(this);
  }

  start() {
    this.state = "recording";
  }

  stop() {
    this.state = "inactive";
    this.ondataavailable?.({
      data: new Blob(["recorded audio"], { type: this.mimeType }),
    } as BlobEvent);
    this.onstop?.();
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  FakeMediaRecorder.instances = [];
  getUserMedia.mockResolvedValue(stream);
  actionMocks.transcribeHanMessageAction.mockResolvedValue({
    ok: true,
    transcript: "你好",
  });
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  Object.defineProperty(window, "MediaRecorder", {
    configurable: true,
    value: FakeMediaRecorder,
  });
  Object.defineProperty(globalThis, "MediaRecorder", {
    configurable: true,
    value: FakeMediaRecorder,
  });
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:recording"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
});

describe("press-and-hold voice controls", () => {
  it("records in Speaking only while the pointer is held", async () => {
    render(
      <AudioRecorder
        onSubmitRecording={vi.fn().mockResolvedValue(true)}
        onSubmitText={vi.fn().mockResolvedValue(true)}
        messages={englishMessages.speakingLab.recorder}
      />,
    );

    const recordButton = screen.getByRole("button", {
      name: "Hold to record",
    });
    fireEvent.pointerDown(recordButton, {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Release to stop recording" }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
    expect(FakeMediaRecorder.instances[0]?.state).toBe("recording");

    fireEvent.pointerUp(recordButton, {
      button: 0,
      pointerId: 1,
      pointerType: "mouse",
    });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Submit" })).toBeEnabled(),
    );
    expect(FakeMediaRecorder.instances[0]?.state).toBe("inactive");
    expect(stopTrack).toHaveBeenCalled();
  });

  it("does not create an empty attempt when permission arrives after release", async () => {
    let resolvePermission!: (value: MediaStream) => void;
    getUserMedia.mockReturnValueOnce(
      new Promise<MediaStream>((resolve) => {
        resolvePermission = resolve;
      }),
    );
    render(
      <AudioRecorder
        onSubmitRecording={vi.fn().mockResolvedValue(true)}
        onSubmitText={vi.fn().mockResolvedValue(true)}
        messages={englishMessages.speakingLab.recorder}
      />,
    );

    const recordButton = screen.getByRole("button", {
      name: "Hold to record",
    });
    fireEvent.pointerDown(recordButton, {
      button: 0,
      pointerId: 2,
      pointerType: "touch",
    });
    fireEvent.pointerUp(recordButton, {
      button: 0,
      pointerId: 2,
      pointerType: "touch",
    });
    await act(async () => resolvePermission(stream));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Hold to record" }),
      ).toHaveAttribute("aria-pressed", "false"),
    );
    expect(FakeMediaRecorder.instances).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Submit" })).toBeNull();
    expect(stopTrack).toHaveBeenCalled();
  });

  it("records and transcribes Han input when the hold is released", async () => {
    const onTranscript = vi.fn();
    render(
      <HanVoiceInput
        disabled={false}
        context={{}}
        pronunciationTarget={null}
        onTranscript={onTranscript}
      />,
    );

    const recordButton = screen.getByRole("button", {
      name: "Hold to speak to Han",
    });
    fireEvent.pointerDown(recordButton, {
      button: 0,
      pointerId: 3,
      pointerType: "mouse",
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Release to stop recording" }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
    fireEvent.pointerUp(recordButton, {
      button: 0,
      pointerId: 3,
      pointerType: "mouse",
    });

    await waitFor(() =>
      expect(actionMocks.transcribeHanMessageAction).toHaveBeenCalledOnce(),
    );
    await waitFor(() =>
      expect(onTranscript).toHaveBeenCalledWith("你好", null),
    );
    expect(
      screen.getByRole("button", { name: "Hold to speak to Han" }),
    ).toBeEnabled();
  });

  it("ignores an ordinary click without a hold gesture", () => {
    render(
      <HanVoiceInput
        disabled={false}
        context={{}}
        pronunciationTarget={null}
        onTranscript={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Hold to speak to Han" }),
    );
    expect(getUserMedia).not.toHaveBeenCalled();
  });
});
