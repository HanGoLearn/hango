import { beforeEach, describe, expect, it, vi } from "vitest";
const { auth, read, evaluate, save, refresh } = vi.hoisted(() => ({
  auth: vi.fn(),
  read: vi.fn(),
  evaluate: vi.fn(),
  save: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/cache", () => ({ refresh }));
vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/journey-lesson-report-service", () => ({
  getJourneyLessonReport: read,
  evaluateJourneyLessonReport: evaluate,
  persistJourneyLessonReport: save,
}));
import {
  getJourneyLessonReportAction,
  evaluateJourneyLessonReportAction,
  saveJourneyLessonReportAction,
  recoverJourneyLessonReportAction,
} from "@/lib/actions/journey-lesson-report";
const actions = [
  getJourneyLessonReportAction,
  evaluateJourneyLessonReportAction,
  saveJourneyLessonReportAction,
  recoverJourneyLessonReportAction,
];
beforeEach(() => {
  vi.resetAllMocks();
  auth.mockResolvedValue({ user: { id: "owner" } });
  read.mockResolvedValue({ version: "test-read" });
  evaluate.mockResolvedValue({ version: "test-evaluation" });
  save.mockResolvedValue({ version: "test-saved" });
});
describe("Journey report actions", () => {
  it("only the explicit recovery action authorizes a bounded second evaluation", async () => {
    await recoverJourneyLessonReportAction({ lessonId: "lesson" });
    expect(evaluate).toHaveBeenCalledExactlyOnceWith("owner", "lesson", {
      recoverFailed: true,
    });
    expect(save).toHaveBeenCalledWith("owner", "lesson");
  });
  it.each(actions)("requires authentication for %s", async (action) => {
    auth.mockResolvedValue(null);
    expect(await action({ lessonId: "lesson" })).toEqual({
      ok: false,
      code: "UNAUTHENTICATED",
    });
    expect(read).not.toHaveBeenCalled();
    expect(evaluate).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });
  it.each(actions)(
    "rejects client identity, attempt/grade fields and malformed input for %s",
    async (action) => {
      for (const input of [
        null,
        {},
        { lessonId: "" },
        { lessonId: "a".repeat(101) },
        { lessonId: "lesson", userId: "other" },
        { lessonId: "lesson", attemptId: "other" },
        { lessonId: "lesson", score: 100 },
      ])
        expect(await action(input)).toEqual({
          ok: false,
          code: "INVALID_INPUT",
        });
      expect(read).not.toHaveBeenCalled();
      expect(evaluate).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
    },
  );
  it("a visit only reads this authenticated owner's result", async () => {
    expect(await getJourneyLessonReportAction({ lessonId: "lesson" })).toEqual({
      ok: true,
      report: { version: "test-read" },
    });
    expect(read).toHaveBeenCalledWith("owner", "lesson");
    expect(evaluate).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
  it("generation returns the saved report and does not accept a client-selected attempt", async () => {
    expect(
      await evaluateJourneyLessonReportAction({ lessonId: "lesson" }),
    ).toEqual({ ok: true, report: { version: "test-saved" } });
    expect(evaluate).toHaveBeenCalledWith("owner", "lesson");
    expect(save).toHaveBeenCalledWith("owner", "lesson");
    expect(evaluate.mock.invocationCallOrder[0]).toBeLessThan(
      save.mock.invocationCallOrder[0]!,
    );
  });
  it("saving retry never evaluates or translates", async () => {
    await saveJourneyLessonReportAction({ lessonId: "lesson" });
    expect(save).toHaveBeenCalledWith("owner", "lesson");
    expect(evaluate).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(read).not.toHaveBeenCalled();
  });
  it("does not leak private errors or claim saved after a failure", async () => {
    save.mockRejectedValue(new Error("private database detail"));
    expect(
      await evaluateJourneyLessonReportAction({ lessonId: "lesson" }),
    ).toEqual({ ok: false, code: "UNAVAILABLE" });
    expect(await saveJourneyLessonReportAction({ lessonId: "lesson" })).toEqual(
      { ok: false, code: "UNAVAILABLE" },
    );
    expect(evaluate).toHaveBeenCalledTimes(1);
  });
});
