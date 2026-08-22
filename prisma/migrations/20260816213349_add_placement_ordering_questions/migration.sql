-- CreateEnum
CREATE TYPE "PlacementQuestionType" AS ENUM ('MULTIPLE_CHOICE', 'SENTENCE_ORDERING');

-- AlterTable
ALTER TABLE "PlacementAttempt" ADD COLUMN     "submittedOrder" JSONB;

-- AlterTable
ALTER TABLE "PlacementQuestion" ADD COLUMN     "correctAnswer" JSONB,
ADD COLUMN     "type" "PlacementQuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE';
