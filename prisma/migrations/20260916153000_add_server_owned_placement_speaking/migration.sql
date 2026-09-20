ALTER TYPE "PlacementSessionStatus" ADD VALUE 'SPEAKING';

CREATE TYPE "PlacementSpeakingAttemptStatus" AS ENUM ('PENDING', 'GRADING', 'COMPLETED');

ALTER TABLE "PlacementSession"
ADD COLUMN "speakingHskLevel" INTEGER,
ADD COLUMN "speakingDiagnosticHskLevel" INTEGER;

CREATE TABLE "PlacementSpeakingAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "hskLevel" INTEGER NOT NULL,
    "status" "PlacementSpeakingAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "transcript" JSONB NOT NULL DEFAULT '[]',
    "learnerAsrConfidences" JSONB NOT NULL DEFAULT '[]',
    "evaluation" JSONB,
    "pronunciation" INTEGER,
    "fluency" INTEGER,
    "accuracy" INTEGER,
    "complexity" INTEGER,
    "communicationEffectiveness" INTEGER,
    "objectiveCompletionRatio" DOUBLE PRECISION,
    "score" INTEGER,
    "passed" BOOLEAN,
    "diagnosticOnly" BOOLEAN NOT NULL DEFAULT false,
    "evaluatorProvider" TEXT,
    "evaluatorModel" TEXT,
    "gradingStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PlacementSpeakingAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlacementSpeakingAttempt_sessionId_hskLevel_key"
ON "PlacementSpeakingAttempt"("sessionId", "hskLevel");

CREATE INDEX "PlacementSpeakingAttempt_sessionId_status_idx"
ON "PlacementSpeakingAttempt"("sessionId", "status");

ALTER TABLE "PlacementSpeakingAttempt"
ADD CONSTRAINT "PlacementSpeakingAttempt_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "PlacementSession"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
