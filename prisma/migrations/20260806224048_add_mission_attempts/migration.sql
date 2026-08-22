-- CreateEnum
CREATE TYPE "MissionCompletionState" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "MissionAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "completionState" "MissionCompletionState" NOT NULL DEFAULT 'IN_PROGRESS',
    "transcript" JSONB NOT NULL DEFAULT '[]',
    "report" JSONB,
    "unexpectedEventIntroduced" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MissionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MissionAttempt_userId_missionId_idx" ON "MissionAttempt"("userId", "missionId");

-- AddForeignKey
ALTER TABLE "MissionAttempt" ADD CONSTRAINT "MissionAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAttempt" ADD CONSTRAINT "MissionAttempt_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
