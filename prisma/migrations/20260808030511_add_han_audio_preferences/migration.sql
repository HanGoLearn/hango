-- CreateEnum
CREATE TYPE "HanResponseMode" AS ENUM ('TEXT_ONLY', 'TEXT_AND_AUDIO');

-- AlterTable
ALTER TABLE "LearnerProfile" ADD COLUMN     "hanResponseMode" "HanResponseMode" NOT NULL DEFAULT 'TEXT_ONLY',
ADD COLUMN     "hanVoice" TEXT NOT NULL DEFAULT 'cedar';
