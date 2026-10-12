import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  auth: vi.fn(),
  lesson: vi.fn(),
  access: vi.fn(),
  progress: vi.fn(),
  selected: vi.fn(),
  rollout: vi.fn(),
  restart: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: mock.auth }));
vi.mock("@/lib/content/lesson-data", () => ({
  getLessonWithContent: mock.lesson,
}));
vi.mock("@/lib/lesson-progress-data", () => ({
  getLessonAccess: mock.access,
  getOrCreateLessonProgress: mock.progress,
}));
vi.mock("@/lib/journey-report-routing", () => ({
  usesJourneyLessonReport: mock.selected,
}));
vi.mock("@/lib/journey-local-rollout", () => ({
  getLocalJourneyRollout: mock.rollout,
  needsJourneyLessonRestart: mock.restart,
}));
vi.mock("@/lib/content/learning-journey", () => ({
  resolveJourneyChapter: () => "BEGINNER",
}));
vi.mock("@/lib/beta-learning-scope", () => ({
  isJourneyChapterAccessible: () => true,
}));
vi.mock("@/i18n/get-dictionary", () => ({
  getDictionary: async () => ({ lesson: { rewards: {} } }),
}));
vi.mock("@/components/lesson/lesson-engine", () => ({
  LessonEngine: "engine",
}));
vi.mock("@/components/lesson/lesson-results-view", () => ({
  LessonResultsView: "results",
}));
vi.mock("@/components/lesson/lesson-rewards-panel", () => ({
  LessonRewardsPanel: "rewards",
}));
vi.mock("@/components/lesson/journey-rollout-notice", () => ({
  JourneyRolloutNotice: "notice",
}));
import Page from "../../app/[locale]/(app)/lesson/[slug]/page";
const open = () =>
  Page({ params: Promise.resolve({ locale: "es", slug: "first" }) });
beforeEach(() => {
  vi.resetAllMocks();
  mock.auth.mockResolvedValue({ user: { id: "owner", role: "LEARNER" } });
  mock.lesson.mockResolvedValue({
    id: "lesson",
    slug: "first",
    title: "Saludos",
    steps: [{ id: "step" }],
    scenarioLevel: { difficulty: "BEGINNER", scenario: { slug: "greetings" } },
  });
  mock.access.mockResolvedValue({ allowed: true, completed: false });
  mock.selected.mockResolvedValue(false);
  mock.rollout.mockResolvedValue("READY");
  mock.restart.mockResolvedValue(false);
  mock.progress.mockResolvedValue({
    id: "run",
    startedAt: new Date("2026-10-11T10:00:00Z"),
    currentStepId: "step",
    completedStepIds: [],
  });
});
describe("real lesson route activation", () => {
  it("passes the capture opt-in and locale to a new local lesson", async () => {
    const result = await open();
    expect(result?.type).toBe("engine");
    expect(result?.props).toMatchObject({
      journeyEvidenceCapture: true,
      locale: "es",
    });
  });
  it("does not silently use legacy when migrations are missing", async () => {
    mock.rollout.mockResolvedValue("UNAVAILABLE");
    const result = await open();
    expect(result?.type).toBe("notice");
    expect(result?.props).toMatchObject({ unavailable: true });
    expect(mock.progress).not.toHaveBeenCalled();
  });
  it("shows redo recovery instead of old paid feedback for a finished lesson", async () => {
    mock.access.mockResolvedValue({ allowed: true, completed: true });
    expect((await open())?.type).toBe("notice");
    expect(mock.progress).not.toHaveBeenCalled();
  });
  it("requires redo for legacy Speaking already completed in an unfinished run", async () => {
    mock.restart.mockResolvedValue(true);
    expect((await open())?.type).toBe("notice");
  });
  it("preserves the production/off behavior", async () => {
    mock.rollout.mockResolvedValue("OFF");
    expect((await open())?.props).toMatchObject({
      journeyEvidenceCapture: false,
    });
    expect(mock.restart).not.toHaveBeenCalled();
  });
  it("does not reject an already selected v2 run as legacy", async () => {
    mock.selected.mockResolvedValue(true);
    expect((await open())?.props).toMatchObject({
      journeyReport: true,
      journeyEvidenceCapture: true,
    });
    expect(mock.restart).not.toHaveBeenCalled();
  });
});
