-- CreateEnum
CREATE TYPE "LearnerFactCategory" AS ENUM ('JOB', 'GOAL', 'TRIP', 'FAMILY', 'HOBBY', 'OTHER');

-- CreateTable
CREATE TABLE "LearnerFact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "LearnerFactCategory" NOT NULL,
    "fact" TEXT NOT NULL,
    "sourceConversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerFact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearnerFact_userId_updatedAt_idx" ON "LearnerFact"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "LearnerFact" ADD CONSTRAINT "LearnerFact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
