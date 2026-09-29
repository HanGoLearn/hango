-- Language-aware learner announcements and the attachment-free closed-beta
-- feedback inbox. Existing announcements remain visible in every locale.
ALTER TABLE "Announcement" ADD COLUMN "locale" "InterfaceLanguage";

CREATE TYPE "BetaFeedbackCategory" AS ENUM (
    'BUG',
    'IDEA',
    'CONFUSING',
    'LESSON_CONTENT',
    'HAN',
    'OTHER'
);

CREATE TYPE "BetaFeedbackStatus" AS ENUM (
    'NEW',
    'REVIEWING',
    'RESOLVED'
);

CREATE TABLE "BetaFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "BetaFeedbackCategory" NOT NULL,
    "rating" INTEGER,
    "message" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "status" "BetaFeedbackStatus" NOT NULL DEFAULT 'NEW',
    "adminResponse" TEXT,
    "internalNote" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BetaFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BetaFeedback_status_createdAt_idx"
    ON "BetaFeedback"("status", "createdAt");
CREATE INDEX "BetaFeedback_userId_createdAt_idx"
    ON "BetaFeedback"("userId", "createdAt");

ALTER TABLE "BetaFeedback"
    ADD CONSTRAINT "BetaFeedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BetaFeedback"
    ADD CONSTRAINT "BetaFeedback_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
