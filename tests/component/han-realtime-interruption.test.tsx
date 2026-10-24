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
import * as turnGuard from "@/lib/speech/realtime-turn-guard";
import {
  JOURNEY_SESSION_AUDIO_PHASE,
  JOURNEY_SESSION_AUDIO_VERSION,
  JOURNEY_SESSION_AUDIO_TIMEOUT_MS,
} from "@/lib/journey-session-audio-review";
import { sessionAudioJudgment } from "../fixtures/journey-session-audio";
import {
  buildJourneySpeakingLevel,
  type JourneyAudioLessonContext,
} from "@/lib/journey-speaking-level";
import {
  JOURNEY_BANK_VERSION,
  type JourneySpeakingBanks,
} from "@/lib/content/journey-speaking-banks";

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
  actionMocks.saveRealtimeConversationTurnAction.mockResolvedValue(undefined);
  actionMocks.saveRealtimeConversationMessageAction.mockResolvedValue(
    undefined,
  );
  actionMocks.saveRealtimeSpeakingEvidenceAction.mockResolvedValue(undefined);
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
  vi.useRealTimers();
  vi.restoreAllMocks();
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

async function startJourneyRealtimeConversation(
  timed = false,
  lessonId?: string,
  captureBank?: JourneySpeakingBanks,
  sessionAudio = false,
  audioContext?: JourneyAudioLessonContext,
) {
  const appendMessage = vi.fn();
  const onComplete = vi.fn();
  const onAbandon = vi.fn();
  const prepare = vi
    .fn()
    .mockResolvedValue({ attemptId: "owned-attempt", banks: captureBank });
  if (captureBank)
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          sdp: "answer-sdp",
          instructions: "You are Han.",
          speechSpeed: 0.9,
          journeyAttemptId: "owned-attempt",
          journeySpeakingBanks: captureBank,
          ...(sessionAudio
            ? {
                journeySessionAudioReview: {
                  version: JOURNEY_SESSION_AUDIO_VERSION,
                  locale: "es",
                  ...(audioContext ? { context: audioContext } : {}),
                },
              }
            : {}),
        }),
    } as Response);
  render(
    <HanVoiceConversation
      disabled={false}
      voice="cedar"
      explanationLanguage="ES"
      mode="PRACTICE"
      usageSurface="JOURNEY"
      variant="immersive"
      roleLabel="Nuevo compañero de clase"
      naturalCloseAfterMs={timed ? 75_000 : undefined}
      maxSessionMs={timed ? 87_000 : undefined}
      onComplete={onComplete}
      prepareJourneyAttempt={captureBank ? prepare : undefined}
      onJourneyAbandon={onAbandon}
      context={{
        lessonId,
        speakingSurface: "JOURNEY",
        rolePlay: {
          aiRole: "Nuevo compañero de clase",
          learnerRole: "Estudiante",
          scenarioContext: "Conoces a un compañero por primera vez.",
          objective: "Saludar y presentarte con tu nombre.",
          lessonVocabulary: ["你好", "老师", "学生", "我", "叫"],
          lessonHskLevel: 1,
        },
      }}
      open
      appendMessage={appendMessage}
      onActiveChange={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Start conversation" }));
  await vi.waitFor(() => expect(FakePeerConnection.instances).toHaveLength(1));
  const peer = FakePeerConnection.instances[0]!;
  await vi.waitFor(() => expect(peer.setRemoteDescription).toHaveBeenCalled());
  await act(async () => {
    peer.channel.open();
    peer.channel.emit({
      type: "session.updated",
      session: { instructions: "You are Han." },
    });
  });
  return { peer, appendMessage, onComplete, onAbandon, prepare };
}

const capturedBank: JourneySpeakingBanks = {
  version: JOURNEY_BANK_VERSION,
  lessonId: "capture-lesson",
  lessonSlug: "greetings",
  openingLine: "你好，你叫什么名字？",
  rationale: "Introduction",
  core: { vocabulary: [], grammar: [] },
  support: { vocabulary: [], grammar: [] },
  extension: { vocabulary: [], grammar: [] },
  phraseBank: [],
  reviewIssues: [],
};

describe("Journey isolated attempt voice capture", () => {
  it("waits for the last committed audio transcript without resuming the character or losing that turn", async () => {
    vi.spyOn(turnGuard, "isLikelyLearnerUtterance").mockReturnValue(true);
    const { peer, onComplete } = await startJourneyRealtimeConversation(
      false,
      capturedBank.lessonId,
      capturedBank,
      true,
    );
    await finishJourneyCharacterTurn(peer);
    vi.useFakeTimers();
    const button = screen.getByRole("button", {
      name: "Hold to talk, then release to send",
    });
    fireEvent.keyDown(button, { key: " " });
    await act(async () => vi.advanceTimersByTimeAsync(500));
    fireEvent.keyUp(button, { key: " " });
    fireEvent.click(screen.getByRole("button", { name: "End conversation" }));
    expect(audioTrack.enabled).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
    await act(async () => {
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        item_id: "last-audio",
        transcript: "你好，我叫小明。",
        logprobs: [{ logprob: -0.2 }],
      });
      await vi.advanceTimersByTimeAsync(50);
    });
    const requests = peer.channel.sent.filter(
      (event) =>
        (event.response as { metadata?: { hango_phase?: string } })?.metadata
          ?.hango_phase === JOURNEY_SESSION_AUDIO_PHASE,
    );
    expect(requests).toHaveLength(1);
    const metadata = (requests[0]!.response as { metadata: object }).metadata;
    await act(async () => {
      peer.channel.emit({
        type: "response.created",
        response: { id: "final-review", metadata },
      });
      peer.channel.emit({
        type: "response.done",
        response: {
          id: "final-review",
          status: "completed",
          output: [
            {
              type: "function_call",
              name: "submit_journey_audio_review",
              arguments: JSON.stringify(
                sessionAudioJudgment("owned-attempt", "last-audio"),
              ),
            },
          ],
        },
      });
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]![1].quality).toMatchObject({
      pendingLearnerTurn: false,
      sessionAudio: { status: "REVIEWED", totalLearnerTurns: 1 },
    });
    expect(onComplete.mock.calls[0]![1].capturedTurns).toHaveLength(2);
  });
  it("marks pending speech incomplete when the final transcript never arrives", async () => {
    const { peer, onComplete } = await startJourneyRealtimeConversation(
      false,
      capturedBank.lessonId,
      capturedBank,
      true,
    );
    await finishJourneyCharacterTurn(peer);
    vi.useFakeTimers();
    const button = screen.getByRole("button", {
      name: "Hold to talk, then release to send",
    });
    fireEvent.keyDown(button, { key: " " });
    await act(async () => vi.advanceTimersByTimeAsync(500));
    fireEvent.keyUp(button, { key: " " });
    fireEvent.click(screen.getByRole("button", { name: "End conversation" }));
    await act(async () => vi.advanceTimersByTimeAsync(2500));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]![1].quality).toMatchObject({
      pendingLearnerTurn: true,
      sessionAudio: { status: "UNAVAILABLE", reason: "PENDING_TURN" },
    });
    expect(JSON.stringify(peer.channel.sent)).not.toContain(
      `"hango_phase":"${JOURNEY_SESSION_AUDIO_PHASE}"`,
    );
  });
  it("handles disconnection during the review immediately without a blank success or extra AI call", async () => {
    vi.spyOn(turnGuard, "isLikelyLearnerUtterance").mockReturnValue(true);
    const { peer, onComplete } = await startJourneyRealtimeConversation(
      false,
      capturedBank.lessonId,
      capturedBank,
      true,
    );
    await finishJourneyCharacterTurn(peer);
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        item_id: "audio-disconnect",
        transcript: "我叫小明。",
        logprobs: [{ logprob: -0.2 }],
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "End conversation" }));
    await act(async () => {
      peer.connectionState = "failed";
      peer.onconnectionstatechange?.();
    });
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete.mock.calls[0]![1].quality.sessionAudio).toMatchObject({
      reason: "CONNECTION_CLOSED",
      judgment: null,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("reviews audio once on End, ignores cancelled character events and forwards the result in the saved diagnostics", async () => {
    const audioContext: JourneyAudioLessonContext = {
      contextHash: "a".repeat(64),
      level: buildJourneySpeakingLevel(1, "BEGINNER", 350),
      lesson: {
        id: capturedBank.lessonId,
        slug: capturedBank.lessonSlug,
        title: "Saludos",
        difficulty: "BEGINNER",
        objective: "Saludar",
        successConditions: ["Say your own name"],
        coreVocabulary: ["叫"],
        coreGrammar: [],
      },
    };
    vi.spyOn(turnGuard, "isLikelyLearnerUtterance").mockReturnValue(true);
    const { peer, onComplete, appendMessage } =
      await startJourneyRealtimeConversation(
        false,
        capturedBank.lessonId,
        capturedBank,
        true,
        audioContext,
      );
    await finishJourneyCharacterTurn(peer, "你好，你叫什么名字？");
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        item_id: "learner-audio",
        transcript: "你好，我叫小明。",
        logprobs: [{ logprob: -0.2 }],
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "End conversation" }));
    const request = peer.channel.sent.find(
      (event) =>
        (event.response as { metadata?: { hango_phase?: string } })?.metadata
          ?.hango_phase === JOURNEY_SESSION_AUDIO_PHASE,
    )!;
    expect(request).toBeDefined();
    expect(
      (request.response as { instructions: string }).instructions,
    ).toContain("350 points");
    expect(
      (request.response as { instructions: string }).instructions,
    ).toContain("planning pauses are expected");
    expect(
      (request.response as { input: unknown[] }).input.slice(0, -1),
    ).toEqual([{ type: "item_reference", id: "learner-audio" }]);
    expect(audioTrack.enabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "End conversation" }));
    await act(async () =>
      peer.channel.emit({
        type: "response.done",
        response: { id: "character", status: "cancelled" },
      }),
    );
    expect(onComplete).not.toHaveBeenCalled();
    const metadata = (request.response as { metadata: object }).metadata;
    await act(async () => {
      peer.channel.emit({
        type: "response.created",
        response: { id: "audio-review", metadata },
      });
      peer.channel.emit({
        type: "response.done",
        response: {
          id: "audio-review",
          status: "completed",
          output: [
            {
              type: "function_call",
              name: "submit_journey_audio_review",
              arguments: JSON.stringify(
                sessionAudioJudgment("owned-attempt", "learner-audio"),
              ),
            },
          ],
        },
      });
    });
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete.mock.calls[0]![1].quality.sessionAudio).toMatchObject({
      status: "REVIEWED",
      attemptId: "owned-attempt",
      contextHash: audioContext.contextHash,
      judgment: { dimensions: { tones: { level: 3 } } },
    });
    expect(
      onComplete.mock.calls[0]![0].some((turn: { content: string }) =>
        turn.content.includes("reviewedItemIds"),
      ),
    ).toBe(false);
    expect(
      peer.channel.sent.filter(
        (event) =>
          (event.response as { metadata?: { hango_phase?: string } })?.metadata
            ?.hango_phase === JOURNEY_SESSION_AUDIO_PHASE,
      ),
    ).toHaveLength(1);
    expect(appendMessage).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("keeps the conversation on review timeout and never sends an automatic retry", async () => {
    vi.spyOn(turnGuard, "isLikelyLearnerUtterance").mockReturnValue(true);
    const { peer, onComplete } = await startJourneyRealtimeConversation(
      false,
      capturedBank.lessonId,
      capturedBank,
      true,
    );
    await finishJourneyCharacterTurn(peer);
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        item_id: "learner-audio",
        transcript: "你好，我叫小明。",
        logprobs: [{ logprob: -0.2 }],
      }),
    );
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "End conversation" }));
    await act(async () =>
      vi.advanceTimersByTimeAsync(JOURNEY_SESSION_AUDIO_TIMEOUT_MS),
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]![1].quality.sessionAudio).toMatchObject({
      status: "TIMEOUT",
      judgment: null,
    });
    expect(
      onComplete.mock.calls[0]![1].capturedTurns.some(
        (turn: { content: string }) => turn.content === "你好，我叫小明。",
      ),
    ).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("an empty audio session closes explicitly without inferring perfect pronunciation or paying for a review", async () => {
    const { peer, onComplete } = await startJourneyRealtimeConversation(
      false,
      capturedBank.lessonId,
      capturedBank,
      true,
    );
    await finishJourneyCharacterTurn(peer);
    fireEvent.click(screen.getByRole("button", { name: "End conversation" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete.mock.calls[0]![1].quality.sessionAudio).toMatchObject({
      status: "UNAVAILABLE",
      reason: "NO_AUDIO_ITEMS",
    });
    expect(JSON.stringify(peer.channel.sent)).not.toContain(
      `"hango_phase":"${JOURNEY_SESSION_AUDIO_PHASE}"`,
    );
  });
  it("binds the handshake, preserves original STT and avoids Han history and a second silent review", async () => {
    vi.spyOn(turnGuard, "isLikelyLearnerUtterance").mockReturnValue(true);
    const { peer, appendMessage, onComplete, prepare } =
      await startJourneyRealtimeConversation(
        false,
        capturedBank.lessonId,
        capturedBank,
      );
    await finishJourneyCharacterTurn(peer, "你好，你叫什么名字？");
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "我叫Arean。",
        logprobs: [{ logprob: -0.2 }],
      }),
    );
    await finishJourneyCharacterTurn(peer, "你好，Arean。");
    fireEvent.click(screen.getByRole("button", { name: "End conversation" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0]?.[1]?.headers).toMatchObject({
      "x-hango-journey-attempt-id": "owned-attempt",
    });
    const diagnostics = onComplete.mock.calls[0]![1];
    expect(diagnostics.closeReason).toBe("USER_END");
    expect(diagnostics.capturedTurns[1]).toMatchObject({
      role: "user",
      content: "我叫Arean。",
      recognition: {
        rawTranscript: "我叫Arean。",
        interpretedTranscript: "我叫Arean。",
      },
    });
    expect(appendMessage).not.toHaveBeenCalled();
    expect(
      actionMocks.saveRealtimeConversationTurnAction,
    ).not.toHaveBeenCalled();
    expect(
      actionMocks.saveRealtimeConversationMessageAction,
    ).not.toHaveBeenCalled();
    expect(
      actionMocks.saveRealtimeSpeakingEvidenceAction,
    ).not.toHaveBeenCalled();
    expect(JSON.stringify(peer.channel.sent)).not.toContain(
      '"hango_phase":"speaking_evidence"',
    );
  });
  it("seals a technical close on connection failure instead of sending the capture to Tutor fallback", async () => {
    const { peer, onComplete } = await startJourneyRealtimeConversation(
      false,
      capturedBank.lessonId,
      capturedBank,
    );
    await finishJourneyCharacterTurn(peer);
    await act(async () => {
      peer.connectionState = "failed";
      peer.onconnectionstatechange?.();
    });
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete.mock.calls[0]![1].closeReason).toBe("TECHNICAL_FAILURE");
    expect(peer.connectionState).toBe("closed");
  });
  it("requests abandonment on unmount without contaminating another conversation", async () => {
    const { peer, onAbandon, onComplete } =
      await startJourneyRealtimeConversation(
        false,
        capturedBank.lessonId,
        capturedBank,
      );
    await finishJourneyCharacterTurn(peer);
    cleanup();
    expect(onAbandon).toHaveBeenCalledTimes(1);
    expect(onAbandon.mock.calls[0]![1].closeReason).toBe("ABANDONED");
    expect(onComplete).not.toHaveBeenCalled();
    expect(peer.connectionState).toBe("closed");
  });
  it("marks pending learner audio and interrupted character playback as capture limitations", async () => {
    const { peer, onComplete } = await startJourneyRealtimeConversation(
      false,
      capturedBank.lessonId,
      capturedBank,
    );
    await finishJourneyCharacterTurn(peer);
    await act(async () => {
      peer.channel.emit({ type: "response.created" });
      peer.channel.emit({ type: "response.output_audio.delta" });
    });
    const button = screen.getByRole("button", {
      name: "Hold to interrupt Han and speak",
    });
    fireEvent.keyDown(button, { key: " " });
    fireEvent.click(screen.getByRole("button", { name: "End conversation" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete.mock.calls[0]![1].quality).toEqual({
      pendingLearnerTurn: true,
      interruptedAssistant: true,
    });
  });
});

