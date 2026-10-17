import { beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import {
  getJourneySpeakingAttempt,
  startJourneySpeakingAttempt,
  sealJourneySpeakingAttempt,
} from "@/lib/journey-speaking-attempts";
import { getJourneyRealtimeBinding } from "@/lib/journey-speaking-realtime-binding";
const { auth } = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth }));
import {
  startJourneySpeakingAttemptAction,
  sealJourneySpeakingAttemptAction,
} from "@/lib/actions/journey-speaking";
const target = new URL(process.env.DATABASE_URL ?? "http://missing");
if (
  target.hostname !== "127.0.0.1" ||
  target.port !== "54329" ||
  target.pathname !== "/hango_local_test"
)
  throw new Error("Disposable local integration runner required");
let lessonId: string;
let userId: string;
let otherId: string;
beforeAll(async () => {
  lessonId = (
    await db.lesson.findUniqueOrThrow({
      where: { slug: "foundations-greetings-and-introductions" },
    })
  ).id;
  userId = (
    await db.user.create({
      data: { email: `capture-${crypto.randomUUID()}@example.test` },
    })
  ).id;
  otherId = (
    await db.user.create({
      data: { email: `capture-other-${crypto.randomUUID()}@example.test` },
    })
  ).id;
});
describe("Journey authenticated capture and frozen voice binding", () => {
  it("bounds repeated create/abandon requests without counting idempotent replay as a new attempt", async () => {
    const id = (
      await db.user.create({
        data: { email: `capture-limit-${crypto.randomUUID()}@example.test` },
      })
    ).id;
    const requestKey = crypto.randomUUID();
    const first = await startJourneySpeakingAttempt(id, {
      lessonId,
      locale: "es",
      requestKey,
    });
    await sealJourneySpeakingAttempt(id, {
      attemptId: first.id,
      lessonId,
      closeReason: "ABANDONED",
      turns: [],
    });
    const closed = await getJourneySpeakingAttempt(id, first.id, lessonId);
    await db.journeySpeakingAttempt.createMany({
      data: Array.from({ length: 29 }, () => ({
        userId: id,
        lessonId,
        requestKey: crypto.randomUUID(),
        rubricVersion: closed.rubricVersion,
        bankVersion: closed.bankVersion,
        locale: closed.locale,
        snapshot: closed.snapshot as object,
        snapshotHash: closed.snapshotHash,
        status: "CANCELLED" as const,
        closeReason: "ABANDONED" as const,
        captureHash: closed.captureHash,
      })),
    });
    expect(
      (
        await startJourneySpeakingAttempt(id, {
          lessonId,
          locale: "es",
          requestKey,
        })
      ).id,
    ).toBe(first.id);
    await expect(
      startJourneySpeakingAttempt(id, {
        lessonId,
        locale: "es",
        requestKey: crypto.randomUUID(),
      }),
    ).rejects.toThrow("Too many recent Journey attempts");
    expect(
      await db.journeySpeakingAttempt.count({ where: { userId: id } }),
    ).toBe(30);
  });
  it("actions use session identity, reject extra user/grade fields and never leak snapshots or exceptions", async () => {
    const input = { lessonId, locale: "es", requestKey: crypto.randomUUID() };
    auth.mockResolvedValue(null);
    expect(await startJourneySpeakingAttemptAction(input)).toEqual({
      ok: false,
      code: "UNAUTHENTICATED",
    });
    auth.mockResolvedValue({ user: { id: userId } });
    expect(
      await startJourneySpeakingAttemptAction({
        ...input,
        userId: otherId,
        score: 100,
      }),
    ).toEqual({ ok: false, code: "UNAVAILABLE" });
    const started = await startJourneySpeakingAttemptAction(input);
    expect(started.ok).toBe(true);
    if (!started.ok) throw new Error("start failed");
    expect(started).not.toHaveProperty("snapshot");
    const owned = await getJourneySpeakingAttempt(
      userId,
      started.attemptId,
      lessonId,
    );
    expect(owned.userId).toBe(userId);
    auth.mockResolvedValue({ user: { id: otherId } });
    expect(
      await sealJourneySpeakingAttemptAction({
        attemptId: started.attemptId,
        lessonId,
        closeReason: "USER_END",
        turns: [],
      }),
    ).toEqual({ ok: false, code: "UNAVAILABLE" });
    expect(
      (await getJourneySpeakingAttempt(userId, started.attemptId, lessonId))
        .status,
    ).toBe("ACTIVE");
    await sealJourneySpeakingAttempt(userId, {
      attemptId: started.attemptId,
      lessonId,
      closeReason: "ABANDONED",
      turns: [],
    });
  });
  it("stores original recognition and quality in the sealed hash; retries are idempotent and metadata substitution fails", async () => {
    const started = await startJourneySpeakingAttempt(userId, {
      lessonId,
      locale: "es",
      requestKey: crypto.randomUUID(),
    });
    const input = {
      attemptId: started.id,
      lessonId,
      closeReason: "USER_END",
      turns: [
        {
          role: "user",
          content: "共享喝水",
          recognition: {
            rawTranscript: "共享喝水",
            interpretedTranscript: "我想喝水",
            confidence: 0.3,
          },
        },
      ],
      quality: { pendingLearnerTurn: false, interruptedAssistant: true },
    };
    const first = await sealJourneySpeakingAttempt(userId, input);
    expect((await sealJourneySpeakingAttempt(userId, input)).id).toBe(first.id);
    const stored = await getJourneySpeakingAttempt(
      userId,
      started.id,
      lessonId,
    );
    expect(stored.turns[0]!.content).toBe("共享喝水");
    expect(stored.turns[0]!.recognition).toEqual(input.turns[0]!.recognition);
    expect(stored.captureQuality).toEqual(input.quality);
    await expect(
      sealJourneySpeakingAttempt(userId, {
        ...input,
        quality: { pendingLearnerTurn: false, interruptedAssistant: false },
      }),
    ).rejects.toThrow("already sealed");
    await db.journeySpeakingTurn.update({
      where: { id: stored.turns[0]!.id },
      data: { recognition: { ...input.turns[0]!.recognition, confidence: 1 } },
    });
    await expect(
      getJourneySpeakingAttempt(userId, started.id, lessonId),
    ).rejects.toThrow("capture integrity");
  });
  it("binds only an active owned attempt and uses server roles/banks; sealed or foreign IDs cannot create a voice session", async () => {
    const started = await startJourneySpeakingAttempt(userId, {
      lessonId,
      locale: "en",
      requestKey: crypto.randomUUID(),
    });
    const binding = await getJourneyRealtimeBinding(
      userId,
      started.id,
      lessonId,
    );
    expect(binding.attemptId).toBe(started.id);
    expect(binding.banks.lessonId).toBe(lessonId);
    expect(binding.rolePlay.aiRole).toBe(
      (started.snapshot as { aiRole: string }).aiRole,
    );
    await expect(
      getJourneyRealtimeBinding(otherId, started.id, lessonId),
    ).rejects.toThrow("Attempt unavailable");
    await sealJourneySpeakingAttempt(userId, {
      attemptId: started.id,
      lessonId,
      closeReason: "ABANDONED",
      turns: [],
    });
    await expect(
      getJourneyRealtimeBinding(userId, started.id, lessonId),
    ).rejects.toThrow("Active Journey attempt unavailable");
  });
  it("expires abandoned active attempts from offline browsers without changing any report or curriculum", async () => {
    const old = await startJourneySpeakingAttempt(userId, {
      lessonId,
      locale: "es",
      requestKey: crypto.randomUUID(),
    });
    await db.journeySpeakingAttempt.update({
      where: { id: old.id },
      data: { startedAt: new Date(Date.now() - 21 * 60 * 1000) },
    });
    await expect(
      getJourneyRealtimeBinding(userId, old.id, lessonId),
    ).rejects.toThrow("Active Journey attempt unavailable");
    const next = await startJourneySpeakingAttempt(userId, {
      lessonId,
      locale: "es",
      requestKey: crypto.randomUUID(),
    });
    expect(
      (await getJourneySpeakingAttempt(userId, old.id, lessonId)).status,
    ).toBe("CANCELLED");
    expect(
      await db.journeySpeakingEvaluation.count({
        where: { attempt: { userId } },
      }),
    ).toBe(0);
    expect(await db.aiConversation.count({ where: { userId } })).toBe(0);
    await sealJourneySpeakingAttempt(userId, {
      attemptId: next.id,
      lessonId,
      closeReason: "ABANDONED",
      turns: [],
    });
  });
});
