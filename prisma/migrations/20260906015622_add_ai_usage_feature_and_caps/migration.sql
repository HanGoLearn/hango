-- AlterTable: add "feature" as required, backfilled for the 3 existing rows
-- (all written by ai-teacher-data.ts, the only writer before this migration)
-- with the one feature name that was true for all of them, then drop the
-- default so every future write must supply its own real feature name.
ALTER TABLE "AiUsageLog" ADD COLUMN "feature" TEXT NOT NULL DEFAULT 'ai-teacher-chat';
ALTER TABLE "AiUsageLog" ALTER COLUMN "feature" DROP DEFAULT;

-- AlterTable: token counts are only meaningful for text/vision calls;
-- TTS/STT surfaces log a cost with no token counts at all.
ALTER TABLE "AiUsageLog" ALTER COLUMN "inputTokens" DROP NOT NULL;
ALTER TABLE "AiUsageLog" ALTER COLUMN "outputTokens" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "AiUsageLog_feature_createdAt_idx" ON "AiUsageLog"("feature", "createdAt");

-- CreateTable
CREATE TABLE "AiUsageCap" (
    "feature" TEXT NOT NULL,
    "dailyLimitUsd" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageCap_pkey" PRIMARY KEY ("feature")
);
