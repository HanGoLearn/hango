import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { getLessonBySlug } from "@/lib/content/lesson";
import { getStudyStreak, getDashboardData } from "@/lib/dashboard-data";

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));

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
  await db.learnerProfile.create({
    data: { userId: user.id, dailyStudyTargetMinutes: 20 },
  });
  authMock.mockResolvedValue({ user: { id: user.id } });
  return user;
}

describe("Dashboard data (integration, real database)", () => {
  it("has no streak for a learner with no activity", async () => {
    const user = await createTestUser(
      `dashboard-nostreak-${Date.now()}@hango.dev`,
    );
    const streak = await getStudyStreak(user.id);
    expect(streak).toEqual({ currentStreak: 0, activeToday: false });
  });

  it("counts today's lesson completion toward the streak", async () => {
    const user = await createTestUser(
      `dashboard-streak-${Date.now()}@hango.dev`,
    );
    const lesson = await getLessonBySlug("restaurant-entering-and-ordering");
    await db.learnerLessonCompletion.create({
      data: { userId: user.id, lessonId: lesson!.id },
    });

    const streak = await getStudyStreak(user.id);
    expect(streak.activeToday).toBe(true);
    expect(streak.currentStreak).toBe(1);
  });

  it("getDashboardData assembles continue target, streak, scenarios, and daily goal together", async () => {
    const user = await createTestUser(`dashboard-full-${Date.now()}@hango.dev`);

    const data = await getDashboardData(user.id);

    expect(data.dailyStudyTargetMinutes).toBe(20);
    expect(data.scenarios.length).toBeGreaterThan(0);
    expect(data.continueTarget).not.toBeNull();
    expect(data.streak).toEqual({ currentStreak: 0, activeToday: false });
  });
});
