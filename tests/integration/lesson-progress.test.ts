import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { getLessonBySlug } from "@/lib/content/lesson";
import {
  canAccessLesson,
  getOrCreateLessonProgress,
  advanceLessonStep,
  setCurrentLessonStep,
} from "@/lib/lesson-progress-data";

// Only auth() is mocked — everything else runs against the real seeded
// database, same as the other integration tests.
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

const { advanceLessonStepAction, goToLessonStepAction } =
  await import("@/lib/actions/lesson-progress");

const testEmails: string[] = [];

afterEach(async () => {
  vi.clearAllMocks();
  if (testEmails.length > 0) {
    await db.user.deleteMany({ where: { email: { in: testEmails } } });
    testEmails.length = 0;
  }
});

async function createTestUser(email: string) {
  testEmails.push(email);
  const user = await db.user.create({ data: { email } });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

describe("lesson progress (integration, real seeded database)", () => {
  it("allows access to the first lesson of a scenario level", async () => {
    const user = await createTestUser(`lesson-access-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");

    const allowed = await canAccessLesson(user.id, lesson!);
    expect(allowed).toBe(true);
  });

  it("creates progress starting on the first step and resumes it on a second call", async () => {
    const user = await createTestUser(`lesson-resume-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const firstStepId = lesson!.steps[0]!.id;

    const created = await getOrCreateLessonProgress(
      user.id,
      lesson!.id,
      firstStepId,
    );
    expect(created.currentStepId).toBe(firstStepId);
    expect(created.completedStepIds).toEqual([]);

    await advanceLessonStep(user.id, lesson!.id, firstStepId, undefined);

    const resumed = await getOrCreateLessonProgress(
      user.id,
      lesson!.id,
      firstStepId,
    );
    expect(resumed.currentStepId).toBe(lesson!.steps[1]!.id);
  });

  it("advances through every step and marks the lesson complete on the last one", async () => {
    const user = await createTestUser(`lesson-advance-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const steps = lesson!.steps.map((s) => ({ id: s.id, order: s.order }));

    await getOrCreateLessonProgress(user.id, lesson!.id, steps[0]!.id);

    let last;
    for (const step of steps) {
      last = await advanceLessonStep(user.id, lesson!.id, step.id, undefined);
    }

    expect(last!.completedAt).not.toBeNull();
    expect(last!.completedStepIds).toHaveLength(steps.length);

    const completion = await db.learnerLessonCompletion.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson!.id } },
    });
    expect(completion).not.toBeNull();
  });

  it("stores the learner's response for a step", async () => {
    const user = await createTestUser(
      `lesson-response-${Date.now()}@hango.dev`,
    );
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const steps = lesson!.steps.map((s) => ({ id: s.id, order: s.order }));

    await getOrCreateLessonProgress(user.id, lesson!.id, steps[0]!.id);
    const updated = await advanceLessonStep(user.id, lesson!.id, steps[0]!.id, {
      answered: true,
    });

    expect(
      (updated.responses as Record<string, unknown>)[steps[0]!.id],
    ).toEqual({ answered: true });
  });

  it("treats a resubmitted step already advanced past as a no-op, not an error", async () => {
    // The bug this guards (2026-09-26): a double-tapped Continue button
    // fired this same call twice with the same stale step id. The first
    // call legitimately advanced progress; the second used to throw "not
    // the current step," which - uncaught on the client - surfaced as the
    // lesson's generic "couldn't load" error for progress that had in fact
    // already saved.
    const user = await createTestUser(
      `lesson-duplicate-${Date.now()}@hango.dev`,
    );
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const first = lesson!.steps[0]!;
    const second = lesson!.steps[1]!;
    await getOrCreateLessonProgress(user.id, lesson!.id, first.id);

    const advanced = await advanceLessonStep(
      user.id,
      lesson!.id,
      first.id,
      undefined,
    );
    expect(advanced.currentStepId).toBe(second.id);

    // The stale resend, still carrying `first.id`.
    const resent = await advanceLessonStep(
      user.id,
      lesson!.id,
      first.id,
      undefined,
    );
    expect(resent.currentStepId).toBe(second.id);
    expect(resent.completedStepIds).toEqual(advanced.completedStepIds);

    const progress = await db.learnerLessonProgress.findUniqueOrThrow({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson!.id } },
    });
    expect(progress.currentStepId).toBe(second.id);
    // Never double-recorded - the duplicate must not add a second entry.
    expect(
      progress.completedStepIds.filter((id) => id === first.id),
    ).toHaveLength(1);
  });

  it("still rejects a step that was never reached, duplicate or not", async () => {
    // The distinguishing rule the fix above relies on: only a step already
    // in completedStepIds is a benign duplicate. A step skipped ahead to -
    // never completed - must keep failing loudly.
    const user = await createTestUser(`lesson-skip-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const first = lesson!.steps[0]!;
    const later = lesson!.steps[2]!;
    await getOrCreateLessonProgress(user.id, lesson!.id, first.id);

    await expect(
      advanceLessonStep(user.id, lesson!.id, later.id, undefined),
    ).rejects.toThrow("not the current step");
  });

  it("derives the step sequence from the database and rejects skipping ahead", async () => {
    const user = await createTestUser(`lesson-order-${Date.now()}@hango.dev`);
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const first = lesson!.steps[0]!;
    const later = lesson!.steps[2]!;
    await getOrCreateLessonProgress(user.id, lesson!.id, first.id);

    await expect(
      advanceLessonStep(user.id, lesson!.id, later.id, undefined),
    ).rejects.toThrow("not the current step");

    const progress = await db.learnerLessonProgress.findUniqueOrThrow({
      where: { userId_lessonId: { userId: user.id, lessonId: lesson!.id } },
    });
    expect(progress.completedStepIds).toEqual([]);
    expect(progress.currentStepId).toBe(first.id);
  });

  it("cannot navigate to an unfinished or foreign lesson step", async () => {
    const user = await createTestUser(
      `lesson-navigation-${Date.now()}@hango.dev`,
    );
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    const otherLesson = await getLessonBySlug(
      "restaurant-ingredients-and-preferences",
    );
    const first = lesson!.steps[0]!;
    await getOrCreateLessonProgress(user.id, lesson!.id, first.id);

    await expect(
      setCurrentLessonStep(user.id, lesson!.id, lesson!.steps[1]!.id),
    ).rejects.toThrow("not available");
    await expect(
      setCurrentLessonStep(user.id, lesson!.id, otherLesson!.steps[0]!.id),
    ).rejects.toThrow("not available");

    await advanceLessonStep(user.id, lesson!.id, first.id, undefined);
    await expect(
      setCurrentLessonStep(user.id, lesson!.id, first.id),
    ).resolves.toMatchObject({ currentStepId: first.id });
  });

  it("server actions require an authenticated session", async () => {
    authMock.mockResolvedValue(null);

    await expect(
      advanceLessonStepAction("lesson-id", "step-id", undefined),
    ).rejects.toThrow("Not authenticated");
    await expect(goToLessonStepAction("lesson-id", "step-id")).rejects.toThrow(
      "Not authenticated",
    );
  });
});
