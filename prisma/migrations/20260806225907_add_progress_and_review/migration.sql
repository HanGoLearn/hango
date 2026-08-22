-- CreateEnum
CREATE TYPE "ProgressEvidenceSource" AS ENUM ('EXERCISE', 'QUIZ', 'SPEAKING', 'WRITING', 'MISSION');

-- CreateTable
CREATE TABLE "ProgressEvidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "source" "ProgressEvidenceSource" NOT NULL,
    "result" DOUBLE PRECISION NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "relatedActivityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProgressEvidence_userId_competencyId_idx" ON "ProgressEvidence"("userId", "competencyId");

-- CreateIndex
CREATE INDEX "ReviewCompletion_userId_itemType_itemKey_createdAt_idx" ON "ReviewCompletion"("userId", "itemType", "itemKey", "createdAt");

-- AddForeignKey
ALTER TABLE "ProgressEvidence" ADD CONSTRAINT "ProgressEvidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEvidence" ADD CONSTRAINT "ProgressEvidence_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCompletion" ADD CONSTRAINT "ReviewCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
