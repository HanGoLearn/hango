-- Closed-beta invitation allowlist.
--
-- Additive only: existing users and authentication records are untouched.
-- Invitations are created explicitly from the administrator back-office.
CREATE TYPE "BetaInvitationStatus" AS ENUM ('PENDING', 'ACTIVATED', 'REVOKED');

CREATE TABLE "BetaInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "BetaInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "cohort" TEXT,
    "note" TEXT,
    "expiresAt" TIMESTAMP(3),
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "activatedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BetaInvitation_email_key" ON "BetaInvitation"("email");
CREATE UNIQUE INDEX "BetaInvitation_activatedUserId_key" ON "BetaInvitation"("activatedUserId");
CREATE INDEX "BetaInvitation_status_invitedAt_idx" ON "BetaInvitation"("status", "invitedAt");
CREATE INDEX "BetaInvitation_cohort_status_idx" ON "BetaInvitation"("cohort", "status");

ALTER TABLE "BetaInvitation" ADD CONSTRAINT "BetaInvitation_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BetaInvitation" ADD CONSTRAINT "BetaInvitation_activatedUserId_fkey"
FOREIGN KEY ("activatedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
