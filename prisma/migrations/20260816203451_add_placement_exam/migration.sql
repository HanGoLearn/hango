-- CreateEnum
CREATE TYPE "PlacementSkill" AS ENUM ('VOCABULARY', 'GRAMMAR', 'READING', 'LISTENING');

-- CreateEnum
CREATE TYPE "PlacementSessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "PlacementQuestion" (
    "id" TEXT NOT NULL,
    "skill" "PlacementSkill" NOT NULL,
    "hskLevel" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "passage" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementQuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PlacementQuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementListeningScript" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "audioFilePath" TEXT,

    CONSTRAINT "PlacementListeningScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementListeningLine" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "voice" TEXT,
    "order" INTEGER NOT NULL,
    "chineseText" TEXT NOT NULL,
    "audioFilePath" TEXT,

    CONSTRAINT "PlacementListeningLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PlacementSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "vocabularyHskLevel" INTEGER,
    "grammarHskLevel" INTEGER,
    "readingHskLevel" INTEGER,
    "listeningHskLevel" INTEGER,

    CONSTRAINT "PlacementSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlacementQuestion_skill_hskLevel_category_idx" ON "PlacementQuestion"("skill", "hskLevel", "category");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementListeningScript_questionId_key" ON "PlacementListeningScript"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementListeningLine_scriptId_order_key" ON "PlacementListeningLine"("scriptId", "order");

-- CreateIndex
CREATE INDEX "PlacementSession_userId_status_idx" ON "PlacementSession"("userId", "status");

-- CreateIndex
CREATE INDEX "PlacementAttempt_sessionId_idx" ON "PlacementAttempt"("sessionId");

-- AddForeignKey
ALTER TABLE "PlacementQuestionOption" ADD CONSTRAINT "PlacementQuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PlacementQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementListeningScript" ADD CONSTRAINT "PlacementListeningScript_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PlacementQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementListeningLine" ADD CONSTRAINT "PlacementListeningLine_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "PlacementListeningScript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementSession" ADD CONSTRAINT "PlacementSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementAttempt" ADD CONSTRAINT "PlacementAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PlacementSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementAttempt" ADD CONSTRAINT "PlacementAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PlacementQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
