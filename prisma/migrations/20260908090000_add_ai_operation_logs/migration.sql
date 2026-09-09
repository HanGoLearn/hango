-- CreateEnum
CREATE TYPE "AiOperationOutcome" AS ENUM ('SUCCESS', 'FAILURE', 'BLOCKED_CAP');

-- CreateTable
CREATE TABLE "AiOperationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "outcome" "AiOperationOutcome" NOT NULL,
    "errorCode" TEXT,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiOperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiOperationLog_createdAt_idx" ON "AiOperationLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiOperationLog_feature_outcome_createdAt_idx" ON "AiOperationLog"("feature", "outcome", "createdAt");

-- CreateIndex
CREATE INDEX "AiOperationLog_provider_model_createdAt_idx" ON "AiOperationLog"("provider", "model", "createdAt");

-- CreateIndex
CREATE INDEX "AiOperationLog_userId_createdAt_idx" ON "AiOperationLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiOperationLog" ADD CONSTRAINT "AiOperationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