async function finishJourneyCharacterTurn(
  peer: FakePeerConnection,
  text = "你好。",
) {
  await act(async () => {
    peer.channel.emit({ type: "response.created" });
    peer.channel.emit({
      type: "response.output_audio_transcript.done",
      transcript: text,
    });
    peer.channel.emit({
      type: "response.done",
      response: { status: "completed" },
    });
    peer.channel.emit({ type: "output_audio_buffer.stopped" });
  });
}

const closingResponses = (peer: FakePeerConnection) =>
  peer.channel.sent.filter(
    (event) =>
      event.type === "response.create" &&
      JSON.stringify(event).includes('"hango_phase":"closing"'),
  );

describe("Journey bounded natural closing", () => {
  beforeEach(() =>
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "setInterval",
        "clearInterval",
        "Date",
        "performance",
      ],
    }),
  );

  it("does not open a new topic in the last 20 seconds", async () => {
    const { peer } = await startJourneyRealtimeConversation(true);
    await finishJourneyCharacterTurn(peer);
    await act(async () => vi.advanceTimersByTimeAsync(55_000));
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "我是老师。",
      }),
    );
    const guard = JSON.stringify(peer.channel.sent.at(-2));
    expect(guard).toContain("PREPARING TO CLOSE");
    expect(guard).toContain("Introduce NO new topic");
    expect(closingResponses(peer)).toHaveLength(0);
  });

  it("protects a held last turn and waits for its transcription before a single contextual goodbye", async () => {
    vi.spyOn(turnGuard, "isLikelyLearnerUtterance").mockReturnValue(true);
    const { peer, onComplete } = await startJourneyRealtimeConversation(true);
    await finishJourneyCharacterTurn(peer);
    await act(async () => vi.advanceTimersByTimeAsync(74_500));
    const button = screen.getByRole("button", {
      name: "Hold to talk, then release to send",
    });
    fireEvent.keyDown(button, { key: " " });
    expect(audioTrack.enabled).toBe(true);
    await act(async () => vi.advanceTimersByTimeAsync(800));
    expect(audioTrack.enabled).toBe(true);
    expect(closingResponses(peer)).toHaveLength(0);
    fireEvent.keyUp(button, { key: " " });
    expect(audioTrack.enabled).toBe(false);
    expect(peer.channel.sent.at(-1)?.type).toBe("input_audio_buffer.commit");
    expect(closingResponses(peer)).toHaveLength(0);
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "你叫什么名字？",
      }),
    );
    expect(closingResponses(peer)).toHaveLength(1);
    expect(JSON.stringify(closingResponses(peer)[0])).toContain("你叫什么名字");
    expect(JSON.stringify(closingResponses(peer)[0])).toContain(
      "answer it briefly first",
    );
    await act(async () => {
      peer.channel.emit({ type: "response.created" });
      peer.channel.emit({
        type: "response.done",
        response: { status: "completed" },
      });
    });
    expect(onComplete).not.toHaveBeenCalled();
    expect(peer.connectionState).not.toBe("closed");
    await act(async () =>
      peer.channel.emit({ type: "output_audio_buffer.stopped" }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(8_000));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(peer.connectionState).toBe("closed");
    expect(audioTrack.stop).toHaveBeenCalled();
  });

  it("does not overlap a goodbye with queued character playback", async () => {
    const { peer } = await startJourneyRealtimeConversation(true);
    await act(async () => {
      peer.channel.emit({ type: "response.created" });
      peer.channel.emit({ type: "output_audio_buffer.started" });
      peer.channel.emit({
        type: "response.done",
        response: { status: "completed" },
      });
    });
    // No stopped event: generation finished, but playback is still pending.
    await act(async () => vi.advanceTimersByTimeAsync(7_000));
    // Move near the practice boundary after completing the opening playback.
    await act(async () =>
      peer.channel.emit({ type: "output_audio_buffer.stopped" }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(67_000));
    await act(async () => {
      peer.channel.emit({ type: "response.created" });
      peer.channel.emit({ type: "output_audio_buffer.started" });
      peer.channel.emit({
        type: "response.done",
        response: { status: "completed" },
      });
    });
    await act(async () => vi.advanceTimersByTimeAsync(1_100));
    expect(closingResponses(peer)).toHaveLength(0);
    await act(async () =>
      peer.channel.emit({ type: "output_audio_buffer.stopped" }),
    );
    expect(closingResponses(peer)).toHaveLength(1);
  });

  it("stops End immediately, preserves partial dialogue and ignores late voice events", async () => {
    const { peer, onComplete } = await startJourneyRealtimeConversation(true);
    await act(async () => {
      peer.channel.emit({ type: "response.created" });
      peer.channel.emit({
        type: "response.output_audio_transcript.done",
        transcript: "你好。",
      });
    });
    fireEvent.click(screen.getByRole("button", { name: "End conversation" }));
    expect(audioInstances[0]?.muted).toBe(true);
    expect(audioTrack.enabled).toBe(false);
    await act(async () => {});
    expect(peer.connectionState).toBe("closed");
    expect(closingResponses(peer)).toHaveLength(0);
    await act(async () =>
      peer.channel.emit({ type: "response.output_audio.delta" }),
    );
    expect(audioTrack.enabled).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]?.[0]).toEqual([
      { role: "assistant", content: "你好。" },
    ]);
  });

  it("has a finite hard stop even when the learner never releases", async () => {
    const { peer, onComplete } = await startJourneyRealtimeConversation(true);
    await finishJourneyCharacterTurn(peer);
    fireEvent.keyDown(
      screen.getByRole("button", {
        name: "Hold to talk, then release to send",
      }),
      { key: " " },
    );
    await act(async () => vi.advanceTimersByTimeAsync(87_000));
    expect(peer.connectionState).toBe("closed");
    expect(audioTrack.enabled).toBe(false);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(closingResponses(peer)).toHaveLength(0);
  });

  it("allows brief ES/EN help and detects explicit exit, not bare 再见", async () => {
    const { peer } = await startJourneyRealtimeConversation(true);
    await finishJourneyCharacterTurn(peer);
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "¿Cómo se dice dormir en chino?",
      }),
    );
    expect(JSON.stringify(peer.channel.sent.at(-2))).toContain(
      "Answer in Spanish",
    );
    expect(closingResponses(peer)).toHaveLength(0);
    await finishJourneyCharacterTurn(peer, "睡觉。");
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "再见是什么意思？",
      }),
    );
    expect(closingResponses(peer)).toHaveLength(0);
    expect(JSON.stringify(peer.channel.sent.at(-2))).toContain(
      "Answer in Spanish",
    );
    await finishJourneyCharacterTurn(peer, "Adiós.");
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "Quiero terminar la conversación.",
      }),
    );
    expect(closingResponses(peer)).toHaveLength(1);
  });

  it("closes a discarded silent last press without recording invented speech", async () => {
    const { peer, appendMessage } =
      await startJourneyRealtimeConversation(true);
    await finishJourneyCharacterTurn(peer);
    await act(async () => vi.advanceTimersByTimeAsync(74_900));
    const button = screen.getByRole("button", {
      name: "Hold to talk, then release to send",
    });
    fireEvent.keyDown(button, { key: " " });
    await act(async () => vi.advanceTimersByTimeAsync(150));
    fireEvent.keyUp(button, { key: " " });
    expect(closingResponses(peer)).toHaveLength(1);
    expect(
      appendMessage.mock.calls.some(([message]) => message.role === "user"),
    ).toBe(false);
  });

  it("finishes without audio before the hard deadline and never calls completion twice", async () => {
    const { peer, onComplete } = await startJourneyRealtimeConversation(true);
    await finishJourneyCharacterTurn(peer);
    await act(async () => vi.advanceTimersByTimeAsync(75_000));
    expect(closingResponses(peer)).toHaveLength(1);
    await act(async () =>
      peer.channel.emit({
        type: "response.done",
        response: { status: "completed" },
      }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(8_000));
    expect(onComplete).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(10_000));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(peer.connectionState).toBe("closed");
  });

  it("checks the wall-clock deadline on return from a suspended tab", async () => {
    const { peer, onComplete } = await startJourneyRealtimeConversation(true);
    await finishJourneyCharacterTurn(peer);
    // Advancing wall time alone simulates timers not running while suspended.
    vi.setSystemTime(Date.now() + 100_000);
    await act(async () => window.dispatchEvent(new Event("focus")));
    expect(peer.connectionState).toBe("closed");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(closingResponses(peer)).toHaveLength(0);
  });

  it("releases the connection on technical failure without claiming natural completion", async () => {
    const { peer, onComplete } = await startJourneyRealtimeConversation(true);
    peer.connectionState = "failed";
    await act(async () => peer.onconnectionstatechange?.());
    expect(peer.connectionState).toBe("closed");
    expect(onComplete).not.toHaveBeenCalled();
    expect(audioTrack.stop).toHaveBeenCalled();
    expect(closingResponses(peer)).toHaveLength(0);
  });

  it("does not lose the final turn when its transcript precedes the cancelled response.done", async () => {
    vi.spyOn(turnGuard, "isLikelyLearnerUtterance").mockReturnValue(true);
    const { peer } = await startJourneyRealtimeConversation(true);
    await finishJourneyCharacterTurn(peer);
    await act(async () => vi.advanceTimersByTimeAsync(74_500));
    await act(async () => {
      peer.channel.emit({ type: "response.created" });
      peer.channel.emit({ type: "response.output_audio.delta" });
    });
    const button = screen.getByRole("button", {
      name: "Hold to interrupt Han and speak",
    });
    fireEvent.keyDown(button, { key: " " });
    expect(audioTrack.enabled).toBe(true);
    expect(
      peer.channel.sent.some((event) => event.type === "response.cancel"),
    ).toBe(true);
    await act(async () => vi.advanceTimersByTimeAsync(800));
    fireEvent.keyUp(button, { key: " " });
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "你叫什么名字？",
      }),
    );
    expect(closingResponses(peer)).toHaveLength(0);
    await act(async () =>
      peer.channel.emit({
        type: "response.done",
        response: { status: "cancelled" },
      }),
    );
    expect(closingResponses(peer)).toHaveLength(1);
    expect(JSON.stringify(closingResponses(peer)[0])).toContain("你叫什么名字");
    expect(audioInstances[0]?.muted).toBe(false);
  });

  it("bounds the evidence review when goodbye playback ends just before the hard deadline", async () => {
    const { peer, onComplete } = await startJourneyRealtimeConversation(true);
    await finishJourneyCharacterTurn(peer);
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "我是老师。",
      }),
    );
    await finishJourneyCharacterTurn(peer, "我是学生。");
    await act(async () => vi.advanceTimersByTimeAsync(75_000));
    await act(async () => peer.channel.emit({ type: "response.created" }));
    await act(async () => vi.advanceTimersByTimeAsync(11_500));
    await act(async () => {
      peer.channel.emit({
        type: "response.done",
        response: { status: "completed" },
      });
      peer.channel.emit({ type: "output_audio_buffer.stopped" });
    });
    expect(onComplete).not.toHaveBeenCalled();
    expect(JSON.stringify(peer.channel.sent.at(-1))).toContain(
      "speaking_evidence",
    );
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(peer.connectionState).toBe("closed");
    expect(onComplete).toHaveBeenCalledTimes(1);
    await act(async () => {
      peer.channel.emit({
        type: "response.done",
        response: { status: "completed" },
      });
      await vi.advanceTimersByTimeAsync(8_000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("Learning Journey voice scene", () => {
  it("uses the server-resolved bank and opening in subsequent turns", async () => {
    const bank: JourneySpeakingBanks = {
      version: JOURNEY_BANK_VERSION,
      lessonId: "current-lesson",
      lessonSlug: "foundations-greetings-and-introductions",
      openingLine: "你好。",
      rationale: "Reviewed pilot",
      reviewIssues: [],
      phraseBank: [],
      core: {
        vocabulary: [
          {
            id: "word-hello",
            lessonId: "current-lesson",
            lessonSlug: "foundations-greetings-and-introductions",
            text: "你好",
            meaning: "hello",
            evidence: "step-completed-exposure",
          },
        ],
        grammar: [],
      },
      support: { vocabulary: [], grammar: [] },
      extension: { vocabulary: [], grammar: [] },
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          sdp: "answer-sdp",
          instructions: "You are Han.",
          speechSpeed: 1,
          journeySpeakingBanks: bank,
        }),
      ),
    } as unknown as Response);
    const { peer } = await startJourneyRealtimeConversation(
      false,
      "current-lesson",
    );
    await finishJourneyCharacterTurn(peer);
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "我是老师。",
      }),
    );
    const guard = JSON.stringify(peer.channel.sent.at(-2));
    expect(guard).toContain("SERVER-RESOLVED JOURNEY BANKS");
    expect(guard).toContain("step-completed-exposure");
    expect(guard).not.toContain("Use ONLY words");
  });
  it("ignores a bank belonging to a different current lesson", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: vi.fn().mockResolvedValue(
        JSON.stringify({
          sdp: "answer-sdp",
          instructions: "You are Han.",
          speechSpeed: 1,
          journeySpeakingBanks: {
            version: JOURNEY_BANK_VERSION,
            lessonId: "different-lesson",
            openingLine: "不应该说这个。",
          },
        }),
      ),
    } as unknown as Response);
    const { peer } = await startJourneyRealtimeConversation(
      false,
      "current-lesson",
    );
    expect(JSON.stringify(peer.channel.sent)).not.toContain("不应该说这个");
    await finishJourneyCharacterTurn(peer);
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "我是老师。",
      }),
    );
    expect(JSON.stringify(peer.channel.sent.at(-2))).not.toContain(
      "SERVER-RESOLVED JOURNEY BANKS",
    );
  });
  it("opens the Spanish greeting lesson with 你好 and no extra opening question", async () => {
    const { peer } = await startJourneyRealtimeConversation();
    const opening = peer.channel.sent.find(
      (event) => event.type === "response.create",
    );
    expect(JSON.stringify(opening)).toContain("你好。");
    expect(JSON.stringify(opening)).not.toContain("我们开始吧");
    expect(JSON.stringify(opening)).not.toContain("你叫什么名字");
  });

  it("shows the press-to-talk hint only on the button and preserves the character caption through hold/release and silent turns", async () => {
    const { peer } = await startJourneyRealtimeConversation();
    await act(async () => {
      peer.channel.emit({ type: "response.created" });
      peer.channel.emit({
        type: "response.output_audio_transcript.done",
        transcript: "你好。",
      });
      peer.channel.emit({
        type: "response.done",
        response: { status: "completed" },
      });
      peer.channel.emit({ type: "output_audio_buffer.stopped" });
    });
    const button = await screen.findByRole("button", {
      name: "Hold to talk, then release to send",
    });
    await waitFor(() => expect(button).toBeEnabled());
    const statusHint = screen.getAllByText("Hold to talk");
    expect(statusHint).toHaveLength(2);
    expect(
      statusHint.filter((element) => !element.closest(".sr-only")),
    ).toHaveLength(1);
    expect(
      screen.queryByText("Hold the red button to talk."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("你好。")).toBeInTheDocument();

    fireEvent.pointerDown(button, {
      button: 0,
      pointerId: 1,
      pointerType: "touch",
    });
    expect(screen.getByText("你好。")).toBeInTheDocument();
    fireEvent.pointerUp(button, {
      button: 0,
      pointerId: 1,
      pointerType: "touch",
    });
    expect(screen.getByText("你好。")).toBeInTheDocument();
    expect(
      screen.queryByText("Hold the red button while you speak."),
    ).not.toBeInTheDocument();
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "[silence]",
      }),
    );
    expect(screen.getByText("你好。")).toBeInTheDocument();
    expect(
      screen.queryByText("Hold the red button to talk."),
    ).not.toBeInTheDocument();
  });

  it("passes learner-specific teacher evidence and the latest question to the direct reply without an extra planner call", async () => {
    const { peer } = await startJourneyRealtimeConversation();
    const character = async (transcript: string) =>
      act(async () => {
        peer.channel.emit({ type: "response.created" });
        peer.channel.emit({
          type: "response.output_audio_transcript.done",
          transcript,
        });
        peer.channel.emit({
          type: "response.done",
          response: { status: "completed" },
        });
        peer.channel.emit({ type: "output_audio_buffer.stopped" });
      });
    await character("你好。");
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "我是老师。",
      }),
    );
    const teacherGuard = JSON.stringify(
      [...peer.channel.sent]
        .reverse()
        .find((event) => event.type === "conversation.item.create"),
    );
    expect(teacherGuard).toContain("LEARNER OCCUPATION/STATUS EVIDENCE");
    expect(teacherGuard).toContain("我是老师");
    expect(teacherGuard).toContain("or ask 你是学生吗");
    expect(screen.getByText("你好。")).toBeInTheDocument();
    await character("我是学生。");
    expect(screen.queryByText("你好。")).not.toBeInTheDocument();
    expect(screen.getByText("我是学生。")).toBeInTheDocument();
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "你叫什么名字？",
      }),
    );
    const nextGuard = JSON.stringify(
      [...peer.channel.sent]
        .reverse()
        .find((event) => event.type === "conversation.item.create"),
    );
    expect(nextGuard).toContain("LATEST LEARNER TURN");
    expect(nextGuard).toContain("你叫什么名字");
    expect(nextGuard).toContain("LEARNER OCCUPATION/STATUS EVIDENCE");
    expect(nextGuard).toContain("我是老师");
    expect(screen.getByText("我是学生。")).toBeInTheDocument();
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([url]) => url === "/api/han/realtime/assessment"),
    ).toBe(false);
  });
});

