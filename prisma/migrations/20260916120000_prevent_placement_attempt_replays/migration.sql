-- A placement question may contribute evidence only once per session.
-- This also makes concurrent/replayed submissions fail atomically instead
-- of awarding duplicate evidence.
CREATE UNIQUE INDEX "PlacementAttempt_sessionId_questionId_key"
ON "PlacementAttempt"("sessionId", "questionId");
