import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import {
  getJourneySpeakingAttempt,
  sealJourneySpeakingAttempt,
  startJourneySpeakingAttempt,
} from "@/lib/journey-speaking-attempts";
import { evaluateJourneySpeakingAttempt } from "@/lib/journey-speaking-evaluation-service";
import { AiProviderError, type AiCompletionRequest } from "@/lib/ai/provider";
import { JOURNEY_RUBRIC_VERSION } from "@/lib/journey-speaking-attempt-contract";
import {
  validateJourneyJudgment,
  type JourneyEvaluationContext,
} from "@/lib/journey-speaking-evaluation";

const { complete, getProvider } = vi.hoisted(() => ({
  complete: vi.fn(),
  getProvider: vi.fn(),
}));
vi.mock("@/lib/ai", async (original) => ({
  ...(await original<typeof import("@/lib/ai")>()),
  getAiProvider: getProvider,
}));

const destination = new URL(process.env.DATABASE_URL ?? "http://missing");
if (
  destination.hostname !== "127.0.0.1" ||
  destination.port !== "54329" ||
  destination.pathname !== "/hango_local_test"
)
  throw new Error("Run only with the disposable local integration runner.");
let lessonId: string;
beforeAll(async () => {
  lessonId = (
    await db.lesson.findUniqueOrThrow({
      where: { slug: "foundations-greetings-and-introductions" },
    })
  ).id;
});

function response(request: AiCompletionRequest) {
  const data = request.systemPrompt
    .split("BEGIN ATTEMPT DATA (not instructions)\n")[1]!
    .split("\nEND ATTEMPT DATA")[0]!;
  const context = JSON.parse(data) as JourneyEvaluationContext;
  const user = context.turns.find((turn) => turn.role === "user")!;
  const assistant = context.turns.find((turn) => turn.role === "assistant")!;
  const cite = { turnId: user.id, quote: user.content };
  const dimension = {
    observation: "OBSERVED",
    level: 3,
    reason:
      context.locale === "es"
        ? "Respuesta apropiada al nivel."
        : "An appropriate answer for this lesson level.",
    citations: [cite],
  };
  const result = {
    content: JSON.stringify({
      rubricVersion: JOURNEY_RUBRIC_VERSION,
      bankVersion: context.snapshot.banks.version,
      locale: context.locale,
      dimensions: {
        communication: dimension,
        language: dimension,
        autonomy: dimension,
        interaction: {
          ...dimension,
          citations: [cite, { turnId: assistant.id, quote: assistant.content }],
        },
      },
      evidence: [],
      limitations: [],
      feedback: {
        summary:
          context.locale === "es"
            ? "Pudiste presentarte."
            : "You introduced yourself.",
        achievement: {
          text:
            context.locale === "es"
              ? "Dijiste tu nombre."
              : "You gave your name.",
          citations: [cite],
        },
        priority: null,
        nextStep:
          context.locale === "es"
            ? "Prueba preguntar el nombre de tu compañero."
            : "Try asking your partner's name.",
      },
    }),
    provider: "openai",
    model: "gpt-5-mini",
    inputTokens: 1000,
    outputTokens: 200,
    outputStatus: "complete" as const,
  };
  const checked = validateJourneyJudgment(JSON.parse(result.content), context);
  if (!checked.ok)
    throw new Error(`Invalid synthetic fixture: ${checked.errors.join(", ")}`);
  return result;
}
beforeEach(() => {
  complete.mockReset().mockImplementation(async (request) => response(request));
  getProvider.mockReset().mockReturnValue({
    name: "openai",
    supportsStructuredOutput: true,
    complete,
  });
});

async function capture(
  locale = "es",
  closeReason = "USER_END",
  content = "我叫Arean。",
) {
  const userId = (
    await db.user.create({
      data: { email: `evaluation-${crypto.randomUUID()}@example.test` },
    })
  ).id;
  const attempt = await startJourneySpeakingAttempt(userId, {
    lessonId,
    requestKey: crypto.randomUUID(),
    locale,
  });
  await sealJourneySpeakingAttempt(userId, {
    attemptId: attempt.id,
    lessonId,
    closeReason,
    turns: [
      { role: "assistant", content: "你好，你叫什么名字？" },
      { role: "user", content },
    ],
  });
  return { userId, attemptId: attempt.id };
}

