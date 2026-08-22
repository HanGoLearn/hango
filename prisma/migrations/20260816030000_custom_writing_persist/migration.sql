-- AlterTable
ALTER TABLE "WritingAttempt" ADD COLUMN     "customPrompt" JSONB,
ALTER COLUMN "taskId" DROP NOT NULL;
