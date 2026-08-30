-- AlterTable
ALTER TABLE "LearnerProfile" ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "nickname" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LearnerProfile_nickname_key" ON "LearnerProfile"("nickname");
