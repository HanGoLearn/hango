-- CreateTable
CREATE TABLE "LearnerLessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "currentStepId" TEXT NOT NULL,
    "completedStepIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responses" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LearnerLessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearnerLessonProgress_userId_lessonId_key" ON "LearnerLessonProgress"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "LearnerLessonProgress" ADD CONSTRAINT "LearnerLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerLessonProgress" ADD CONSTRAINT "LearnerLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
