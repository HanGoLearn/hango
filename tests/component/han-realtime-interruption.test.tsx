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

const actionMocks = vi.hoisted(() => ({
  getHanOnDemandAppContextAction: vi.fn(),
  saveRealtimeConversationMessageAction: vi.fn(),
  saveRealtimeConversationTurnAction: vi.fn(),
  saveRealtimeSpeakingEvidenceAction: vi.fn(),
}));

vi.mock("@/lib/actions/ai-teacher", () => actionMocks);

import { HanVoiceConversation } from "@/components/ai-teacher/han-voice-conversation";

class FakeDataChannel {
  readyState: RTCDataChannelState = "connecting";
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  sent: Array<{ type: string; [key: string]: unknown }> = [];

  send(payload: string) {
    this.sent.push(JSON.parse(payload) as { type: string });
  }

  open() {
    this.readyState = "open";
    this.onopen?.();
  }

  emit(payload: object) {
    this.onmessage?.({ data: JSON.stringify(payload) } as MessageEvent<string>);
  }

  close() {
    this.readyState = "closed";
  }
}

class FakePeerConnection {
  static instances: FakePeerConnection[] = [];

  readonly channel = new FakeDataChannel();
  connectionState: RTCPeerConnectionState = "connected";
  ontrack: ((event: RTCTrackEvent) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  setRemoteDescription = vi.fn().mockResolvedValue(undefined);
  setLocalDescription = vi.fn().mockResolvedValue(undefined);

  constructor() {
    FakePeerConnection.instances.push(this);
  }

  addTrack() {}
  createDataChannel() {
    return this.channel as unknown as RTCDataChannel;
  }
  createOffer() {
    return Promise.resolve({
      type: "offer",
      sdp: "offer-sdp",
    } as RTCSessionDescriptionInit);
  }
  getReceivers() {
    return [];
  }
  getSenders() {
    return [];
  }
  close() {
    this.connectionState = "closed";
  }
}

const audioTrack = {
  enabled: false,
  stop: vi.fn(),
};
const stream = {
  getTracks: () => [audioTrack],
  getAudioTracks: () => [audioTrack],
} as unknown as MediaStream;
const audioInstances: Array<{
  autoplay: boolean;
  muted: boolean;
  srcObject: MediaStream | null;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
}> = [];

beforeEach(() => {
  vi.clearAllMocks();
  FakePeerConnection.instances = [];
  audioInstances.length = 0;
  audioTrack.enabled = false;
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue(stream) },
  });
  Object.defineProperty(window, "RTCPeerConnection", {
    configurable: true,
    value: FakePeerConnection,
  });
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
    configurable: true,
    value: vi.fn(() => true),
  });
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
  vi.stubGlobal(
    "Audio",
    class {
      autoplay = false;
      muted = false;
      srcObject: MediaStream | null = null;
      pause = vi.fn();
      play = vi.fn().mockResolvedValue(undefined);
      load() {}

      constructor() {
        audioInstances.push(this);
      }
    },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          sdp: "answer-sdp",
          instructions: "You are Han.",
          speechSpeed: 1,
        }),
      ),
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function startHanRealtimeConversation(
  mode: "TUTOR" | "PRACTICE" = "PRACTICE",
) {
  render(
    <HanVoiceConversation
      disabled={false}
      voice="cedar"
      explanationLanguage="ES"
      mode={mode}
      context={{}}
      open
      appendMessage={vi.fn()}
      onActiveChange={vi.fn()}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Start live conversation" }),
  );
  await waitFor(() => expect(FakePeerConnection.instances).toHaveLength(1));
  const peer = FakePeerConnection.instances[0];
  if (!peer) throw new Error("Expected a Realtime peer connection");
  await waitFor(() => expect(peer.setRemoteDescription).toHaveBeenCalled());

  await act(async () => peer.channel.open());
  await act(async () =>
    peer.channel.emit({
      type: "session.updated",
      session: { instructions: "You are Han." },
    }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", {
        name: "Hold to talk, then release to send",
      }),
    ).toBeEnabled(),
  );
  return peer;
}

