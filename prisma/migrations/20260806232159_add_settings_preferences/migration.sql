-- CreateEnum
CREATE TYPE "AiTeacherModeDefault" AS ENUM ('TUTOR', 'PRACTICE', 'REVIEW');

-- AlterTable
ALTER TABLE "LearnerProfile" ADD COLUMN     "defaultAiMode" "AiTeacherModeDefault" NOT NULL DEFAULT 'TUTOR',
ADD COLUMN     "recordingRetentionDays" INTEGER;
