import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  JourneySessionAudioReview,
  JOURNEY_SESSION_AUDIO_PHASE,
} from "@/lib/journey-session-audio-review";
import { sessionAudioJudgment } from "../fixtures/journey-session-audio";
import { createHash } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { advanceLessonStep } from "@/lib/lesson-progress-data";
import {
  startJourneySpeakingAttempt,
  sealJourneySpeakingAttempt,
  getJourneySpeakingAttempt,
} from "@/lib/journey-speaking-attempts";
import { getJourneyAssessmentSnapshot } from "@/lib/journey-assessment-snapshot";
import {
  evaluateJourneyLessonReport,
  getJourneyLessonReport,
  persistJourneyLessonReport,
} from "@/lib/journey-lesson-report-service";
import {
  getOrGenerateLessonReflectionReport,
  getLessonScoreBreakdown,
} from "@/lib/reflection";
import {
  getOrGenerateScenarioCompletion,
  redoLesson,
} from "@/lib/scenario-completion";
import {
  JOURNEY_RUBRIC_VERSION,
  type JourneyAttemptSnapshot,
} from "@/lib/journey-speaking-attempt-contract";
import type { AiCompletionRequest } from "@/lib/ai/provider";
import type { JourneyEvaluationContext } from "@/lib/journey-speaking-evaluation";
import { summarizeJourneyQuiz } from "@/lib/journey-lesson-report";
import { usesJourneyLessonReport } from "@/lib/journey-report-routing";
import { unifiedWire } from "../fixtures/journey-unified";
import { JOURNEY_UNIFIED_POLICY } from "@/lib/journey-unified-policy";
import { buildJourneyAudioLessonContext } from "@/lib/journey-speaking-level";
import { experienceLimitKey } from "@/lib/ai-experiences";

const { complete, provider, recompute } = vi.hoisted(() => ({
  complete: vi.fn(),
  provider: vi.fn(),
  recompute: vi.fn(),
}));
vi.mock("@/lib/general-level", async (original) => {
  const actual = await original<typeof import("@/lib/general-level")>();
  recompute.mockImplementation(actual.recomputeGeneralLevelPoints);
  return { ...actual, recomputeGeneralLevelPoints: recompute };
});
vi.mock("@/lib/ai", async (original) => ({
  ...(await original<typeof import("@/lib/ai")>()),
  getAiProvider: provider,
}));
const target = new URL(process.env.DATABASE_URL ?? "http://missing");
if (
  target.hostname !== "127.0.0.1" ||
  target.port !== "54329" ||
  target.pathname !== "/hango_local_test"
)
  throw new Error("Disposable integration database required");
