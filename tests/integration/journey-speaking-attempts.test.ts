import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  getJourneySpeakingAttempt,
  sealJourneySpeakingAttempt,
  startJourneySpeakingAttempt,
} from "@/lib/journey-speaking-attempts";
import { getJourneyRealtimeBinding } from "@/lib/journey-speaking-realtime-binding";

const destination = new URL(process.env.DATABASE_URL ?? "http://missing");
if (
  destination.hostname !== "127.0.0.1" ||
  destination.port !== "54329" ||
  destination.pathname !== "/hango_local_test"
)
  throw new Error("Run only with the disposable local integration runner.");
let userId: string;
let otherUserId: string;
let lessonId: string;
let otherLessonId: string;
beforeAll(async () => {
  userId = (
    await db.user.create({
      data: { email: `attempt-a-${crypto.randomUUID()}@example.test` },
    })
  ).id;
  otherUserId = (
    await db.user.create({
      data: { email: `attempt-b-${crypto.randomUUID()}@example.test` },
    })
  ).id;
  lessonId = (
    await db.lesson.findUniqueOrThrow({
      where: { slug: "foundations-greetings-and-introductions" },
      select: { id: true },
    })
  ).id;
  otherLessonId = (
    await db.lesson.findUniqueOrThrow({
      where: { slug: "family-introducing-your-family" },
      select: { id: true },
    })
  ).id;
});
describe("Journey independent sealed attempts (disposable Postgres)", () => {
  it("freezes earned General Level for the lesson and never takes points from the browser or changes old attempts on reopen", async () => {
    const user = await db.user.create({
      data: {
        email: `level-${crypto.randomUUID()}@example.test`,
        learnerProfile: { create: { generalLevelPoints: 350 } },
      },
    });
    const request = { lessonId, requestKey: crypto.randomUUID(), locale: "es" };
    const first = await startJourneySpeakingAttempt(user.id, request);
    expect(first.snapshot).toMatchObject({
      speakingLevel: {
        generalPoints: 350,
        generalLevel: 2,
        lessonLevel: 1,
        entryLevel: 1,
        stretchLevel: 2,
      },
    });
    await db.learnerProfile.update({
      where: { userId: user.id },
      data: { generalLevelPoints: 1800 },
    });
    const replay = await startJourneySpeakingAttempt(user.id, request);
    expect(replay.snapshotHash).toBe(first.snapshotHash);
    const binding = await getJourneyRealtimeBinding(
      user.id,
      first.id,
      lessonId,
    );
    expect(binding.audioContext).toMatchObject({
      contextHash: first.snapshotHash,
      level: { generalPoints: 350 },
    });
    expect(binding.rolePlay.journeyLevel?.generalPoints).toBe(350);
    const next = await startJourneySpeakingAttempt(user.id, {
      ...request,
      requestKey: crypto.randomUUID(),
    });
    expect(next.snapshot).toMatchObject({
      speakingLevel: {
        generalPoints: 1800,
        generalLevel: 8,
        lessonLevel: 1,
        stretchLevel: 2,
      },
    });
    await expect(
      startJourneySpeakingAttempt(user.id, {
        ...request,
        requestKey: crypto.randomUUID(),
        generalPoints: 9999,
      }),
    ).rejects.toThrow();
  });
  it("scopes idempotency to owner, freezes server banks and does not write Tutor chat or progress", async () => {
    const requestKey = crypto.randomUUID();
    const before = await db.learnerLessonProgress.count({ where: { userId } });
    const first = await startJourneySpeakingAttempt(userId, {
      lessonId,
      requestKey,
      locale: "es",
    });
    const replay = await startJourneySpeakingAttempt(userId, {
      lessonId,
      requestKey,
      locale: "es",
    });
    const other = await startJourneySpeakingAttempt(otherUserId, {
      lessonId,
      requestKey,
      locale: "es",
    });
    expect(first.id).toBe(replay.id);
    expect(other.id).not.toBe(first.id);
    expect(first.captureSource).toBe("browser-captured");
    expect(first.snapshotHash).toHaveLength(64);
    expect((first.snapshot as { lessonId: string }).lessonId).toBe(lessonId);
    expect(first.bankVersion).toContain("advanced-");
    expect(await db.aiConversation.count({ where: { userId } })).toBe(0);
    expect(await db.learnerLessonProgress.count({ where: { userId } })).toBe(
      before,
    );
    await expect(
      startJourneySpeakingAttempt(userId, {
        lessonId: otherLessonId,
        requestKey,
        locale: "es",
      }),
    ).rejects.toThrow("Request key already used");
    await expect(
      startJourneySpeakingAttempt(userId, {
        lessonId,
        requestKey,
        locale: "en",
      }),
    ).rejects.toThrow("Request key already used");
    await sealJourneySpeakingAttempt(userId, {
      attemptId: first.id,
      lessonId,
      closeReason: "ABANDONED",
      turns: [],
    });
    await sealJourneySpeakingAttempt(otherUserId, {
      attemptId: other.id,
      lessonId,
      closeReason: "ABANDONED",
      turns: [],
    });
  });
  it("keeps retries independent, seals once and never combines turns by lesson title", async () => {
    const first = await startJourneySpeakingAttempt(userId, {
      lessonId,
      requestKey: crypto.randomUUID(),
      locale: "es",
    });
    const second = await startJourneySpeakingAttempt(userId, {
      lessonId,
      requestKey: crypto.randomUUID(),
      locale: "es",
    });
    const input = {
      attemptId: first.id,
      lessonId,
      closeReason: "USER_END",
      turns: [
        { role: "assistant", content: "你好。" },
        { role: "user", content: "我叫Arean。" },
      ],
    };
    await sealJourneySpeakingAttempt(userId, input);
    await sealJourneySpeakingAttempt(userId, input);
    await expect(
      sealJourneySpeakingAttempt(userId, {
        ...input,
        turns: [{ role: "user", content: "Changed" }],
      }),
    ).rejects.toThrow("already sealed");
    await sealJourneySpeakingAttempt(userId, {
      attemptId: second.id,
      lessonId,
      closeReason: "USER_END",
      turns: [{ role: "user", content: "我是老师。" }],
    });
    const one = await getJourneySpeakingAttempt(userId, first.id, lessonId);
    const two = await getJourneySpeakingAttempt(userId, second.id, lessonId);
    expect(one.turns.map((turn) => turn.content)).toEqual([
      "你好。",
      "我叫Arean。",
    ]);
    expect(two.turns.map((turn) => turn.content)).toEqual(["我是老师。"]);
    expect(one.status).toBe("SEALED");
    expect(one.finishedAt).not.toBeNull();
    expect(one.turns.map((turn) => turn.sequence)).toEqual([0, 1]);
    expect(one.evaluation).toBeNull(); // Sealing does not call AI or award points.
  });
  it("rejects access or writes from another account and a different lesson", async () => {
    const attempt = await startJourneySpeakingAttempt(userId, {
      lessonId,
      requestKey: crypto.randomUUID(),
      locale: "en",
    });
    const input = {
      attemptId: attempt.id,
      lessonId,
      closeReason: "NATURAL",
      turns: [{ role: "user", content: "你好。" }],
    };
    await expect(
      getJourneySpeakingAttempt(otherUserId, attempt.id, lessonId),
    ).rejects.toThrow("unavailable");
    await expect(
      getJourneySpeakingAttempt(userId, attempt.id, otherLessonId),
    ).rejects.toThrow("unavailable");
    await expect(
      sealJourneySpeakingAttempt(otherUserId, input),
    ).rejects.toThrow("unavailable");
    await expect(
      sealJourneySpeakingAttempt(userId, { ...input, lessonId: otherLessonId }),
    ).rejects.toThrow("unavailable");
    expect(
      (await getJourneySpeakingAttempt(userId, attempt.id, lessonId)).status,
    ).toBe("ACTIVE");
    await sealJourneySpeakingAttempt(userId, {
      ...input,
      turns: [],
      closeReason: "TECHNICAL_FAILURE",
    });
    expect(
      (await getJourneySpeakingAttempt(userId, attempt.id, lessonId)).status,
    ).toBe("TECHNICAL_FAILURE");
  });
  it("rejects locked beta chapters, unavailable lessons and client-supplied grades/banks", async () => {
    const advanced = await db.lesson.findUniqueOrThrow({
      where: { slug: "work-office-introducing-yourself-professionally" },
      select: { id: true },
    });
    await expect(
      startJourneySpeakingAttempt(userId, {
        lessonId: advanced.id,
        requestKey: crypto.randomUUID(),
        locale: "es",
      }),
    ).rejects.toThrow("unavailable");
    await expect(
      startJourneySpeakingAttempt(userId, {
        lessonId: "missing",
        requestKey: crypto.randomUUID(),
        locale: "es",
      }),
    ).rejects.toThrow("unavailable");
    await expect(
      startJourneySpeakingAttempt(userId, {
        lessonId,
        requestKey: crypto.randomUUID(),
        locale: "es",
        score: 100,
      }),
    ).rejects.toThrow();
    await expect(
      startJourneySpeakingAttempt(userId, {
        lessonId,
        requestKey: crypto.randomUUID(),
        locale: "es",
        snapshot: {},
      }),
    ).rejects.toThrow();
    expect(await db.lessonReflectionReport.count({ where: { userId } })).toBe(
      0,
    );
  });
  it("concurrent identical seals are idempotent and cannot duplicate or overwrite turns", async () => {
    const attempt = await startJourneySpeakingAttempt(userId, {
      lessonId,
      requestKey: crypto.randomUUID(),
      locale: "es",
    });
    const input = {
      attemptId: attempt.id,
      lessonId,
      closeReason: "USER_END",
      turns: [
        { role: "assistant", content: "你好。" },
        { role: "user", content: "我叫Arean。" },
      ],
    };
    const [first, second] = await Promise.all([
      sealJourneySpeakingAttempt(userId, input),
      sealJourneySpeakingAttempt(userId, input),
    ]);
    expect(first.id).toBe(second.id);
    expect(
      (await getJourneySpeakingAttempt(userId, attempt.id, lessonId)).turns,
    ).toHaveLength(2);
  });
  it("bounds concurrent active attempts without changing learner progress", async () => {
    const active = [];
    for (let n = 0; n < 3; n++)
      active.push(
        await startJourneySpeakingAttempt(userId, {
          lessonId,
          requestKey: crypto.randomUUID(),
          locale: "en",
        }),
      );
    await expect(
      startJourneySpeakingAttempt(userId, {
        lessonId,
        requestKey: crypto.randomUUID(),
        locale: "en",
      }),
    ).rejects.toThrow("active attempt");
    for (const attempt of active)
      await sealJourneySpeakingAttempt(userId, {
        attemptId: attempt.id,
        lessonId,
        closeReason: "ABANDONED",
        turns: [],
      });
    expect(await db.learnerLessonProgress.count({ where: { userId } })).toBe(0);
  });
  it("database constraints refuse a partial/global or out-of-range score", async () => {
    const attempt = await startJourneySpeakingAttempt(userId, {
      lessonId,
      requestKey: crypto.randomUUID(),
      locale: "es",
    });
    const data = {
      attemptId: attempt.id,
      rubricVersion: attempt.rubricVersion,
      locale: "es",
    };
    await expect(
      db.journeySpeakingEvaluation.create({
        data: { ...data, status: "PARTIAL", score: 75 },
      }),
    ).rejects.toThrow();
    await expect(
      db.journeySpeakingEvaluation.create({
        data: { ...data, status: "COMPLETE", score: 120 },
      }),
    ).rejects.toThrow();
    await expect(
      db.journeySpeakingEvaluation.create({
        data: { ...data, status: "COMPLETE", score: null },
      }),
    ).rejects.toThrow();
    expect(
      await db.journeySpeakingEvaluation.count({
        where: { attemptId: attempt.id },
      }),
    ).toBe(0);
    await sealJourneySpeakingAttempt(userId, {
      attemptId: attempt.id,
      lessonId,
      closeReason: "ABANDONED",
      turns: [],
    });
  });
  it("verifies stable snapshot and capture digests after JSONB storage", async () => {
    const attempt = await startJourneySpeakingAttempt(userId, {
      lessonId,
      requestKey: crypto.randomUUID(),
      locale: "es",
    });
    expect(
      (await getJourneySpeakingAttempt(userId, attempt.id, lessonId))
        .snapshotHash,
    ).toBe(attempt.snapshotHash);
    await sealJourneySpeakingAttempt(userId, {
      attemptId: attempt.id,
      lessonId,
      closeReason: "USER_END",
      turns: [{ role: "user", content: "我叫Arean。" }],
    });
    const sealed = await getJourneySpeakingAttempt(
      userId,
      attempt.id,
      lessonId,
    );
    await db.journeySpeakingTurn.update({
      where: { id: sealed.turns[0]!.id },
      data: { content: "Changed outside the sealed capture" },
    });
    await expect(
      getJourneySpeakingAttempt(userId, attempt.id, lessonId),
    ).rejects.toThrow("capture integrity failure");
  });
});
