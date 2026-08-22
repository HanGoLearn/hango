-- AlterTable
ALTER TABLE "LearnerProfile" ADD COLUMN     "generalLevelPoints" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "VocabularyQuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vocabularyItemId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "earnedPoints" DOUBLE PRECISION NOT NULL,
    "weightedReflectionAverage" DOUBLE PRECISION NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VocabularyQuizAttempt_userId_lessonId_idx" ON "VocabularyQuizAttempt"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "VocabularyQuizAttempt_userId_vocabularyItemId_questionKey_idx" ON "VocabularyQuizAttempt"("userId", "vocabularyItemId", "questionKey");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioCompletion_userId_scenarioId_key" ON "ScenarioCompletion"("userId", "scenarioId");

-- AddForeignKey
ALTER TABLE "VocabularyQuizAttempt" ADD CONSTRAINT "VocabularyQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyQuizAttempt" ADD CONSTRAINT "VocabularyQuizAttempt_vocabularyItemId_fkey" FOREIGN KEY ("vocabularyItemId") REFERENCES "VocabularyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyQuizAttempt" ADD CONSTRAINT "VocabularyQuizAttempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioCompletion" ADD CONSTRAINT "ScenarioCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioCompletion" ADD CONSTRAINT "ScenarioCompletion_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
