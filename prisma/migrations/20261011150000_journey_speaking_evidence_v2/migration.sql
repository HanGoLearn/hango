-- Additive Journey-only attempt/evaluation storage. No legacy data rewritten.
CREATE TYPE "JourneySpeakingCaptureStatus" AS ENUM ('ACTIVE', 'SEALED', 'TECHNICAL_FAILURE', 'CANCELLED');
CREATE TYPE "JourneySpeakingCloseReason" AS ENUM ('NATURAL', 'USER_END', 'TECHNICAL_FAILURE', 'ABANDONED');
CREATE TYPE "JourneySpeakingEvaluationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'PARTIAL', 'INSUFFICIENT', 'FAILED');

CREATE TABLE "JourneySpeakingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "rubricVersion" TEXT NOT NULL,
    "bankVersion" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "snapshotHash" TEXT NOT NULL,
    "status" "JourneySpeakingCaptureStatus" NOT NULL DEFAULT 'ACTIVE',
    "closeReason" "JourneySpeakingCloseReason",
    "captureHash" TEXT,
    "captureSource" TEXT NOT NULL DEFAULT 'browser-captured',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "JourneySpeakingAttempt_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "JourneySpeakingAttempt_locale_check" CHECK ("locale" IN ('es', 'en')),
    CONSTRAINT "JourneySpeakingAttempt_source_check" CHECK ("captureSource" = 'browser-captured')
);

CREATE TABLE "JourneySpeakingTurn" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JourneySpeakingTurn_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "JourneySpeakingTurn_sequence_check" CHECK ("sequence" BETWEEN 0 AND 79),
    CONSTRAINT "JourneySpeakingTurn_content_check" CHECK (length("content") BETWEEN 1 AND 3000),
    CONSTRAINT "JourneySpeakingTurn_role_check" CHECK ("role" IN ('USER', 'ASSISTANT'))
);

CREATE TABLE "JourneySpeakingEvaluation" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "rubricVersion" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "status" "JourneySpeakingEvaluationStatus" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER,
    "report" JSONB,
    "processingStartedAt" TIMESTAMP(3),
    "leaseToken" TEXT,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT,
    "model" TEXT,
    "usageLogId" TEXT,
    "failureCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JourneySpeakingEvaluation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "JourneySpeakingEvaluation_locale_check" CHECK ("locale" IN ('es', 'en')),
    CONSTRAINT "JourneySpeakingEvaluation_score_check" CHECK ("score" IS NULL OR "score" BETWEEN 0 AND 100),
    CONSTRAINT "JourneySpeakingEvaluation_completeness_check" CHECK (("status" = 'COMPLETE' AND "score" IS NOT NULL) OR ("status" <> 'COMPLETE' AND "score" IS NULL))
);

CREATE INDEX "JourneySpeakingAttempt_userId_lessonId_startedAt_idx" ON "JourneySpeakingAttempt"("userId", "lessonId", "startedAt");
CREATE INDEX "JourneySpeakingAttempt_status_startedAt_idx" ON "JourneySpeakingAttempt"("status", "startedAt");
CREATE UNIQUE INDEX "JourneySpeakingAttempt_userId_requestKey_key" ON "JourneySpeakingAttempt"("userId", "requestKey");
CREATE UNIQUE INDEX "JourneySpeakingTurn_attemptId_sequence_key" ON "JourneySpeakingTurn"("attemptId", "sequence");
CREATE UNIQUE INDEX "JourneySpeakingEvaluation_attemptId_key" ON "JourneySpeakingEvaluation"("attemptId");

ALTER TABLE "JourneySpeakingAttempt" ADD CONSTRAINT "JourneySpeakingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JourneySpeakingAttempt" ADD CONSTRAINT "JourneySpeakingAttempt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JourneySpeakingTurn" ADD CONSTRAINT "JourneySpeakingTurn_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "JourneySpeakingAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JourneySpeakingEvaluation" ADD CONSTRAINT "JourneySpeakingEvaluation_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "JourneySpeakingAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
