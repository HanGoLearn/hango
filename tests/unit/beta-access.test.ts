import { describe, expect, it } from "vitest";
import {
  isPendingBetaInvitation,
  normalizeBetaInvitationEmail,
} from "@/lib/beta-access";

describe("closed-beta invitation rules", () => {
  it("normalizes email before allowlist lookup", () => {
    expect(normalizeBetaInvitationEmail("  Learner@Example.COM ")).toBe(
      "learner@example.com",
    );
  });

  it("accepts only pending, non-expired invitations", () => {
    const now = new Date("2026-09-27T12:00:00.000Z");
    expect(
      isPendingBetaInvitation({ status: "PENDING", expiresAt: null }, now),
    ).toBe(true);
    expect(
      isPendingBetaInvitation(
        { status: "PENDING", expiresAt: new Date("2026-09-28T00:00:00.000Z") },
        now,
      ),
    ).toBe(true);
    expect(
      isPendingBetaInvitation(
        { status: "PENDING", expiresAt: new Date("2026-09-27T11:00:00.000Z") },
        now,
      ),
    ).toBe(false);
    expect(
      isPendingBetaInvitation({ status: "REVOKED", expiresAt: null }, now),
    ).toBe(false);
  });
});