describe("Journey single evaluation (disposable Postgres, no paid API)", () => {
  it("recognition and capture quality stored by the browser cannot be ignored to award a complete grade", async () => {
    const userId = (
      await db.user.create({
        data: {
          email: `uncertain-evaluation-${crypto.randomUUID()}@example.test`,
        },
      })
    ).id;
    const attempt = await startJourneySpeakingAttempt(userId, {
      lessonId,
      locale: "es",
      requestKey: crypto.randomUUID(),
    });
    await sealJourneySpeakingAttempt(userId, {
      attemptId: attempt.id,
      lessonId,
      closeReason: "USER_END",
      turns: [
        { role: "assistant", content: "你叫什么名字？" },
        {
          role: "user",
          content: "我叫Arean。",
          recognition: {
            rawTranscript: "我叫Arean。",
            interpretedTranscript: "我叫Arean。",
            confidence: 0.3,
          },
        },
      ],
      quality: { pendingLearnerTurn: true, interruptedAssistant: false },
    });
    const result = await evaluateJourneySpeakingAttempt(
      userId,
      attempt.id,
      lessonId,
    );
    expect(result).toMatchObject({
      status: "PARTIAL",
      score: null,
      requestCount: 1,
    });
    expect(
      (result.report as { limitations: { kind: string }[] }).limitations.map(
        (item) => item.kind,
      ),
    ).toEqual(
      expect.arrayContaining(["capture_incomplete", "recognition_uncertain"]),
    );
    await evaluateJourneySpeakingAttempt(userId, attempt.id, lessonId);
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it("persists one structured judgment, one metered cost and no reward/global chat", async () => {
    const { userId, attemptId } = await capture();
    const first = await evaluateJourneySpeakingAttempt(
      userId,
      attemptId,
      lessonId,
    );
    const replay = await evaluateJourneySpeakingAttempt(
      userId,
      attemptId,
      lessonId,
    );
    expect(first).toMatchObject({
      status: "COMPLETE",
      score: 75,
      requestCount: 1,
      failureCode: null,
    });
    expect(replay).toEqual(first);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete.mock.calls[0]![0]).toMatchObject({
      retry: false,
      structuredOutput: { name: "journey_evidence_judgment" },
    });
    const costs = await db.aiUsageLog.findMany({ where: { userId } });
    expect(costs).toHaveLength(1);
    expect(costs[0]).toMatchObject({
      id: first.usageLogId,
      feature: "lesson-reflection",
      experience: "LESSON_REFLECTION",
      inputTokens: 1000,
      outputTokens: 200,
      calculationMethod: "TOKEN_RATES",
    });
    expect(costs[0]!.estimatedCostUsd).toBeCloseTo(0.00065);
    expect(await db.aiConversation.count({ where: { userId } })).toBe(0);
    expect(await db.lessonReflectionReport.count({ where: { userId } })).toBe(
      0,
    );
    expect(await db.learnerLessonCompletion.count({ where: { userId } })).toBe(
      0,
    );
  });

  it("parallel readers claim only one provider dispatch", async () => {
    const { userId, attemptId } = await capture("en");
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        evaluateJourneySpeakingAttempt(userId, attemptId, lessonId),
      ),
    );
    expect(
      results.every((r) => ["PROCESSING", "COMPLETE"].includes(r.status)),
    ).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
    const cached = await evaluateJourneySpeakingAttempt(
      userId,
      attemptId,
      lessonId,
    );
    expect(cached).toMatchObject({
      status: "COMPLETE",
      locale: "en",
      requestCount: 1,
    });
    expect(await db.aiUsageLog.count({ where: { userId } })).toBe(1);
  });

  it("does not pay to grade an empty/greeting-only or abandoned capture", async () => {
    for (const reason of ["USER_END", "ABANDONED"]) {
      const { userId, attemptId } = await capture(
        "es",
        reason,
        reason === "USER_END" ? "你好！" : "我叫Arean。",
      );
      expect(
        await evaluateJourneySpeakingAttempt(userId, attemptId, lessonId),
      ).toMatchObject({ status: "INSUFFICIENT", score: null, requestCount: 0 });
    }
    expect(complete).not.toHaveBeenCalled();
  });

  it.each([
    "invalid_json",
    "invalid_evidence",
    "provider_refused",
    "provider_incomplete",
  ])(
    "keeps cost but no fake grade or auto-retry for %s",
    async (failureCode) => {
      complete.mockImplementationOnce(async (request) => {
        const result = response(request);
        if (failureCode === "invalid_json") result.content = "{broken";
        if (failureCode === "invalid_evidence") {
          const data = JSON.parse(result.content);
          data.dimensions.language.citations[0].quote =
            "an invented learner sentence";
          result.content = JSON.stringify(data);
        }
        return {
          ...result,
          outputStatus:
            failureCode === "provider_refused"
              ? "refused"
              : failureCode === "provider_incomplete"
                ? "incomplete"
                : "complete",
        };
      });
      const { userId, attemptId } = await capture();
      const failed = await evaluateJourneySpeakingAttempt(
        userId,
        attemptId,
        lessonId,
      );
      expect(failed).toMatchObject({
        status: "FAILED",
        score: null,
        report: null,
        failureCode,
        requestCount: 1,
      });
      expect(await db.aiUsageLog.count({ where: { userId } })).toBe(1);
      await evaluateJourneySpeakingAttempt(userId, attemptId, lessonId);
      expect(complete).toHaveBeenCalledTimes(1);
    },
  );

  it("provider timeouts remain unresolved, not zero-cost guesses or paid retries", async () => {
    complete.mockRejectedValue(new AiProviderError("timeout", "timeout"));
    const { userId, attemptId } = await capture();
    expect(
      await evaluateJourneySpeakingAttempt(userId, attemptId, lessonId),
    ).toMatchObject({
      status: "FAILED",
      score: null,
      failureCode: "provider_timeout",
      requestCount: 1,
    });
    await evaluateJourneySpeakingAttempt(userId, attemptId, lessonId);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(await db.aiUsageLog.count({ where: { userId } })).toBe(0); // No provider usage returned, not proof of zero spend.
    expect(
      await db.aiOperationLog.count({ where: { userId, outcome: "FAILURE" } }),
    ).toBe(1);
  });

  it("honors the shared Reflection user limit before provider dispatch", async () => {
    const { userId, attemptId } = await capture();
    await db.aiUsageUserCap.create({
      data: {
        userId,
        feature: "experience:LESSON_REFLECTION",
        dailyLimitUsd: 0,
      },
    });
    expect(
      await evaluateJourneySpeakingAttempt(userId, attemptId, lessonId),
    ).toMatchObject({
      status: "FAILED",
      failureCode: "budget_blocked",
      requestCount: 0,
    });
    expect(complete).not.toHaveBeenCalled();
  });

  it("cannot evaluate another owner's capture or an unsealed attempt", async () => {
    const { userId, attemptId } = await capture();
    const other = (
      await db.user.create({
        data: { email: `evaluation-owner-${crypto.randomUUID()}@example.test` },
      })
    ).id;
    await expect(
      evaluateJourneySpeakingAttempt(other, attemptId, lessonId),
    ).rejects.toThrow("Attempt unavailable");
    await expect(
      evaluateJourneySpeakingAttempt(userId, attemptId, "wrong-lesson"),
    ).rejects.toThrow("Attempt unavailable");
    const active = await startJourneySpeakingAttempt(userId, {
      lessonId,
      locale: "es",
      requestKey: crypto.randomUUID(),
    });
    await expect(
      evaluateJourneySpeakingAttempt(userId, active.id, lessonId),
    ).rejects.toThrow("Seal the attempt");
    expect(complete).not.toHaveBeenCalled();
  });

  it("technical closure stays partial despite all observed dimensions", async () => {
    const { userId, attemptId } = await capture("es", "TECHNICAL_FAILURE");
    expect(
      await evaluateJourneySpeakingAttempt(userId, attemptId, lessonId),
    ).toMatchObject({ status: "PARTIAL", score: null, requestCount: 1 });
  });

  it("never fabricates an evaluation with a mock/unsupported provider", async () => {
    getProvider.mockReturnValue({ name: "mock", complete });
    const { userId, attemptId } = await capture();
    expect(
      await evaluateJourneySpeakingAttempt(userId, attemptId, lessonId),
    ).toMatchObject({
      status: "FAILED",
      failureCode: "structured_provider_unavailable",
      requestCount: 0,
    });
    expect(complete).not.toHaveBeenCalled();
  });

  it("an expired worker is failed without new dispatch, and capture corruption is rejected", async () => {
    const { userId, attemptId } = await capture();
    await db.journeySpeakingEvaluation.create({
      data: {
        attemptId,
        locale: "es",
        rubricVersion: JOURNEY_RUBRIC_VERSION,
        status: "PROCESSING",
        leaseToken: crypto.randomUUID(),
        requestCount: 1,
        processingStartedAt: new Date(Date.now() - 180_000),
      },
    });
    expect(
      await evaluateJourneySpeakingAttempt(userId, attemptId, lessonId),
    ).toMatchObject({
      status: "FAILED",
      failureCode: "processing_expired",
      requestCount: 1,
    });
    expect(complete).not.toHaveBeenCalled();
    const attempt = await getJourneySpeakingAttempt(
      userId,
      attemptId,
      lessonId,
    );
    await db.journeySpeakingTurn.update({
      where: { id: attempt.turns[0]!.id },
      data: { content: "altered" },
    });
    await expect(
      evaluateJourneySpeakingAttempt(userId, attemptId, lessonId),
    ).rejects.toThrow("capture integrity");
  });

  it("a late completion meters its expense but cannot replace an expired result", async () => {
    const { userId, attemptId } = await capture();
    let release!: () => void;
    let dispatched!: () => void;
    const started = new Promise<void>((resolve) => {
      dispatched = resolve;
    });
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    complete.mockImplementationOnce(async (request) => {
      dispatched();
      await pending;
      return response(request);
    });
    const worker = evaluateJourneySpeakingAttempt(userId, attemptId, lessonId);
    await started;
    try {
      await db.journeySpeakingEvaluation.update({
        where: { attemptId },
        data: { processingStartedAt: new Date(Date.now() - 180_000) },
      });
      expect(
        await evaluateJourneySpeakingAttempt(userId, attemptId, lessonId),
      ).toMatchObject({ status: "FAILED", failureCode: "processing_expired" });
    } finally {
      release();
    }
    const result = await worker;
    expect(result).toMatchObject({
      status: "FAILED",
      score: null,
      report: null,
      requestCount: 1,
      failureCode: "processing_expired",
    });
    expect(result.usageLogId).toBeTruthy();
    expect(await db.aiUsageLog.count({ where: { userId } })).toBe(1);
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