let lessonId: string;
let speakingStepId: string;
let firstStepId: string;
let vocabularyIds: string[];
let exerciseIds: string[];
let scenarioId: string;
beforeAll(async () => {
  const lesson = await db.lesson.findUniqueOrThrow({
    where: { slug: "foundations-greetings-and-introductions" },
    include: {
      steps: { orderBy: { order: "asc" } },
      vocabulary: true,
      grammarPoints: {
        include: {
          grammarPoint: {
            include: { exercises: { where: { status: "PUBLISHED" } } },
          },
        },
      },
    },
  });
  lessonId = lesson.id;
  scenarioId = lesson.scenarioLevelId
    ? (
        await db.scenarioLevel.findUniqueOrThrow({
          where: { id: lesson.scenarioLevelId },
        })
      ).scenarioId
    : "";
  speakingStepId = lesson.steps.find((step) => step.type === "SPEAKING")!.id;
  firstStepId = lesson.steps[0]!.id;
  vocabularyIds = lesson.vocabulary.map((item) => item.vocabularyItemId);
  // An empty seed does not recover the grammar-exercise enrichment that is
  // that can exist on persistent databases. Add an explicit test-only authored
  // exercise here; do not turn NO_OPPORTUNITY into 100 to make tests pass.
  const grammarPoint = lesson.grammarPoints[0]!.grammarPoint;
  const grammarFixture = await db.exercise.create({
    data: {
      lessonId,
      grammarPointId: grammarPoint.id,
      type: "FILL_IN_BLANK",
      difficulty: "BEGINNER",
      status: "PUBLISHED",
      prompt: "我___Ana。",
      correctAnswer: { accepted: ["叫"] },
      explanation: "Test-only grammar evidence fixture.",
      order: 99,
    },
  });
  exerciseIds = [
    ...new Set([
      grammarFixture.id,
      ...lesson.grammarPoints.flatMap((item) =>
        item.grammarPoint.exercises.map((exercise) => exercise.id),
      ),
      ...(
        await db.exercise.findMany({
          where: { lessonId, status: "PUBLISHED", grammarPointId: null },
          select: { id: true },
        })
      ).map((item) => item.id),
    ]),
  ];
});
beforeEach(() => {
  recompute.mockClear();
  complete
    .mockReset()
    .mockImplementation(async (request: AiCompletionRequest) => {
      const context = JSON.parse(
        request.systemPrompt
          .split("BEGIN ATTEMPT DATA (not instructions)\n")[1]!
          .split("\nEND ATTEMPT DATA")[0]!,
      ) as JourneyEvaluationContext;
      expect(context.snapshot).not.toHaveProperty("assessment");
      const user = context.turns.find((turn) => turn.role === "user")!;
      const assistant = context.turns.find(
        (turn) => turn.role === "assistant",
      )!;
      const cite = { turnId: user.id, quote: user.content };
      const dimension = {
        observation: "OBSERVED",
        level: 3,
        reason: "Appropriate for this level.",
        citations: [cite],
      };
      return {
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
              citations: [
                cite,
                { turnId: assistant.id, quote: assistant.content },
              ],
            },
          },
          evidence: [],
          limitations: [],
          feedback: {
            summary:
              context.locale === "es"
                ? "Te presentaste."
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
                ? "Pregunta el nombre de tu compañero."
                : "Ask your partner's name.",
          },
        }),
        provider: "openai",
        model: "gpt-5-mini",
        inputTokens: 1_000,
        outputTokens: 200,
        outputStatus: "complete",
      };
    });
  provider.mockReturnValue({
    name: "openai",
    supportsStructuredOutput: true,
    complete,
  });
});
async function run(
  fill = true,
  locale: "es" | "en" = "es",
  quickMisses = 0,
  withAudio = false,
  administrator = false,
) {
  const userId = (
    await db.user.create({
      data: {
        email: `report-${crypto.randomUUID()}@example.test`,
        ...(administrator ? { role: "ADMINISTRATOR" as const } : {}),
      },
    })
  ).id;
  const progress = await db.learnerLessonProgress.create({
    data: {
      userId,
      lessonId,
      currentStepId: speakingStepId,
      startedAt: new Date(Date.now() - 60_000),
    },
  });
  if (fill) {
    await db.vocabularyQuizAttempt.createMany({
      data: vocabularyIds.map((id, index) => ({
        userId,
        lessonId,
        vocabularyItemId: id,
        questionKey: `${id}:quicktest`,
        isCorrect: index >= quickMisses,
      })),
    });
    await db.exerciseAttempt.createMany({
      data: exerciseIds.map((id) => ({
        userId,
        exerciseId: id,
        answer: {},
        isCorrect: true,
      })),
    });
  }
  const attempt = await startJourneySpeakingAttempt(userId, {
    lessonId,
    locale,
    requestKey: crypto.randomUUID(),
  });
  const audioReview = new JourneySessionAudioReview(
    attempt.id,
    locale,
    [
      {
        sequence: 1,
        itemId: "test-audio",
        content: administrator ? "你好，我叫Ana。你叫什么名字？" : "我叫Ana。",
      },
    ],
    1,
    "test-request",
    buildJourneyAudioLessonContext(
      attempt.snapshot as unknown as JourneyAttemptSnapshot,
      attempt.snapshotHash,
    ),
  );
  audioReview.handle({
    type: "response.created",
    response: {
      id: "test-response",
      metadata: {
        review_id: "test-request",
        hango_phase: JOURNEY_SESSION_AUDIO_PHASE,
      },
    },
  });
  const judgment = sessionAudioJudgment(
    attempt.id,
    "test-audio",
    1,
    administrator ? "你好，我叫Ana。你叫什么名字？" : "我叫Ana。",
    locale,
  );
  judgment.findings = [];
  const sessionAudio = audioReview.handle({
    type: "response.done",
    response: {
      id: "test-response",
      status: "completed",
      output: [
        { content: [{ type: "output_text", text: JSON.stringify(judgment) }] },
      ],
    },
  })!;
  if (withAudio) {
    const otherLocale = locale === "es" ? "en" : "es";
    await expect(
      sealJourneySpeakingAttempt(userId, {
        attemptId: attempt.id,
        lessonId,
        closeReason: "USER_END",
        turns: [
          { role: "assistant", content: "你好，你叫什么名字？" },
          {
            role: "user",
            content: administrator
              ? "你好，我叫Ana。你叫什么名字？"
              : "我叫Ana。",
          },
        ],
        quality: {
          pendingLearnerTurn: false,
          interruptedAssistant: false,
          sessionAudio: {
            ...sessionAudio,
            locale: otherLocale,
            judgment: { ...sessionAudio.judgment!, locale: otherLocale },
          },
        },
      }),
    ).rejects.toThrow("locale mismatch");
  }
  await sealJourneySpeakingAttempt(userId, {
    attemptId: attempt.id,
    lessonId,
    closeReason: "USER_END",
    turns: [
      { role: "assistant", content: "你好，你叫什么名字？" },
      {
        role: "user",
        content: administrator ? "你好，我叫Ana。你叫什么名字？" : "我叫Ana。",
      },
    ],
    ...(withAudio
      ? {
          quality: {
            pendingLearnerTurn: false,
            interruptedAssistant: false,
            sessionAudio,
          },
        }
      : {}),
  });
  return { userId, attemptId: attempt.id, progress };
}
async function select(capture: Awaited<ReturnType<typeof run>>) {
  return advanceLessonStep(capture.userId, lessonId, speakingStepId, {
    journeySpeakingAttemptId: capture.attemptId,
  });
}
async function prepareFinalStep(userId: string) {
  const steps = await db.lessonStep.findMany({
    where: { lessonId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  const finalStep = steps.at(-1)!;
  await db.learnerLessonProgress.update({
    where: { userId_lessonId: { userId, lessonId } },
    data: {
      currentStepId: finalStep.id,
      completedStepIds: steps.slice(0, -1).map((step) => step.id),
    },
  });
  return finalStep.id;
}

describe("Journey report integration (real disposable Postgres; mock AI only)", () => {
  it("rechecks the user's AI budget during explicit zero-dispatch recovery", async () => {
    const capture = await run(true, "es", 0, true, true);
    await select(capture);
    const key = {
      userId: capture.userId,
      feature: experienceLimitKey("LESSON_REFLECTION"),
    };
    await db.aiUsageUserCap.create({ data: { ...key, dailyLimitUsd: 0 } });
    await evaluateJourneyLessonReport(capture.userId, lessonId);
    await evaluateJourneyLessonReport(capture.userId, lessonId, {
      recoverFailed: true,
    });
    expect(complete).not.toHaveBeenCalled();
    expect(
      await db.journeySpeakingEvaluation.findUniqueOrThrow({
        where: { attemptId: capture.attemptId },
      }),
    ).toMatchObject({
      status: "FAILED",
      requestCount: 0,
      failureCode: "budget_blocked",
    });
    await db.aiUsageUserCap.update({
      where: { userId_feature: key },
      data: { dailyLimitUsd: 1 },
    });
    complete.mockImplementation(async (request: AiCompletionRequest) => ({
      content: JSON.stringify(unifiedWire(request.messages[0]!.content)),
      provider: "openai",
      model: "gpt-5-mini",
      inputTokens: 1000,
      outputTokens: 300,
      outputStatus: "complete",
    }));
    await evaluateJourneyLessonReport(capture.userId, lessonId, {
      recoverFailed: true,
    });
    expect(complete).toHaveBeenCalledTimes(1);
    expect(
      (await getJourneyLessonReport(capture.userId, lessonId)).unified?.phase,
    ).toBe("READY");
  });
  it("recovers a preflight failure with exactly one explicit first dispatch, no refresh purchase and no second paid request", async () => {
    const capture = await run(true, "es", 0, true, true);
    await select(capture);
    provider.mockReturnValue({
      name: "mock",
      supportsStructuredOutput: false,
      complete,
    });
    const failed = await evaluateJourneyLessonReport(capture.userId, lessonId);
    expect(failed.speaking).toMatchObject({
      canRetry: true,
      canRepairWithoutAi: false,
    });
    expect(
      await db.journeySpeakingEvaluation.findUniqueOrThrow({
        where: { attemptId: capture.attemptId },
      }),
    ).toMatchObject({
      status: "FAILED",
      requestCount: 0,
      report: null,
      failureCode: "structured_provider_unavailable",
    });
    provider.mockReturnValue({
      name: "openai",
      supportsStructuredOutput: true,
      complete,
    });
    complete.mockImplementation(async (request: AiCompletionRequest) => ({
      content: JSON.stringify(unifiedWire(request.messages[0]!.content)),
      provider: "openai",
      model: "gpt-5-mini",
      inputTokens: 1000,
      outputTokens: 300,
      outputStatus: "complete",
    }));
    await getJourneyLessonReport(capture.userId, lessonId);
    await persistJourneyLessonReport(capture.userId, lessonId);
    await evaluateJourneyLessonReport(capture.userId, lessonId);
    expect(complete).not.toHaveBeenCalled();
    await Promise.all([
      evaluateJourneyLessonReport(capture.userId, lessonId, {
        recoverFailed: true,
      }),
      evaluateJourneyLessonReport(capture.userId, lessonId, {
        recoverFailed: true,
      }),
    ]);
    expect(complete).toHaveBeenCalledTimes(1);
    const reopened = await getJourneyLessonReport(capture.userId, lessonId);
    expect(reopened.unified).toMatchObject({
      phase: "READY",
      speakingScore: 75,
      level: { lessonLevel: 1, generalLevel: 0, generalPoints: 0 },
    });
    await evaluateJourneyLessonReport(capture.userId, lessonId, {
      recoverFailed: true,
    });
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it.each(["es", "en"] as const)(
    "joins the calibrator, saved audio, six variables and exercises in the REAL admin lesson lifecycle (%s)",
    async (locale) => {
      const capture = await run(true, locale, 0, true, true);
      await select(capture);
      const stored = await getJourneySpeakingAttempt(
        capture.userId,
        capture.attemptId,
        lessonId,
      );
      expect(
        (stored.snapshot as unknown as JourneyAttemptSnapshot).evaluationPolicy,
      ).toBe(JOURNEY_UNIFIED_POLICY);
      const before = await getJourneyLessonReport(capture.userId, lessonId);
      expect(before.unified).toMatchObject({
        phase: "WAITING",
        speakingScore: null,
        lessonScore: null,
      });
      expect(complete).not.toHaveBeenCalled();
      complete.mockImplementation(async (request: AiCompletionRequest) => ({
        content: JSON.stringify(unifiedWire(request.messages[0]!.content)),
        provider: "openai",
        model: "gpt-5-mini",
        inputTokens: 1000,
        outputTokens: 300,
        outputStatus: "complete",
      }));
      await Promise.all([
        evaluateJourneyLessonReport(capture.userId, lessonId),
        evaluateJourneyLessonReport(capture.userId, lessonId),
      ]);
      const evaluated = await getJourneyLessonReport(capture.userId, lessonId);
      expect(evaluated.unified).toMatchObject({
        phase: "READY",
        speakingScore: 75,
        lessonScore: 93,
        eligibleForRewards: false,
      });
      expect(evaluated.speaking.score).toBeNull();
      expect(evaluated.rewards.eligible).toBe(false);
      expect(complete).toHaveBeenCalledTimes(1);
      const request = complete.mock.calls[0]![0] as AiCompletionRequest;
      expect(request.structuredOutput!.name).toBe("journey_evidence_selection");
      expect(request.messages[0]!.content).not.toContain("sessionAudio");
      const saved = await persistJourneyLessonReport(capture.userId, lessonId);
      const reopened = await getJourneyLessonReport(capture.userId, lessonId);
      expect(reopened.unified).toEqual(saved.unified);
      await evaluateJourneyLessonReport(capture.userId, lessonId, {
        recoverFailed: true,
      });
      expect(complete).toHaveBeenCalledTimes(1);
      const evaluation = await db.journeySpeakingEvaluation.findUniqueOrThrow({
        where: { attemptId: capture.attemptId },
      });
      expect(evaluation).toMatchObject({
        status: "PARTIAL",
        score: null,
        requestCount: 1,
      });
      expect(evaluation.report).toMatchObject({
        kind: "journey_unified_review",
        version: JOURNEY_UNIFIED_POLICY,
      });
      expect(
        await db.aiUsageLog.count({
          where: { userId: capture.userId, feature: "lesson-reflection" },
        }),
      ).toBe(1);
      expect(
        await db.coinLedgerEntry.count({ where: { userId: capture.userId } }),
      ).toBe(0);
      expect(
        await db.progressEvidence.count({
          where: { userId: capture.userId, source: "SPEAKING" },
        }),
      ).toBe(0);
      expect(recompute).not.toHaveBeenCalled();
      await expect(
        getJourneyLessonReport("another-owner", lessonId),
      ).rejects.toThrow();
      expect(
        (
          await getJourneySpeakingAttempt(
            capture.userId,
            capture.attemptId,
            lessonId,
          )
        ).captureHash,
      ).toBe(stored.captureHash);
    },
  );
  it("retains rejected integrated output privately and rechecks without repurchasing a response or erasing exercise grades", async () => {
    const capture = await run(true, "es", 0, true, true);
    await select(capture);
    complete.mockResolvedValue({
      content: "private incomplete output",
      provider: "openai",
      model: "gpt-5-mini",
      inputTokens: 1000,
      outputTokens: 100,
      outputStatus: "incomplete",
    });
    const failed = await evaluateJourneyLessonReport(capture.userId, lessonId);
    expect(failed.unified).toMatchObject({
      phase: "FAILED",
      speakingScore: null,
    });
    expect(failed.categories.vocabulary.score).toBe(100);
    expect(failed.speaking.canRepairWithoutAi).toBe(true);
    expect(JSON.stringify(failed)).not.toContain("private incomplete output");
    await evaluateJourneyLessonReport(capture.userId, lessonId, {
      recoverFailed: true,
    });
    const reopened = await persistJourneyLessonReport(capture.userId, lessonId);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(reopened.unified!.phase).toBe("FAILED");
    const evaluation = await db.journeySpeakingEvaluation.findUniqueOrThrow({
      where: { attemptId: capture.attemptId },
    });
    expect(evaluation.report).toMatchObject({
      response: { text: "private incomplete output", status: "incomplete" },
    });
    expect(evaluation.requestCount).toBe(1);
  });
  it("retains the experimental audio review across seal, JSONB integrity, evaluation, save and reopen without another provider call", async () => {
    const capture = await run(true, "es", 0, true);
    await select(capture);
    const stored = await getJourneySpeakingAttempt(
      capture.userId,
      capture.attemptId,
      lessonId,
    );
    const before = await getJourneyLessonReport(capture.userId, lessonId);
    expect(before.speaking.sessionAudio).toMatchObject({
      status: "REVIEWED",
      attemptId: capture.attemptId,
      judgment: { dimensions: { tones: { level: 3 } } },
    });
    expect(complete).not.toHaveBeenCalled();
    const evaluated = await evaluateJourneyLessonReport(
      capture.userId,
      lessonId,
    );
    expect(evaluated.speaking.score).toBe(75);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(complete.mock.calls[0]![0].systemPrompt).not.toContain(
      "UNVERIFIED_BROWSER_REALTIME_REVIEW",
    );
    expect(complete.mock.calls[0]![0].systemPrompt).not.toContain(
      "sessionAudio",
    );
    await db.learnerProfile.create({
      data: { userId: capture.userId, displayName: "Audio test learner" },
    });
    await persistJourneyLessonReport(capture.userId, lessonId);
    const reopened = await getJourneyLessonReport(capture.userId, lessonId);
    expect(reopened.speaking.sessionAudio).toEqual(
      before.speaking.sessionAudio,
    );
    expect(reopened.speaking.score).toBe(75);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(
      (
        await getJourneySpeakingAttempt(
          capture.userId,
          capture.attemptId,
          lessonId,
        )
      ).captureHash,
    ).toBe(stored.captureHash);
    await expect(
      getJourneySpeakingAttempt("different-owner", capture.attemptId, lessonId),
    ).rejects.toThrow("Attempt unavailable");
  });
  it("a passing quick test keeps wrong answers and never invents remedial missing questions", async () => {
    const capture = await run(true, "es", 1);
    await select(capture);
    const stored = await getJourneySpeakingAttempt(
      capture.userId,
      capture.attemptId,
      lessonId,
    );
    const snapshot = stored.snapshot as unknown as JourneyAttemptSnapshot;
    expect(summarizeJourneyQuiz(snapshot.assessment!.vocabulary)).toMatchObject(
      {
        state: "COMPLETE",
        total: vocabularyIds.length,
        incorrect: 1,
        missing: 0,
      },
    );
    const report = await getJourneyLessonReport(capture.userId, lessonId);
    expect(report.categories.vocabulary.score).toBe(
      Math.round(((vocabularyIds.length - 1) / vocabularyIds.length) * 100),
    );
    expect(complete).not.toHaveBeenCalled();
  });
  it("repairs the prior frozen quick-test projection read-only using original server answers", async () => {
    const capture = await run(true, "es", 1);
    const stored = await getJourneySpeakingAttempt(
      capture.userId,
      capture.attemptId,
      lessonId,
    );
    const snapshot = stored.snapshot as unknown as JourneyAttemptSnapshot;
    // Simulate the previous server release's immutable snapshot, with a valid
    // hash, not a browser-selected grade. Only the test database is altered.
    const missed = `${vocabularyIds[0]}:quicktest`;
    snapshot.assessment!.vocabulary = snapshot.assessment!.vocabulary.flatMap(
      (entry) =>
        entry.key === missed
          ? ["order", "meaning", "chineseForm", "blank:2"].map((kind) => ({
              key: `${vocabularyIds[0]}:${kind}`,
              attemptId: null,
              result: null,
            }))
          : [entry],
    );
    function canonical(value: unknown): unknown {
      if (Array.isArray(value)) return value.map(canonical);
      if (value && typeof value === "object")
        return Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
            .map(([key, entry]) => [key, canonical(entry)]),
        );
      return value;
    }
    const hash = createHash("sha256")
      .update(JSON.stringify(canonical(snapshot)))
      .digest("hex");
    await db.journeySpeakingAttempt.update({
      where: { id: capture.attemptId },
      data: {
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
        snapshotHash: hash,
      },
    });
    await select(capture);
    const report = await getJourneyLessonReport(capture.userId, lessonId);
    expect(report.categories.vocabulary).toMatchObject({
      state: "COMPLETE",
      incorrect: 1,
      missing: 0,
      total: vocabularyIds.length,
    });
    const unchanged = await getJourneySpeakingAttempt(
      capture.userId,
      capture.attemptId,
      lessonId,
    );
    expect(unchanged.snapshotHash).toBe(hash);
    expect(unchanged.snapshot).toEqual(snapshot);
    expect(complete).not.toHaveBeenCalled();
  });
  it("final completion is blocked until a complete result is settled, even through a direct server call", async () => {
    const capture = await run();
    await db.learnerProfile.create({ data: { userId: capture.userId } });
    await select(capture);
    await evaluateJourneyLessonReport(capture.userId, lessonId);
    const finalStep = await prepareFinalStep(capture.userId);
    await expect(
      advanceLessonStep(capture.userId, lessonId, finalStep, undefined),
    ).rejects.toThrow("complete saved Journey report");
    expect(
      await db.learnerLessonCompletion.count({
        where: { userId: capture.userId, lessonId },
      }),
    ).toBe(0);
    await persistJourneyLessonReport(capture.userId, lessonId);
    await advanceLessonStep(capture.userId, lessonId, finalStep, undefined);
    expect(
      await db.learnerLessonCompletion.count({
        where: { userId: capture.userId, lessonId },
      }),
    ).toBe(1);
    const coins = await db.coinLedgerEntry.count({
      where: { userId: capture.userId },
    });
    await advanceLessonStep(capture.userId, lessonId, finalStep, undefined);
    expect(
      await db.coinLedgerEntry.count({ where: { userId: capture.userId } }),
    ).toBe(coins);
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it("a v2 selection cannot be removed to return to global-chat legacy grading", async () => {
    const capture = await run();
    await select(capture);
    await db.learnerLessonProgress.update({
      where: { id: capture.progress.id },
      data: { currentStepId: speakingStepId },
    });
    await expect(
      advanceLessonStep(capture.userId, lessonId, speakingStepId, {}),
    ).rejects.toThrow("cannot fall back");
    expect(await usesJourneyLessonReport(capture.userId, lessonId)).toBe(true);
  });
  it("an expired worker becomes a read-only failure, never a second dispatch or a zero grade", async () => {
    const capture = await run();
    await select(capture);
    await db.journeySpeakingEvaluation.create({
      data: {
        attemptId: capture.attemptId,
        rubricVersion: JOURNEY_RUBRIC_VERSION,
        locale: "es",
        status: "PROCESSING",
        requestCount: 1,
        processingStartedAt: new Date(Date.now() - 121_000),
      },
    });
    const report = await getJourneyLessonReport(capture.userId, lessonId);
    expect(report.speaking.state).toBe("FAILED");
    expect(report.overall.score).toBeNull();
    expect(complete).not.toHaveBeenCalled();
    expect(
      (
        await db.journeySpeakingEvaluation.findUniqueOrThrow({
          where: { attemptId: capture.attemptId },
        })
      ).status,
    ).toBe("PROCESSING");
    const saved = await persistJourneyLessonReport(capture.userId, lessonId);
    expect(saved.speaking.state).toBe("FAILED");
    expect(saved.rewards.eligible).toBe(false);
    expect(complete).not.toHaveBeenCalled();
  });
  it("routes a microphone-unavailable run to its own partial report without any AI spend", async () => {
    const user = await db.user.create({
      data: { email: `no-voice-${crypto.randomUUID()}@example.test` },
    });
    await db.learnerLessonProgress.create({
      data: { userId: user.id, lessonId, currentStepId: speakingStepId },
    });
    expect(await usesJourneyLessonReport(user.id, lessonId)).toBe(false);
    const attempt = await startJourneySpeakingAttempt(user.id, {
      lessonId,
      locale: "es",
      requestKey: crypto.randomUUID(),
    });
    await sealJourneySpeakingAttempt(user.id, {
      attemptId: attempt.id,
      lessonId,
      closeReason: "TECHNICAL_FAILURE",
      turns: [],
    });
    await advanceLessonStep(user.id, lessonId, speakingStepId, {
      journeySpeakingAttemptId: attempt.id,
    });
    expect(await usesJourneyLessonReport(user.id, lessonId)).toBe(true);
    expect(
      (await getJourneyLessonReport(user.id, lessonId)).speaking.state,
    ).toBe("INSUFFICIENT");
    const report = await persistJourneyLessonReport(user.id, lessonId);
    expect(report.speaking.state).toBe("INSUFFICIENT");
    expect(report.overall.score).toBeNull();
    expect(report.rewards.eligible).toBe(false);
    expect(complete).not.toHaveBeenCalled();
    expect(await db.aiUsageLog.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.coinLedgerEntry.count({ where: { userId: user.id } })).toBe(
      0,
    );
    expect(
      await getOrGenerateScenarioCompletion(user.id, scenarioId),
    ).toBeNull();
    const finalStep = await prepareFinalStep(user.id);
    await expect(
      advanceLessonStep(user.id, lessonId, finalStep, undefined),
    ).rejects.toThrow("complete saved Journey report");
    expect(
      await db.learnerLessonCompletion.count({
        where: { userId: user.id, lessonId },
      }),
    ).toBe(0);
    expect(await db.achievement.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.coinLedgerEntry.count({ where: { userId: user.id } })).toBe(
      0,
    );
  });
  it("a read selects the exact completed Speaking response, performs no AI or reward/legacy writes", async () => {
    const capture = await run();
    await expect(
      getJourneyLessonReport(capture.userId, lessonId),
    ).rejects.toThrow("Completed Speaking step required");
    await select(capture);
    // A newer conversation is not automatically selected for this result.
    const newer = await startJourneySpeakingAttempt(capture.userId, {
      lessonId,
      locale: "es",
      requestKey: crypto.randomUUID(),
    });
    const report = await getJourneyLessonReport(capture.userId, lessonId);
    expect(report.attemptId).toBe(capture.attemptId);
    expect(report.attemptId).not.toBe(newer.id);
    expect(report.overall).toEqual({
      state: "PENDING",
      score: null,
      stars: null,
    });
    expect(report.categories.vocabulary.score).toBe(100);
    expect(complete).not.toHaveBeenCalled();
    expect(
      await db.journeySpeakingEvaluation.count({
        where: { attemptId: capture.attemptId },
      }),
    ).toBe(0);
    expect(
      await db.lessonReflectionReport.count({
        where: { userId: capture.userId },
      }),
    ).toBe(0);
    expect(
      await db.coinLedgerEntry.count({ where: { userId: capture.userId } }),
    ).toBe(0);
    expect(
      await db.aiConversation.count({ where: { userId: capture.userId } }),
    ).toBe(0);
  });
  it.each(["es", "en"] as const)(
    "explicit %s generation is one shared call; visits never translate or reevaluate",
    async (locale) => {
      const capture = await run(true, locale);
      await select(capture);
      const report = await evaluateJourneyLessonReport(
        capture.userId,
        lessonId,
      );
      expect(report.locale).toBe(locale);
      expect(report.overall).toEqual({
        state: "COMPLETE",
        score: 93,
        stars: 3,
      });
      expect(report.speaking.score).toBe(75);
      expect(report.rewards).toEqual({
        eligible: true,
        settlement: "NOT_SETTLED",
      });
      expect(await getJourneyLessonReport(capture.userId, lessonId)).toEqual(
        report,
      );
      expect(
        await evaluateJourneyLessonReport(capture.userId, lessonId),
      ).toEqual(report);
      expect(complete).toHaveBeenCalledTimes(1);
      expect(
        await db.aiUsageLog.count({
          where: { userId: capture.userId, experience: "LESSON_REFLECTION" },
        }),
      ).toBe(1);
      expect(
        await db.lessonReflectionReport.count({
          where: { userId: capture.userId },
        }),
      ).toBe(0);
      expect(
        await db.coinLedgerEntry.count({ where: { userId: capture.userId } }),
      ).toBe(0);
    },
  );
  it("no quiz evidence is not a wrong answer or an inflated complete grade", async () => {
    const capture = await run(false);
    await select(capture);
    const report = await evaluateJourneyLessonReport(capture.userId, lessonId);
    expect(report.speaking.score).toBe(75);
    for (const category of Object.values(report.categories))
      expect(category).toMatchObject({
        state: "MISSING",
        score: null,
        correct: 0,
        incorrect: 0,
      });
    expect(report.overall).toEqual({
      state: "PARTIAL",
      score: null,
      stars: null,
    });
    expect(report.rewards.eligible).toBe(false);
  });
  it("captures first graded answers, ungraded answers, and scope without making NULL wrong", async () => {
    const capture = await run(false);
    const id = exerciseIds[0]!;
    await db.exerciseAttempt.createMany({
      data: [
        {
          userId: capture.userId,
          exerciseId: id,
          answer: {},
          isCorrect: null,
          createdAt: new Date(Date.now() - 5_000),
        },
        { userId: capture.userId, exerciseId: id, answer: {}, isCorrect: true },
      ],
    });
    const wordId = vocabularyIds[0]!;
    await db.vocabularyQuizAttempt.createMany({
      data: [
        {
          userId: capture.userId,
          lessonId,
          vocabularyItemId: wordId,
          questionKey: `${wordId}:quicktest`,
          isCorrect: false,
          createdAt: new Date(Date.now() - 5_000),
        },
        {
          userId: capture.userId,
          lessonId,
          vocabularyItemId: wordId,
          questionKey: `${wordId}:quicktest`,
          isCorrect: true,
        },
        {
          userId: capture.userId,
          lessonId,
          vocabularyItemId: wordId,
          questionKey: "invented",
          isCorrect: true,
        },
      ],
    });
    const snapshot = await getJourneyAssessmentSnapshot(
      capture.userId,
      lessonId,
    );
    expect(snapshot).toBeDefined();
    expect(
      snapshot!.vocabulary.some(
        (item) => item.key.endsWith(":quicktest") || item.key === "invented",
      ),
    ).toBe(false);
    const entries = [...snapshot!.grammar, ...snapshot!.comprehension];
    const pending = entries.find((item) => item.key === id)!;
    expect(pending.result).toBeNull();
    expect(pending.attemptId).not.toBeNull();
    expect(summarizeJourneyQuiz([pending])).toMatchObject({
      pending: 1,
      incorrect: 0,
      score: null,
    });
  });
  it("freezes quiz evidence and does not retroactively change a report when an answer is later modified", async () => {
    const capture = await run();
    await select(capture);
    const report = await evaluateJourneyLessonReport(capture.userId, lessonId);
    await db.exerciseAttempt.updateMany({
      where: { userId: capture.userId },
      data: { isCorrect: false },
    });
    await db.vocabularyQuizAttempt.updateMany({
      where: { userId: capture.userId },
      data: { isCorrect: false },
    });
    expect(await getJourneyLessonReport(capture.userId, lessonId)).toEqual(
      report,
    );
    expect(complete).toHaveBeenCalledTimes(1);
  });
  it("rejects foreign, active, cancelled, wrong-step, extra grade fields and previous-run associations", async () => {
    const capture = await run();
    const other = await run();
    await expect(
      advanceLessonStep(capture.userId, lessonId, speakingStepId, {
        journeySpeakingAttemptId: other.attemptId,
      }),
    ).rejects.toThrow("sealed attempt");
    await expect(
      advanceLessonStep(capture.userId, lessonId, speakingStepId, {
        journeySpeakingAttemptId: capture.attemptId,
        score: 100,
      }),
    ).rejects.toThrow();
    await db.learnerLessonProgress.update({
      where: { id: capture.progress.id },
      data: { currentStepId: firstStepId },
    });
    await expect(
      advanceLessonStep(capture.userId, lessonId, firstStepId, {
        journeySpeakingAttemptId: capture.attemptId,
      }),
    ).rejects.toThrow("only to the Speaking step");
    await db.learnerLessonProgress.update({
      where: { id: capture.progress.id },
      data: { currentStepId: speakingStepId },
    });
    const active = await startJourneySpeakingAttempt(capture.userId, {
      lessonId,
      locale: "es",
      requestKey: crypto.randomUUID(),
    });
    await expect(
      advanceLessonStep(capture.userId, lessonId, speakingStepId, {
        journeySpeakingAttemptId: active.id,
      }),
    ).rejects.toThrow("sealed attempt");
    await sealJourneySpeakingAttempt(capture.userId, {
      attemptId: active.id,
      lessonId,
      closeReason: "ABANDONED",
      turns: [],
    });
    await expect(
      advanceLessonStep(capture.userId, lessonId, speakingStepId, {
        journeySpeakingAttemptId: active.id,
      }),
    ).rejects.toThrow("sealed attempt");
    await db.learnerLessonProgress.delete({
      where: { id: capture.progress.id },
    });
    await db.learnerLessonProgress.create({
      data: { userId: capture.userId, lessonId, currentStepId: speakingStepId },
    });
    await expect(select(capture)).rejects.toThrow("sealed attempt");
    expect(complete).not.toHaveBeenCalled();
  });
  it("a corrupted cached score is not accepted and does not cause a paid regeneration", async () => {
    const capture = await run();
    await select(capture);
    await evaluateJourneyLessonReport(capture.userId, lessonId);
    await db.journeySpeakingEvaluation.update({
      where: { attemptId: capture.attemptId },
      data: { score: 100 },
    });
    const report = await getJourneyLessonReport(capture.userId, lessonId);
    expect(report.speaking).toEqual({
      state: "FAILED",
      canRetry: false,
      canRepairWithoutAi: false,
      score: null,
      report: null,
      reason: "EVALUATION_FAILED",
    });
    expect(report.overall.score).toBeNull();
    expect(
      (await evaluateJourneyLessonReport(capture.userId, lessonId)).speaking
        .state,
    ).toBe("FAILED");
    expect(complete).toHaveBeenCalledTimes(1);
    const attempt = await getJourneySpeakingAttempt(
      capture.userId,
      capture.attemptId,
      lessonId,
    );
    expect(
      (attempt.snapshot as unknown as JourneyAttemptSnapshot).assessment
        ?.progressId,
    ).toBe(capture.progress.id);
  });

  it("persists the validated grade, GP, evidence and coins once under concurrent saves", async () => {
    const capture = await run();
    await db.learnerProfile.create({ data: { userId: capture.userId } });
    await select(capture);
    await evaluateJourneyLessonReport(capture.userId, lessonId);
    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        persistJourneyLessonReport(capture.userId, lessonId),
      ),
    );
    expect(results.every((r) => r.rewards.settlement === "SETTLED")).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
    const row = await db.lessonReflectionReport.findUniqueOrThrow({
      where: { userId_lessonId: { userId: capture.userId, lessonId } },
    });
    expect(row.totalScore).toBe(93);
    expect(row.speakingScore).toBe(75);
    expect(row.speakingDimensions).not.toHaveProperty("pronunciation");
    expect(row.rewardsGrantedAt).not.toBeNull();
    expect(row.speakingDimensions).toMatchObject({
      attemptId: capture.attemptId,
      progressId: capture.progress.id,
    });
    expect(
      await db.coinLedgerEntry.findMany({
        where: { userId: capture.userId, sourceKey: `lesson:${lessonId}` },
      }),
    ).toMatchObject([{ amount: 3 }]);
    const profile = await db.learnerProfile.findUniqueOrThrow({
      where: { userId: capture.userId },
    });
    expect(profile.generalLevelPoints).toBeGreaterThan(0);
    expect(
      await getOrGenerateScenarioCompletion(capture.userId, scenarioId),
    ).toBeNull();
    const evidence = await db.progressEvidence.findMany({
      where: {
        userId: capture.userId,
        relatedActivityId: `lesson-reflection-speaking:${lessonId}`,
      },
    });
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence.every((e) => e.result === 0.75)).toBe(true);
    const visited = await getJourneyLessonReport(capture.userId, lessonId);
    expect(visited).toEqual(results[0]);
    await persistJourneyLessonReport(capture.userId, lessonId);
    expect(
      (
        await db.learnerProfile.findUniqueOrThrow({
          where: { userId: capture.userId },
        })
      ).generalLevelPoints,
    ).toBe(profile.generalLevelPoints);
    expect(
      await db.progressEvidence.count({
        where: {
          userId: capture.userId,
          relatedActivityId: `lesson-reflection-speaking:${lessonId}`,
        },
      }),
    ).toBe(evidence.length);
    expect(
      (
        await db.lessonReflectionReport.findUniqueOrThrow({
          where: { id: row.id },
        })
      ).rewardsGrantedAt,
    ).toEqual(row.rewardsGrantedAt);

    // Complete the remaining lessons with explicitly authored legacy fixtures:
    // finalizing the scenario replaces its running share, never adds it twice.
    const siblings = await db.lesson.findMany({
      where: {
        id: { not: lessonId },
        status: "PUBLISHED",
        scenarioLevel: { scenarioId },
      },
      select: { id: true },
    });
    await db.lessonReflectionReport.createMany({
      data: siblings.map((lesson) => ({
        userId: capture.userId,
        lessonId: lesson.id,
        vocabularyCovered: 0,
        vocabularyTotal: 0,
        totalScore: 93,
        hanNarrative: "Test-only graded fixture",
        strengths: [],
        improvements: [],
      })),
    });
    await recompute(capture.userId);
    const beforeClosing = (
      await db.learnerProfile.findUniqueOrThrow({
        where: { userId: capture.userId },
      })
    ).generalLevelPoints;
    expect(
      await getOrGenerateScenarioCompletion(capture.userId, scenarioId),
    ).not.toBeNull();
    expect(
      (
        await db.learnerProfile.findUniqueOrThrow({
          where: { userId: capture.userId },
        })
      ).generalLevelPoints,
    ).toBeCloseTo(beforeClosing, 10);
    await getOrGenerateScenarioCompletion(capture.userId, scenarioId);
    expect(
      await db.coinLedgerEntry.count({
        where: { userId: capture.userId, sourceKey: `scenario:${scenarioId}` },
      }),
    ).toBe(1);
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("stores a partial grade as NULL without coins, competence or scenario completion", async () => {
    const capture = await run(false);
    await db.learnerProfile.create({ data: { userId: capture.userId } });
    await select(capture);
    await evaluateJourneyLessonReport(capture.userId, lessonId);
    const report = await persistJourneyLessonReport(capture.userId, lessonId);
    expect(report.rewards).toEqual({
      eligible: false,
      settlement: "NOT_SETTLED",
    });
    const row = await db.lessonReflectionReport.findUniqueOrThrow({
      where: { userId_lessonId: { userId: capture.userId, lessonId } },
    });
    expect(row.totalScore).toBeNull();
    expect(row.rewardsGrantedAt).toBeNull();
    expect(
      await db.coinLedgerEntry.count({ where: { userId: capture.userId } }),
    ).toBe(0);
    expect(
      await db.progressEvidence.count({ where: { userId: capture.userId } }),
    ).toBe(0);
    expect(
      await getOrGenerateScenarioCompletion(capture.userId, scenarioId),
    ).toBeNull();
    expect(
      (
        await db.learnerProfile.findUniqueOrThrow({
          where: { userId: capture.userId },
        })
      ).generalLevelPoints,
    ).toBe(0);
  });

  it("rolls back the whole settlement on failure and retries saving without another AI call", async () => {
    const capture = await run();
    await db.learnerProfile.create({ data: { userId: capture.userId } });
    await select(capture);
    await evaluateJourneyLessonReport(capture.userId, lessonId);
    recompute.mockRejectedValueOnce(new Error("test settlement failure"));
    await expect(
      persistJourneyLessonReport(capture.userId, lessonId),
    ).rejects.toThrow("test settlement failure");
    expect(
      await db.lessonReflectionReport.count({
        where: { userId: capture.userId },
      }),
    ).toBe(0);
    expect(
      await db.coinLedgerEntry.count({ where: { userId: capture.userId } }),
    ).toBe(0);
    expect(
      await db.achievement.count({ where: { userId: capture.userId } }),
    ).toBe(0);
    expect(
      await db.progressEvidence.count({ where: { userId: capture.userId } }),
    ).toBe(0);
    expect(
      (await persistJourneyLessonReport(capture.userId, lessonId)).rewards
        .settlement,
    ).toBe("SETTLED");
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("legacy readers cannot regenerate or overwrite selected v2 evidence, even before saving", async () => {
    const capture = await run();
    await select(capture);
    await expect(
      getOrGenerateLessonReflectionReport(capture.userId, lessonId),
    ).rejects.toThrow("Journey v2 report reader");
    await expect(
      getLessonScoreBreakdown(capture.userId, lessonId),
    ).rejects.toThrow("Journey v2 report reader");
    expect(complete).not.toHaveBeenCalled();
    await db.learnerProfile.create({ data: { userId: capture.userId } });
    await evaluateJourneyLessonReport(capture.userId, lessonId);
    await persistJourneyLessonReport(capture.userId, lessonId);
    await expect(
      getOrGenerateLessonReflectionReport(capture.userId, lessonId),
    ).rejects.toThrow("Journey v2 report reader");
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("does not replace an existing legacy grade or confirm a tampered settled projection", async () => {
    const capture = await run();
    await db.learnerProfile.create({ data: { userId: capture.userId } });
    await select(capture);
    await evaluateJourneyLessonReport(capture.userId, lessonId);
    const old = await db.lessonReflectionReport.create({
      data: {
        userId: capture.userId,
        lessonId,
        vocabularyCovered: 0,
        vocabularyTotal: 0,
        totalScore: 40,
        hanNarrative: "old",
        strengths: [],
        improvements: [],
      },
    });
    await expect(
      persistJourneyLessonReport(capture.userId, lessonId),
    ).rejects.toThrow("explicit redo required");
    expect(
      (
        await db.lessonReflectionReport.findUniqueOrThrow({
          where: { id: old.id },
        })
      ).totalScore,
    ).toBe(40);
    // Removing this fixture is explicitly limited to the disposable DB.
    await db.lessonReflectionReport.delete({ where: { id: old.id } });
    await persistJourneyLessonReport(capture.userId, lessonId);
    await db.lessonReflectionReport.update({
      where: { userId_lessonId: { userId: capture.userId, lessonId } },
      data: { totalScore: 100 },
    });
    expect(
      (await getJourneyLessonReport(capture.userId, lessonId)).rewards
        .settlement,
    ).toBe("NOT_SETTLED");
    await expect(
      persistJourneyLessonReport(capture.userId, lessonId),
    ).rejects.toThrow("integrity failure");
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("redo removes the old GP contribution and previous attempts cannot settle the new run", async () => {
    const capture = await run();
    await db.learnerProfile.create({ data: { userId: capture.userId } });
    await select(capture);
    await evaluateJourneyLessonReport(capture.userId, lessonId);
    await persistJourneyLessonReport(capture.userId, lessonId);
    await redoLesson(capture.userId, lessonId);
    expect(
      await db.progressEvidence.count({
        where: {
          userId: capture.userId,
          relatedActivityId: `lesson-reflection-speaking:${lessonId}`,
        },
      }),
    ).toBe(0);
    expect(
      (
        await db.learnerProfile.findUniqueOrThrow({
          where: { userId: capture.userId },
        })
      ).generalLevelPoints,
    ).toBe(0);
    const progress = await db.learnerLessonProgress.create({
      data: { userId: capture.userId, lessonId, currentStepId: speakingStepId },
    });
    await expect(select(capture)).rejects.toThrow("sealed attempt");
    await expect(
      persistJourneyLessonReport(capture.userId, lessonId),
    ).rejects.toThrow("Completed Speaking step");
    // Real new run, same lesson: projection replaces, coins never stack.
    await db.vocabularyQuizAttempt.createMany({
      data: vocabularyIds.map((id) => ({
        userId: capture.userId,
        lessonId,
        vocabularyItemId: id,
        questionKey: `${id}:quicktest`,
        isCorrect: true,
      })),
    });
    await db.exerciseAttempt.createMany({
      data: exerciseIds.map((id) => ({
        userId: capture.userId,
        exerciseId: id,
        answer: {},
        isCorrect: true,
      })),
    });
    const attempt = await startJourneySpeakingAttempt(capture.userId, {
      lessonId,
      locale: "es",
      requestKey: crypto.randomUUID(),
    });
    await sealJourneySpeakingAttempt(capture.userId, {
      attemptId: attempt.id,
      lessonId,
      closeReason: "USER_END",
      turns: [
        { role: "assistant", content: "你好，你叫什么名字？" },
        { role: "user", content: "我叫Ana。" },
      ],
    });
    await select({ ...capture, attemptId: attempt.id, progress });
    await evaluateJourneyLessonReport(capture.userId, lessonId);
    await persistJourneyLessonReport(capture.userId, lessonId);
    expect(
      await db.coinLedgerEntry.count({
        where: { userId: capture.userId, sourceKey: `lesson:${lessonId}` },
      }),
    ).toBe(1);
    expect(
      (
        await db.learnerProfile.findUniqueOrThrow({
          where: { userId: capture.userId },
        })
      ).generalLevelPoints,
    ).toBeGreaterThan(0);
    expect(complete).toHaveBeenCalledTimes(2);
  });
});
