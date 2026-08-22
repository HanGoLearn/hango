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

    await setCurrentLessonStep(user.id, lesson!.id, lesson!.steps[1]!.id);

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
      last = await advanceLessonStep(
        user.id,
        lesson!.id,
        step.id,
        steps,
        undefined,
      );
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
    const updated = await advanceLessonStep(
      user.id,
      lesson!.id,
      steps[0]!.id,
      steps,
      { answered: true },
    );

    expect(
      (updated.responses as Record<string, unknown>)[steps[0]!.id],
    ).toEqual({ answered: true });
  });

  it("server actions require an authenticated session", async () => {
    authMock.mockResolvedValue(null);

    await expect(
      advanceLessonStepAction("lesson-id", "step-id", [], undefined),
    ).rejects.toThrow("Not authenticated");
    await expect(goToLessonStepAction("lesson-id", "step-id")).rejects.toThrow(
      "Not authenticated",
    );
  });
});
