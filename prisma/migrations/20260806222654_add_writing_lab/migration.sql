-- CreateEnum
CREATE TYPE "WritingTaskType" AS ENUM ('SENTENCE', 'SHORT_MESSAGE', 'PARAGRAPH', 'PRACTICAL_WRITING');

-- CreateTable
CREATE TABLE "WritingTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "WritingTaskType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "lessonId" TEXT,
    "scenarioId" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "draft" TEXT NOT NULL DEFAULT '',
    "submittedResponse" TEXT,
    "feedback" JSONB,
    "correctedVersion" TEXT,
    "rewriteOfAttemptId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WritingAttempt_userId_taskId_idx" ON "WritingAttempt"("userId", "taskId");

-- AddForeignKey
ALTER TABLE "WritingTask" ADD CONSTRAINT "WritingTask_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingTask" ADD CONSTRAINT "WritingTask_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingAttempt" ADD CONSTRAINT "WritingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingAttempt" ADD CONSTRAINT "WritingAttempt_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "WritingTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingAttempt" ADD CONSTRAINT "WritingAttempt_rewriteOfAttemptId_fkey" FOREIGN KEY ("rewriteOfAttemptId") REFERENCES "WritingAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