describe("Han Realtime push-to-talk interruption", () => {
  it("completes a token-limited Tutor explanation once and reports a second cutoff", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const peer = await startHanRealtimeConversation("TUTOR");
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "Explain how I can use 把 in a sentence.",
      }),
    );
    const before = peer.channel.sent.filter(
      (event) => event.type === "response.create",
    ).length;
    expect(before).toBe(1);
    const cutoff = {
      type: "response.done",
      response: {
        status: "incomplete",
        status_details: { reason: "max_output_tokens" },
      },
    };
    await act(async () => peer.channel.emit(cutoff));
    expect(
      peer.channel.sent.filter((event) => event.type === "response.create"),
    ).toHaveLength(before + 1);
    expect(JSON.stringify(peer.channel.sent)).toContain("exact stopping point");
    expect(peer.channel.sent.at(-1)).toMatchObject({
      response: { max_output_tokens: 1200 },
    });
    await act(async () => peer.channel.emit(cutoff));
    expect(
      peer.channel.sent.filter((event) => event.type === "response.create"),
    ).toHaveLength(before + 1);
    expect(
      screen.getAllByText(/Han's response was interrupted/).length,
    ).toBeGreaterThan(0);
    warning.mockRestore();
  });

  it("never resumes a cancelled Tutor response", async () => {
    const peer = await startHanRealtimeConversation("TUTOR");
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "Explain how I can use 把 in a sentence.",
      }),
    );
    const before = peer.channel.sent.filter(
      (event) => event.type === "response.create",
    ).length;
    await act(async () =>
      peer.channel.emit({
        type: "response.done",
        response: {
          status: "cancelled",
          status_details: { reason: "client_cancelled" },
        },
      }),
    );
    expect(
      peer.channel.sent.filter((event) => event.type === "response.create"),
    ).toHaveLength(before);
  });
  it("stops active generation and preserves the learner microphone through response.done", async () => {
    const peer = await startHanRealtimeConversation();

    await act(async () => {
      peer.channel.emit({ type: "response.created" });
      peer.channel.emit({ type: "response.output_audio.delta" });
    });
    const interruptButton = await screen.findByRole("button", {
      name: "Hold to interrupt Han and speak",
    });
    expect(interruptButton).toBeEnabled();

    fireEvent.pointerDown(interruptButton, {
      button: 0,
      pointerId: 1,
      pointerType: "touch",
    });

    expect(peer.channel.sent.slice(-3)).toEqual([
      { type: "input_audio_buffer.clear" },
      { type: "response.cancel" },
      { type: "output_audio_buffer.clear" },
    ]);
    expect(audioTrack.enabled).toBe(true);
    expect(audioInstances[0]?.muted).toBe(true);
    expect(
      screen.getByRole("button", { name: "Release to send your voice" }),
    ).toHaveAttribute("aria-pressed", "true");

    await act(async () =>
      peer.channel.emit({ type: "response.output_audio.delta" }),
    );
    expect(audioTrack.enabled).toBe(true);
    expect(
      screen.getByRole("button", { name: "Release to send your voice" }),
    ).toHaveAttribute("aria-pressed", "true");

    await act(async () => peer.channel.emit({ type: "response.done" }));
    expect(audioTrack.enabled).toBe(true);
    expect(
      screen.getByRole("button", { name: "Release to send your voice" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("clears speech that is still playing after generation already finished", async () => {
    const peer = await startHanRealtimeConversation();

    await act(async () => {
      peer.channel.emit({ type: "response.created" });
      peer.channel.emit({ type: "response.output_audio.delta" });
      peer.channel.emit({ type: "response.done" });
    });
    const interruptButton = await screen.findByRole("button", {
      name: "Hold to interrupt Han and speak",
    });
    expect(interruptButton).toBeEnabled();

    fireEvent.pointerDown(interruptButton, {
      button: 0,
      pointerId: 2,
      pointerType: "touch",
    });

    expect(peer.channel.sent.slice(-2)).toEqual([
      { type: "input_audio_buffer.clear" },
      { type: "output_audio_buffer.clear" },
    ]);
    expect(audioTrack.enabled).toBe(true);
    expect(audioInstances[0]?.muted).toBe(true);
    expect(
      screen.getByRole("button", { name: "Release to send your voice" }),
    ).toHaveAttribute("aria-pressed", "true");

    await act(async () =>
      peer.channel.emit({ type: "output_audio_buffer.stopped" }),
    );
    expect(audioTrack.enabled).toBe(true);
    expect(
      screen.getByRole("button", { name: "Release to send your voice" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
