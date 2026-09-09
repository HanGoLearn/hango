-- AlterTable: ExerciseAttempt
-- review-data.ts's spaced-repetition queue query filters {userId, isCorrect}
-- and sorts by createdAt - not covered by the existing (userId, exerciseId) index.
CREATE INDEX "ExerciseAttempt_userId_isCorrect_createdAt_idx" ON "ExerciseAttempt"("userId", "isCorrect", "createdAt");

-- AlterTable: SpeakingSession
-- Nothing queries by startedAt; real lookups filter by completionState+completedAt
-- or userId+completionState. Replace the unused index with two that match reality.
DROP INDEX "SpeakingSession_userId_startedAt_idx";
CREATE INDEX "SpeakingSession_userId_completionState_completedAt_idx" ON "SpeakingSession"("userId", "completionState", "completedAt");
CREATE INDEX "SpeakingSession_completionState_completedAt_idx" ON "SpeakingSession"("completionState", "completedAt");

-- AlterTable: WritingTask
-- Only content model (vs. Exercise/Quiz/Mission/Dialogue) with no index at all.
CREATE INDEX "WritingTask_lessonId_idx" ON "WritingTask"("lessonId");

-- AlterTable: WritingAttempt
-- writing-data.ts/lab-points.ts/dashboard-data.ts filter {userId, submittedAt}
-- and sort by submittedAt - not covered by the existing (userId, taskId) index.
CREATE INDEX "WritingAttempt_userId_submittedAt_idx" ON "WritingAttempt"("userId", "submittedAt");

-- AlterTable: CoinLedgerEntry
-- getUnseenCoinGainsAction filters {userId, seenAt: null} and sorts by createdAt.
CREATE INDEX "CoinLedgerEntry_userId_seenAt_createdAt_idx" ON "CoinLedgerEntry"("userId", "seenAt", "createdAt");
