-- CreateTable
CREATE TABLE "LessonReflectionReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "vocabularyCovered" INTEGER NOT NULL,
    "vocabularyTotal" INTEGER NOT NULL,
    "comprehensionScore" INTEGER,
    "grammarScore" INTEGER,
    "speakingScore" INTEGER,
    "speakingDimensions" JSONB,
    "hanNarrative" TEXT NOT NULL,
    "strengths" JSONB NOT NULL,
    "improvements" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonReflectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerVocabularyInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vocabularyItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearnerVocabularyInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonReflectionReport_userId_lessonId_key" ON "LessonReflectionReport"("userId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerVocabularyInteraction_userId_vocabularyItemId_key" ON "LearnerVocabularyInteraction"("userId", "vocabularyItemId");

-- AddForeignKey
ALTER TABLE "LessonReflectionReport" ADD CONSTRAINT "LessonReflectionReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonReflectionReport" ADD CONSTRAINT "LessonReflectionReport_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerVocabularyInteraction" ADD CONSTRAINT "LearnerVocabularyInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerVocabularyInteraction" ADD CONSTRAINT "LearnerVocabularyInteraction_vocabularyItemId_fkey" FOREIGN KEY ("vocabularyItemId") REFERENCES "VocabularyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
