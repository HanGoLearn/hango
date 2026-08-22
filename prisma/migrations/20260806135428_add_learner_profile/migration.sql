-- CreateEnum
CREATE TYPE "InterfaceLanguage" AS ENUM ('EN', 'ES');

-- CreateEnum
CREATE TYPE "ExplanationLanguage" AS ENUM ('EN', 'ES', 'ZH');

-- CreateEnum
CREATE TYPE "ChineseLevel" AS ENUM ('HSK_3', 'HSK_4', 'HSK_5', 'HSK_6', 'HSK_7_9', 'UNSURE');

-- CreateEnum
CREATE TYPE "LearningGoal" AS ENUM ('SPEAK_CONFIDENTLY', 'HSK_PREPARATION', 'TRAVEL', 'WORK', 'STUDY', 'PERSONAL_INTEREST');

-- CreateEnum
CREATE TYPE "SkillPriority" AS ENUM ('LISTENING', 'SPEAKING', 'READING', 'WRITING', 'GRAMMAR', 'VOCABULARY');

-- CreateEnum
CREATE TYPE "CorrectionStyle" AS ENUM ('IMMEDIATE', 'AFTER_CONVERSATION', 'ONLY_IMPORTANT');

-- CreateEnum
CREATE TYPE "ExplanationStyle" AS ENUM ('SHORT', 'DETAILED');

-- CreateEnum
CREATE TYPE "ConversationStyle" AS ENUM ('FRIENDLY', 'PROFESSIONAL', 'STRICT_TEACHER');

-- CreateTable
CREATE TABLE "LearnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interfaceLanguage" "InterfaceLanguage" NOT NULL DEFAULT 'EN',
    "explanationLanguage" "ExplanationLanguage" NOT NULL DEFAULT 'EN',
    "currentLevel" "ChineseLevel",
    "learningGoals" "LearningGoal"[],
    "skillPriorities" "SkillPriority"[],
    "dailyStudyTargetMinutes" INTEGER,
    "correctionStyle" "CorrectionStyle" NOT NULL DEFAULT 'ONLY_IMPORTANT',
    "explanationStyle" "ExplanationStyle" NOT NULL DEFAULT 'SHORT',
    "conversationStyle" "ConversationStyle" NOT NULL DEFAULT 'FRIENDLY',
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearnerProfile_userId_key" ON "LearnerProfile"("userId");

-- AddForeignKey
ALTER TABLE "LearnerProfile" ADD CONSTRAINT "LearnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
