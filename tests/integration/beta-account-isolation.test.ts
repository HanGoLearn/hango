import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { getLessonBySlug } from "@/lib/content/lesson";
import {
  advanceLessonStep,
  getOrCreateLessonProgress,
} from "@/lib/lesson-progress-data";
import {
  acknowledgeAnnouncementForUser,
  getPendingAnnouncementsForUser,
} from "@/lib/learner-notices";

const testUserIds: string[] = [];
const testAnnouncementIds: string[] = [];

afterEach(async () => {
  if (testAnnouncementIds.length > 0) {
    await db.announcement.deleteMany({
      where: { id: { in: testAnnouncementIds.splice(0) } },
    });
  }
  if (testUserIds.length > 0) {
    await db.user.deleteMany({
      where: { id: { in: testUserIds.splice(0) } },
    });
  }
});

async function createUser(prefix: string) {
  const user = await db.user.create({
    data: { email: `${prefix}-${randomUUID()}@hango.dev` },
  });
  testUserIds.push(user.id);
  return user;
}

describe("closed-beta account isolation (integration, real database)", () => {
  it("keeps lesson progress independent when two learners open the same lesson", async () => {
    const [learnerA, learnerB] = await Promise.all([
      createUser("beta-isolation-progress-a"),
      createUser("beta-isolation-progress-b"),
    ]);
    const lesson = await getLessonBySlug(
      "foundations-greetings-and-introductions",
    );
    expect(lesson?.steps.length).toBeGreaterThan(1);
    const first = lesson!.steps[0]!;
    const second = lesson!.steps[1]!;

    await Promise.all([
      getOrCreateLessonProgress(learnerA.id, lesson!.id, first.id),
      getOrCreateLessonProgress(learnerB.id, lesson!.id, first.id),
    ]);
    await advanceLessonStep(learnerA.id, lesson!.id, first.id, {
      answer: "account-a-only",
    });

    const [progressA, progressB] = await Promise.all([
      db.learnerLessonProgress.findUniqueOrThrow({
        where: {
          userId_lessonId: { userId: learnerA.id, lessonId: lesson!.id },
        },
      }),
      db.learnerLessonProgress.findUniqueOrThrow({
        where: {
          userId_lessonId: { userId: learnerB.id, lessonId: lesson!.id },
        },
      }),
    ]);

    expect(progressA.currentStepId).toBe(second.id);
    expect(progressA.completedStepIds).toEqual([first.id]);
    expect(progressA.responses).toMatchObject({
      [first.id]: { answer: "account-a-only" },
    });
    expect(progressB.currentStepId).toBe(first.id);
    expect(progressB.completedStepIds).toEqual([]);
    expect(progressB.responses).toEqual({});
  });

  it("keeps announcement acknowledgement private to the learner who closed it", async () => {
    const [administrator, learnerA, learnerB] = await Promise.all([
      createUser("beta-isolation-announcement-admin"),
      createUser("beta-isolation-announcement-a"),
      createUser("beta-isolation-announcement-b"),
    ]);
    const announcement = await db.announcement.create({
      data: {
        title: "Prueba de aislamiento",
        message: "Este anuncio debe conservar su estado por usuario.",
        status: "PUBLISHED",
        startsAt: new Date(Date.now() - 60_000),
        createdByUserId: administrator.id,
      },
    });
    testAnnouncementIds.push(announcement.id);

    const [initialA, initialB] = await Promise.all([
      getPendingAnnouncementsForUser(learnerA.id, "ES"),
      getPendingAnnouncementsForUser(learnerB.id, "ES"),
    ]);
    expect(initialA.map((item) => item.id)).toContain(announcement.id);
    expect(initialB.map((item) => item.id)).toContain(announcement.id);

    await acknowledgeAnnouncementForUser(learnerA.id, announcement.id);

    const [afterA, afterB, receipts] = await Promise.all([
      getPendingAnnouncementsForUser(learnerA.id, "ES"),
      getPendingAnnouncementsForUser(learnerB.id, "ES"),
      db.announcementReceipt.findMany({
        where: { announcementId: announcement.id },
        orderBy: { userId: "asc" },
      }),
    ]);
    expect(afterA.map((item) => item.id)).not.toContain(announcement.id);
    expect(afterB.map((item) => item.id)).toContain(announcement.id);
    expect(receipts).toHaveLength(2);
    expect(
      receipts.find((receipt) => receipt.userId === learnerA.id)
        ?.acknowledgedAt,
    ).toBeInstanceOf(Date);
    expect(
      receipts.find((receipt) => receipt.userId === learnerB.id)
        ?.acknowledgedAt,
    ).toBeNull();
  });
});
