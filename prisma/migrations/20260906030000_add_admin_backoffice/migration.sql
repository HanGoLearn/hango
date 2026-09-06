-- CreateEnum
CREATE TYPE "AnnouncementType" AS ENUM ('INFO', 'UPDATE', 'MAINTENANCE', 'CELEBRATION', 'IMPORTANT');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL_LEARNERS');

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "AnnouncementType" NOT NULL DEFAULT 'INFO',
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL_LEARNERS',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementReceipt" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shownAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "AnnouncementReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminCoinGrant" (
    "id" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "grantedByUserId" TEXT,
    "coinLedgerEntryId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminCoinGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "AiUsageLog_userId_feature_createdAt_idx" ON "AiUsageLog"("userId", "feature", "createdAt");
CREATE INDEX "LearnerLessonCompletion_completedAt_idx" ON "LearnerLessonCompletion"("completedAt");
CREATE INDEX "CoinLedgerEntry_userId_createdAt_idx" ON "CoinLedgerEntry"("userId", "createdAt");
CREATE INDEX "CoinLedgerEntry_createdAt_idx" ON "CoinLedgerEntry"("createdAt");
CREATE INDEX "Announcement_status_startsAt_endsAt_idx" ON "Announcement"("status", "startsAt", "endsAt");
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");
CREATE UNIQUE INDEX "AnnouncementReceipt_announcementId_userId_key" ON "AnnouncementReceipt"("announcementId", "userId");
CREATE INDEX "AnnouncementReceipt_userId_acknowledgedAt_idx" ON "AnnouncementReceipt"("userId", "acknowledgedAt");
CREATE UNIQUE INDEX "AdminCoinGrant_coinLedgerEntryId_key" ON "AdminCoinGrant"("coinLedgerEntryId");
CREATE INDEX "AdminCoinGrant_recipientUserId_createdAt_idx" ON "AdminCoinGrant"("recipientUserId", "createdAt");
CREATE INDEX "AdminCoinGrant_grantedByUserId_createdAt_idx" ON "AdminCoinGrant"("grantedByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AnnouncementReceipt" ADD CONSTRAINT "AnnouncementReceipt_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnnouncementReceipt" ADD CONSTRAINT "AnnouncementReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminCoinGrant" ADD CONSTRAINT "AdminCoinGrant_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminCoinGrant" ADD CONSTRAINT "AdminCoinGrant_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminCoinGrant" ADD CONSTRAINT "AdminCoinGrant_coinLedgerEntryId_fkey" FOREIGN KEY ("coinLedgerEntryId") REFERENCES "CoinLedgerEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
