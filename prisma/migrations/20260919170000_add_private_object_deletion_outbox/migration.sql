-- CreateEnum
CREATE TYPE "PrivateObjectDeletionReason" AS ENUM (
  'RETENTION',
  'ACCOUNT_DELETION',
  'USER_REQUEST',
  'ORPHAN_CLEANUP',
  'FAILED_UPLOAD'
);

-- CreateEnum
CREATE TYPE "PrivateObjectDeletionStatus" AS ENUM (
  'PENDING',
  'PROCESSING',
  'FAILED',
  'COMPLETED'
);

-- CreateTable
CREATE TABLE "PrivateObjectDeletion" (
  "id" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "speakingAttemptId" TEXT,
  "reason" "PrivateObjectDeletionReason" NOT NULL,
  "status" "PrivateObjectDeletionStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processingStartedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PrivateObjectDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrivateObjectDeletion_storageKey_key"
ON "PrivateObjectDeletion"("storageKey");

-- CreateIndex
CREATE INDEX "PrivateObjectDeletion_status_nextAttemptAt_idx"
ON "PrivateObjectDeletion"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "PrivateObjectDeletion_ownerUserId_status_idx"
ON "PrivateObjectDeletion"("ownerUserId", "status");
