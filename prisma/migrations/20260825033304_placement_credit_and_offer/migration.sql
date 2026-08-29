-- CreateEnum
CREATE TYPE "LessonCompletionSource" AS ENUM ('PLACEMENT', 'COMPLETED');

-- AlterTable
ALTER TABLE "LearnerLessonCompletion" ADD COLUMN     "source" "LessonCompletionSource" NOT NULL DEFAULT 'COMPLETED';

-- AlterTable
ALTER TABLE "LearnerProfile" ADD COLUMN     "placementExamOfferAcknowledgedAt" TIMESTAMP(3);
