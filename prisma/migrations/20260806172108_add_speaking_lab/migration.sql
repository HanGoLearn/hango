-- CreateEnum
CREATE TYPE "SpeakingActivityType" AS ENUM ('PRONUNCIATION', 'SHADOWING', 'GUIDED_CONVERSATION', 'SCENARIO_ROLE_PLAY');

-- CreateEnum
CREATE TYPE "SpeakingCompletionState" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "SpeakingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "SpeakingActivityType" NOT NULL,
    "lessonId" TEXT,
    "scenarioId" TEXT,
    "prompt" TEXT NOT NULL,
    "completionState" "SpeakingCompletionState" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SpeakingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "audioFilePath" TEXT,
    "durationSeconds" DOUBLE PRECISION,
    "transcript" TEXT,
    "transcriptionConfidence" DOUBLE PRECISION,
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeakingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpeakingSession_userId_startedAt_idx" ON "SpeakingSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "SpeakingAttempt_sessionId_idx" ON "SpeakingAttempt"("sessionId");

-- AddForeignKey
ALTER TABLE "SpeakingSession" ADD CONSTRAINT "SpeakingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingSession" ADD CONSTRAINT "SpeakingSession_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingSession" ADD CONSTRAINT "SpeakingSession_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingAttempt" ADD CONSTRAINT "SpeakingAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SpeakingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
