import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  attempt: vi.fn(),
  turn: vi.fn(),
  evaluation: vi.fn(),
  report: vi.fn(),
  progress: vi.fn(),
}));
vi.mock("@/lib/env/server", () => ({
  serverEnv: { NODE_ENV: "development", HANGO_JOURNEY_EVALUATION_V2: "local" },
}));
vi.mock("@/lib/db", () => ({
  db: {
    journeySpeakingAttempt: { findFirst: mock.attempt },
    journeySpeakingTurn: { findFirst: mock.turn },
    journeySpeakingEvaluation: { findFirst: mock.evaluation },
    lessonReflectionReport: { findUnique: mock.report },
    learnerLessonProgress: { findUnique: mock.progress },
  },
}));
import {
  getLocalJourneyRollout,
  isLocalJourneyRolloutRequested,
  needsJourneyLessonRestart,
} from "@/lib/journey-local-rollout";
beforeEach(() => {
  vi.resetAllMocks();
});
describe("local-only Journey activation", () => {
  it("cannot activate production or test, even with the local flag", () => {
    expect(isLocalJourneyRolloutRequested("production", "local")).toBe(false);
    expect(isLocalJourneyRolloutRequested("test", "local")).toBe(false);
    expect(isLocalJourneyRolloutRequested("development", "off")).toBe(false);
    expect(isLocalJourneyRolloutRequested("development", "local")).toBe(true);
  });
  it("requires the migrated tables instead of silently running legacy", async () => {
    mock.attempt.mockRejectedValue(new Error("missing column"));
    expect(await getLocalJourneyRollout()).toBe("UNAVAILABLE");
  });
  it("does not write or require existing attempt rows for readiness", async () => {
    mock.attempt.mockResolvedValue(null);
    mock.turn.mockResolvedValue(null);
    mock.evaluation.mockResolvedValue(null);
    expect(await getLocalJourneyRollout()).toBe("READY");
  });
  it("requires explicit redo for an old saved report", async () => {
    mock.report.mockResolvedValue({ id: "old" });
    mock.progress.mockResolvedValue(null);
    expect(await needsJourneyLessonRestart("owner", "lesson")).toBe(true);
    expect(mock.report).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_lessonId: { userId: "owner", lessonId: "lesson" } },
      }),
    );
  });
  it.each([false, true])(
    "recognizes finished legacy Speaking: %s",
    async (finished) => {
      mock.report.mockResolvedValue(null);
      mock.progress.mockResolvedValue({
        completedStepIds: finished ? ["speaking"] : ["vocabulary"],
        lesson: { steps: [{ id: "speaking" }] },
      });
      expect(await needsJourneyLessonRestart("owner", "lesson")).toBe(finished);
    },
  );
});
