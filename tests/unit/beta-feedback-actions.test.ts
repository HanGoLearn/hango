import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  requireAdministrator: vi.fn(),
  createBetaFeedback: vi.fn(),
  getRecentBetaFeedbackForUser: vi.fn(),
  feedbackFindUnique: vi.fn(),
  feedbackUpdate: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/admin-auth", () => ({
  requireAdministrator: mocks.requireAdministrator,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/beta-feedback", () => ({
  BETA_FEEDBACK_CATEGORIES: [
    "BUG",
    "IDEA",
    "CONFUSING",
    "LESSON_CONTENT",
    "HAN",
    "OTHER",
  ],
  BETA_FEEDBACK_STATUSES: ["NEW", "REVIEWING", "RESOLVED"],
  createBetaFeedback: mocks.createBetaFeedback,
  getRecentBetaFeedbackForUser: mocks.getRecentBetaFeedbackForUser,
}));
vi.mock("@/lib/db", () => ({
  db: {
    betaFeedback: {
      findUnique: mocks.feedbackFindUnique,
      update: mocks.feedbackUpdate,
    },
  },
}));

const {
  getMyBetaFeedbackAction,
  submitBetaFeedbackAction,
  updateBetaFeedbackAction,
} = await import("@/lib/actions/beta-feedback");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "learner-current" } });
  mocks.createBetaFeedback.mockResolvedValue("CREATED");
  mocks.getRecentBetaFeedbackForUser.mockResolvedValue([]);
  mocks.requireAdministrator.mockResolvedValue({ id: "admin-1" });
  mocks.feedbackFindUnique.mockResolvedValue({ id: "feedback-1" });
  mocks.feedbackUpdate.mockResolvedValue({ id: "feedback-1" });
});

describe("closed-beta feedback actions", () => {
  it("derives the author from the authenticated session", async () => {
    await expect(
      submitBetaFeedbackAction({
        category: "BUG",
        rating: 4,
        message: "  The lesson button did not respond.  ",
        path: "/en/lesson/example",
        locale: "en",
      }),
    ).resolves.toEqual({ ok: true });

    expect(mocks.createBetaFeedback).toHaveBeenCalledWith({
      userId: "learner-current",
      category: "BUG",
      rating: 4,
      message: "The lesson button did not respond.",
      path: "/en/lesson/example",
      locale: "EN",
    });
  });

  it("never accepts a report for a client-supplied user", async () => {
    await submitBetaFeedbackAction({
      userId: "someone-else",
      category: "IDEA",
      rating: null,
      message: "Add another guided station.",
      path: "/es/speaking-lab",
      locale: "es",
    });

    expect(mocks.createBetaFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "learner-current", locale: "ES" }),
    );
  });

  it("returns no history when signed out", async () => {
    mocks.auth.mockResolvedValueOnce(null);

    await expect(getMyBetaFeedbackAction()).resolves.toEqual([]);
    expect(mocks.getRecentBetaFeedbackForUser).not.toHaveBeenCalled();
  });

  it("records the administrator identity when resolving a report", async () => {
    const form = new FormData();
    form.set("feedbackId", "feedback-1");
    form.set("status", "RESOLVED");
    form.set("adminResponse", "Thanks — this is fixed now.");
    form.set("internalNote", "Verified in mobile QA.");

    const result = await updateBetaFeedbackAction(
      { ok: false, message: "" },
      form,
    );

    expect(result).toEqual({ ok: true, message: "Reporte actualizado." });
    expect(mocks.feedbackUpdate).toHaveBeenCalledWith({
      where: { id: "feedback-1" },
      data: expect.objectContaining({
        status: "RESOLVED",
        reviewedByUserId: "admin-1",
        adminResponse: "Thanks — this is fixed now.",
        resolvedAt: expect.any(Date),
      }),
    });
  });
});
