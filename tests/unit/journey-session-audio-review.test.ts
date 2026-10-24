import { describe, expect, it } from "vitest";
import {
  JourneySessionAudioReview,
  readJourneySessionAudio,
  unavailableJourneySessionAudio,
  JOURNEY_SESSION_AUDIO_PHASE,
  JOURNEY_SESSION_AUDIO_VERSION,
  JOURNEY_SESSION_AUDIO_TOOL,
} from "@/lib/journey-session-audio-review";
import { sessionAudioJudgment } from "../fixtures/journey-session-audio";
import { buildJourneyAttemptCapture } from "@/lib/journey-speaking-capture";
import { JourneyAttemptSealSchema } from "@/lib/journey-speaking-attempt-contract";
import {
  buildJourneySpeakingLevel,
  buildJourneyAudioLessonContext,
} from "@/lib/journey-speaking-level";
import { unifiedContext } from "../fixtures/journey-unified";

const sources = [
  { sequence: 1, itemId: "audio-1", content: "你好，我叫小明。" },
];
const turns = [
  { role: "assistant" as const, content: "你好" },
  { role: "user" as const, content: sources[0]!.content },
];
function review() {
  return new JourneySessionAudioReview(
    "attempt",
    "es",
    sources,
    1,
    "request-1",
  );
}
function created(instance: JourneySessionAudioReview) {
  instance.handle({
    type: "response.created",
    response: {
      id: "response-1",
      metadata: {
        hango_phase: JOURNEY_SESSION_AUDIO_PHASE,
        review_id: "request-1",
      },
    },
  });
}
function done(
  instance: JourneySessionAudioReview,
  raw: unknown = sessionAudioJudgment(),
) {
  return instance.handle({
    type: "response.done",
    response: {
      id: "response-1",
      status: "completed",
      output: [
        {
          type: "function_call",
          name: JOURNEY_SESSION_AUDIO_TOOL,
          arguments: JSON.stringify(raw),
        },
      ],
    },
  });
}
describe("Journey in-session audio review, fictional provider", () => {
  it.each(["WrongTool", "duplicate", "dialogue"])(
    "rejects %s output rather than grading a continued role play",
    (kind) => {
      const instance = review();
      created(instance);
      const call = {
        type: "function_call",
        name: kind === "WrongTool" ? "other" : JOURNEY_SESSION_AUDIO_TOOL,
        arguments: JSON.stringify(sessionAudioJudgment()),
      };
      const output =
        kind === "duplicate"
          ? [call, call]
          : kind === "dialogue"
            ? [
                {
                  content: [
                    { type: "output_text", text: "好的，我们明天见。" },
                  ],
                },
              ]
            : [call];
      const result = instance.handle({
        type: "response.done",
        response: { id: "response-1", status: "completed", output },
      });
      expect(result).toMatchObject({
        status: "FAILED",
        reason: "INVALID_REVIEW",
        judgment: null,
      });
      expect(result).not.toHaveProperty("score");
    },
  );
  it("receives the frozen task, curricular acoustic anchors and earned progression, and binds the result on server read", () => {
    const snapshot = unifiedContext().snapshot;
    snapshot.speakingLevel = buildJourneySpeakingLevel(1, "BEGINNER", 350);
    const context = buildJourneyAudioLessonContext(snapshot, "a".repeat(64))!;
    const instance = new JourneySessionAudioReview(
      "attempt",
      "es",
      sources,
      1,
      "request-1",
      context,
    );
    const prompt = instance.request().response.instructions;
    expect(prompt).toContain('"slug":"greetings"');
    expect(prompt).toContain(
      '"successConditions":["Give your name","Ask their name"]',
    );
    expect(prompt).toContain("planning pauses are expected");
    expect(prompt).toContain("350 points");
    expect(prompt).not.toContain("assessment");
    created(instance);
    const result = done(instance)!;
    expect(result.contextHash).toBe(context.contextHash);
    expect(
      readJourneySessionAudio(
        result,
        "attempt",
        "es",
        turns,
        context.contextHash,
      ),
    ).not.toBeNull();
    expect(
      readJourneySessionAudio(result, "attempt", "es", turns, "b".repeat(64)),
    ).toBeNull();
    expect(
      readJourneySessionAudio(
        { ...result, contextHash: undefined },
        "attempt",
        "es",
        turns,
        context.contextHash,
      ),
    ).toBeNull();
  });
  it("references actual audio item IDs, stays silent/out-of-band and caps cost without a new session", () => {
    const request = review().request();
    expect(request.response.input.slice(0, -1)).toEqual([
      { type: "item_reference", id: "audio-1" },
    ]);
    expect(request.response.input.at(-1)).toMatchObject({
      type: "message",
      role: "user",
    });
    expect(request.response.tool_choice).toEqual({
      type: "function",
      name: JOURNEY_SESSION_AUDIO_TOOL,
    });
    expect(request.response.tools).toHaveLength(1);
    expect(request.response.conversation).toBe("none");
    expect(request.response.output_modalities).toEqual(["text"]);
    expect(request.response.max_output_tokens).toBe(2200);
    expect(request.response.instructions).toContain("Spanish");
    expect(request.response.instructions).toContain("tone sandhi");
    expect(request.response.instructions).toContain("untrusted student data");
    expect(request.response.instructions).toContain("cannot prove");
  });
  it("ignores the character's cancelled response and a foreign review's text/done", () => {
    const instance = review();
    expect(
      instance.handle({
        type: "response.done",
        response: { id: "character", status: "cancelled" },
      }),
    ).toBeNull();
    instance.handle({
      type: "response.created",
      response: {
        id: "foreign",
        metadata: {
          hango_phase: JOURNEY_SESSION_AUDIO_PHASE,
          review_id: "other",
        },
      },
    });
    expect(done(instance)).toBeNull();
    created(instance);
    instance.handle({
      type: "response.output_text.delta",
      response_id: "foreign",
      delta: "poison",
    });
    const result = done(instance)!;
    expect(result.status).toBe("REVIEWED");
    expect(result.provenance).toBe("UNVERIFIED_BROWSER_REALTIME_REVIEW");
    expect(result).not.toHaveProperty("score");
    expect(done(instance)).toBeNull();
  });
  it.each(["cancelled", "failed", "incomplete"])(
    "never parses a %s response into an apparent success",
    (status) => {
      const instance = review();
      created(instance);
      expect(
        instance.handle({
          type: "response.done",
          response: { id: "response-1", status },
        })?.reason,
      ).toBe("PROVIDER_FAILED");
    },
  );
  it("does not accept prose JSON as a successful forced review", () => {
    const instance = review();
    created(instance);
    instance.handle({
      type: "response.output_text.delta",
      response_id: "response-1",
      delta: JSON.stringify(sessionAudioJudgment()),
    });
    expect(
      instance.handle({
        type: "response.done",
        response: { id: "response-1", status: "completed" },
      })?.status,
    ).toBe("FAILED");
  });
  it.each([
    "attempt",
    "locale",
    "quote",
    "item",
    "max",
    "target",
    "unknown",
    "null",
  ])(
    "rejects inconsistent %s rather than changing the student's result",
    (kind) => {
      const instance = review();
      created(instance);
      const judgment = sessionAudioJudgment();
      if (kind === "attempt") judgment.attemptId = "other";
      if (kind === "locale") judgment.locale = "en";
      if (kind === "quote")
        judgment.dimensions.tones.evidence[0]!.quote = "invented";
      if (kind === "item") judgment.reviewedItemIds = ["other"];
      if (kind === "max") judgment.dimensions.tones.level = 4;
      if (kind === "target") judgment.findings[0]!.target = "喝";
      if (kind === "unknown") Object.assign(judgment, { score: 100 });
      if (kind === "null") judgment.dimensions.tones.level = null;
      expect(done(instance, judgment)?.reason).toBe("INVALID_REVIEW");
    },
  );
  it("reports missing audio evidence as partial/null, never a perfect score", () => {
    const instance = review();
    created(instance);
    const judgment = sessionAudioJudgment();
    judgment.reviewedItemIds = [];
    judgment.findings = [];
    for (const dimension of Object.values(judgment.dimensions)) {
      dimension.status = "NOT_EVALUATED";
      dimension.level = null;
      dimension.evidence = [];
    }
    expect(done(instance, judgment)).toMatchObject({
      status: "PARTIAL",
      judgment: { dimensions: { tones: { level: null } } },
    });
  });
  it("does not silently call a capped sample complete", () => {
    const instance = new JourneySessionAudioReview(
      "attempt",
      "es",
      Array.from({ length: 26 }, (_, n) => ({
        sequence: n,
        itemId: `item-${n}`,
        content: "你",
      })),
      26,
      "request-1",
    );
    expect(instance.request().response.input).toHaveLength(25); // 24 audio + explicit review command
    created(instance);
    expect(
      done(instance, sessionAudioJudgment("attempt", "item-0", 0, "你"))
        ?.status,
    ).toBe("PARTIAL");
  });
  it("handles only its own correlated error and never retries", () => {
    const instance = review();
    expect(
      instance.handle({ type: "error", error: { event_id: "other" } }),
    ).toBeNull();
    expect(
      instance.handle({ type: "error", error: { event_id: "request-1" } })
        ?.reason,
    ).toBe("PROVIDER_FAILED");
    expect(done(instance)).toBeNull();
  });
  it("bounds streamed output, returns explicit timeout and ignores late responses", () => {
    const instance = review();
    created(instance);
    expect(
      instance.handle({
        type: "response.output_text.delta",
        response_id: "response-1",
        delta: "x".repeat(24_001),
      })?.reason,
    ).toBe("INVALID_REVIEW");
    const timed = review();
    expect(timed.cancellation()).toBeNull();
    created(timed);
    expect(timed.cancellation()).toEqual({
      type: "response.cancel",
      response_id: "response-1",
    });
    expect(timed.fail("TIMEOUT")).toMatchObject({
      status: "TIMEOUT",
      judgment: null,
    });
    expect(done(timed)).toBeNull();
  });
  it("preserves a bounded rejected paid response for offline diagnosis instead of requiring another paid call", () => {
    const instance = review();
    created(instance);
    instance.handle({
      type: "response.output_text.done",
      response_id: "response-1",
      text: "{incomplete paid output",
    });
    const result = instance.handle({
      type: "response.done",
      response: { id: "response-1", status: "completed" },
    })!;
    expect(result).toMatchObject({
      status: "FAILED",
      reason: "INVALID_REVIEW",
      judgment: null,
      rejectedDraft: "{incomplete paid output",
    });
    expect(readJourneySessionAudio(result, "attempt", "es", turns)).toEqual(
      result,
    );
    expect(result).not.toHaveProperty("score");
  });
  it("persists and rereads identical bounded audio observations without altering text or awarding a score", () => {
    const instance = review();
    created(instance);
    const audio = done(instance)!;
    const capture = buildJourneyAttemptCapture("attempt", "lesson", turns, {
      speakingEvidence: [],
      capturedTurns: turns,
      quality: {
        pendingLearnerTurn: false,
        interruptedAssistant: false,
        sessionAudio: audio,
      },
    });
    expect(capture.turns).toEqual(turns);
    expect(capture.quality!.sessionAudio).toEqual(audio);
    expect(
      readJourneySessionAudio(
        JSON.parse(JSON.stringify(capture.quality!.sessionAudio)),
        "attempt",
        "es",
        turns,
      ),
    ).toEqual(audio);
    expect(readJourneySessionAudio(audio, "foreign", "es", turns)).toBeNull();
    expect(readJourneySessionAudio(audio, "attempt", "en", turns)).toBeNull();
    expect(
      readJourneySessionAudio(audio, "attempt", "es", [...turns].reverse()),
    ).toBeNull();
    expect(JSON.stringify(audio)).not.toContain("estimatedCost");
  });
  it("rejects a duplicate source, forged quote or assistant turn in a sealed browser payload", () => {
    const instance = review();
    created(instance);
    const audio = done(instance)!;
    const input = {
      attemptId: "attempt",
      lessonId: "lesson",
      closeReason: "USER_END",
      turns,
      quality: {
        pendingLearnerTurn: false,
        interruptedAssistant: false,
        sessionAudio: audio,
      },
    };
    expect(JourneyAttemptSealSchema.safeParse(input).success).toBe(true);
    for (const forged of [
      {
        ...audio,
        submittedItems: [...audio.submittedItems, ...audio.submittedItems],
      },
      { ...audio, totalLearnerTurns: 4 },
      { ...audio, submittedItems: [{ sequence: 0, itemId: "audio-1" }] },
      { ...audio, status: "FAILED" },
    ]) {
      expect(
        readJourneySessionAudio(forged, "attempt", "es", turns),
      ).toBeNull();
      expect(
        JourneyAttemptSealSchema.safeParse({
          ...input,
          quality: { ...input.quality, sessionAudio: forged },
        }).success,
      ).toBe(false);
    }
  });
  it("keeps explicit unavailable states and does not backfill historical audio", () => {
    const absent = unavailableJourneySessionAudio(
      "attempt",
      "es",
      "NO_AUDIO_ITEMS",
      1,
    );
    expect(readJourneySessionAudio(absent, "attempt", "es", turns)).toEqual(
      absent,
    );
    expect(
      readJourneySessionAudio(undefined, "attempt", "es", turns),
    ).toBeNull();
    expect(absent.version).toBe(JOURNEY_SESSION_AUDIO_VERSION);
  });
});
