-- CreateEnum
CREATE TYPE "StudyPlanStepType" AS ENUM ('LESSON', 'VOCABULARY', 'GRAMMAR', 'REVIEW');

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "theme" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyPlanStep" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "type" "StudyPlanStepType" NOT NULL,
    "order" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "lessonId" TEXT,
    "exerciseIndex" INTEGER,
    "vocabularyItemIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "grammarPointId" TEXT,
    "reviewItemType" TEXT,
    "reviewItemKey" TEXT,

    CONSTRAINT "StudyPlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudyPlan_userId_weekStartDate_key" ON "StudyPlan"("userId", "weekStartDate");

-- CreateIndex
CREATE INDEX "StudyPlanStep_planId_order_idx" ON "StudyPlanStep"("planId", "order");

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanStep" ADD CONSTRAINT "StudyPlanStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StudyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanStep" ADD CONSTRAINT "StudyPlanStep_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanStep" ADD CONSTRAINT "StudyPlanStep_grammarPointId_fkey" FOREIGN KEY ("grammarPointId") REFERENCES "GrammarPoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
