CREATE TYPE "LearnerActivitySurface" AS ENUM (
  'GENERAL',
  'LEARNING_JOURNEY',
  'HAN_TUTOR',
  'HAN_COMPANION',
  'SPEAKING_LAB',
  'WRITING_LAB',
  'MISSIONS',
  'HAN_VOCABULARY',
  'PLACEMENT'
);

CREATE TABLE "LearnerActivitySession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "clientSessionId" TEXT NOT NULL,
  "surface" "LearnerActivitySurface" NOT NULL,
  "path" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "lastActiveAt" TIMESTAMP(3) NOT NULL,
  "activeSeconds" INTEGER NOT NULL DEFAULT 0,
  "interactionCount" INTEGER NOT NULL DEFAULT 0,
  "lastSequence" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LearnerActivitySession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearnerActivitySession_userId_clientSessionId_surface_key"
ON "LearnerActivitySession"("userId", "clientSessionId", "surface");
CREATE INDEX "LearnerActivitySession_lastActiveAt_idx"
ON "LearnerActivitySession"("lastActiveAt");
CREATE INDEX "LearnerActivitySession_surface_lastActiveAt_idx"
ON "LearnerActivitySession"("surface", "lastActiveAt");
CREATE INDEX "LearnerActivitySession_userId_lastActiveAt_idx"
ON "LearnerActivitySession"("userId", "lastActiveAt");

ALTER TABLE "LearnerActivitySession"
ADD CONSTRAINT "LearnerActivitySession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