describe("Han Realtime push-to-talk interruption", () => {
  it("clears the target and language override when starting a fresh session", async () => {
    const peer = await startHanRealtimeConversation("TUTOR");
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "Help me practice the pronunciation of 吗",
      }),
    );
    await act(async () => {
      peer.channel.emit({
        type: "response.output_audio_transcript.done",
        transcript: "Repeat: 吗",
      });
      peer.channel.emit({
        type: "response.done",
        response: { status: "completed" },
      });
    });
    fireEvent.click(screen.getByRole("button", { name: /^End$/ }));
    await screen.findByRole("button", { name: "Start live conversation" });
    fireEvent.click(
      screen.getByRole("button", { name: "Start live conversation" }),
    );
    await waitFor(() => expect(FakePeerConnection.instances).toHaveLength(2));
    const fresh = FakePeerConnection.instances[1]!;
    await waitFor(() => expect(fresh.setRemoteDescription).toHaveBeenCalled());
    await act(async () => {
      fresh.channel.open();
      fresh.channel.emit({
        type: "session.updated",
        session: { instructions: "You are Han." },
      });
      fresh.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "你好",
      });
    });
    const guard = JSON.stringify(
      [...fresh.channel.sent]
        .reverse()
        .find((event) => event.type === "conversation.item.create"),
    );
    expect(guard).toContain("required explanation language is Spanish");
    expect(guard).not.toContain("AUTHORITATIVE TUTOR PRACTICE STATE");
  });

  it.each([
    [
      "Spanish",
      "Quiero practicar la pronunciación de 吧",
      "La siguiente palabra es 吗. Repite: 吗",
    ],
    [
      "English",
      "Help me practice the pronunciation of 吧",
      "The next word is 吗. Repeat: 吗",
    ],
  ])(
    "keeps %s and the exact target through the reported ba/ma exchange",
    async (language, request, nextTarget) => {
      const peer = await startHanRealtimeConversation("TUTOR");
      const learner = async (transcript: string) =>
        act(async () =>
          peer.channel.emit({
            type: "conversation.item.input_audio_transcription.completed",
            transcript,
          }),
        );
      const han = async (transcript: string) =>
        act(async () => {
          peer.channel.emit({
            type: "response.output_audio_transcript.done",
            transcript,
          });
          peer.channel.emit({
            type: "response.done",
            response: { status: "completed" },
          });
        });
      const guard = () =>
        JSON.stringify(
          [...peer.channel.sent]
            .reverse()
            .find((event) => event.type === "conversation.item.create"),
        );
      await learner(request);
      await han("Repite: 吧");
      await learner("吧");
      expect(guard()).toContain("PRONUNCIATION PASS");
      await han(nextTarget);
      await learner("妈?");
      expect(guard()).toContain(`required explanation language is ${language}`);
      expect(guard()).toContain('exact target = \\"吗\\"');
      expect(guard()).toContain("neutral tone, question particle");
      expect(guard()).toContain("ACTIVE PRONUNCIATION DRILL");
      // Even a faulty generated reply must not become the next target.
      await han("Ahora repite: 妈");
      await learner("吗?");
      expect(guard()).toContain(`required explanation language is ${language}`);
      expect(guard()).toContain("PRONUNCIATION PASS");
      await han("That word was recognized.");
      await learner(
        language === "Spanish" ? "¿Qué significa eso?" : "What does that mean?",
      );
      expect(guard()).toContain(`required explanation language is ${language}`);
      expect(guard()).not.toContain("AUTHORITATIVE TUTOR PRACTICE STATE");
      expect(guard()).toContain("PAUSED TUTOR PRACTICE");
      expect(guard()).toContain(
        'previously established study item is \\"吗\\"',
      );
    },
  );

  it("keeps an ambiguous ba unresolved until the learner identifies the character", async () => {
    const peer = await startHanRealtimeConversation("TUTOR");
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "Me gustaría entender la pronunciación del ba.",
      }),
    );
    expect(JSON.stringify(peer.channel.sent)).toContain(
      "PRONUNCIATION TARGET CLARIFICATION",
    );
    await act(async () => {
      peer.channel.emit({
        type: "response.output_audio_transcript.done",
        transcript: "¿La partícula 吧, el número 八 o la estructura 把?",
      });
      peer.channel.emit({
        type: "response.done",
        response: { status: "completed" },
      });
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "Me refiero a 吧, la partícula.",
      });
    });
    const guard = JSON.stringify(
      [...peer.channel.sent]
        .reverse()
        .find((event) => event.type === "conversation.item.create"),
    );
    expect(guard).toContain('exact target = \\"吧\\"');
    expect(guard).toContain("Reference pronunciation: ba (neutral tone)");
    expect(guard).not.toContain("PRONUNCIATION TARGET CLARIFICATION");
  });

  it("keeps Spanish through a meaning request and a Chinese attempt after an invitation", async () => {
    const peer = await startHanRealtimeConversation("TUTOR");
    await act(async () =>
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "明纲, qué es eso?",
      }),
    );
    expect(JSON.stringify(peer.channel.sent)).toContain("MEANING REQUEST");
    await act(async () => {
      peer.channel.emit({
        type: "response.output_audio_transcript.done",
        transcript:
          "饼干 significa galleta. Por ejemplo, 我喜欢吃饼干. ¿Quieres intentar decirlo tú?",
      });
      peer.channel.emit({
        type: "response.done",
        response: { status: "completed" },
      });
      peer.channel.emit({
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "我是很吃敏感。",
      });
    });
    const lastGuard = [...peer.channel.sent]
      .reverse()
      .find((event) => event.type === "conversation.item.create");
    expect(JSON.stringify(lastGuard)).toContain(
      "required explanation language is Spanish",
    );
    expect(JSON.stringify(lastGuard)).toContain("ACTIVE PRONUNCIATION DRILL");
  });
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
