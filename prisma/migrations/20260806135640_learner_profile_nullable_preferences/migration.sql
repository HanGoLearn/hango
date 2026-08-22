-- AlterTable
ALTER TABLE "LearnerProfile" ALTER COLUMN "explanationLanguage" DROP NOT NULL,
ALTER COLUMN "explanationLanguage" DROP DEFAULT,
ALTER COLUMN "correctionStyle" DROP NOT NULL,
ALTER COLUMN "correctionStyle" DROP DEFAULT,
ALTER COLUMN "explanationStyle" DROP NOT NULL,
ALTER COLUMN "explanationStyle" DROP DEFAULT,
ALTER COLUMN "conversationStyle" DROP NOT NULL,
ALTER COLUMN "conversationStyle" DROP DEFAULT;
