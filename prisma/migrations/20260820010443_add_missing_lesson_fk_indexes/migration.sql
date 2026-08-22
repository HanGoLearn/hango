-- CreateIndex
CREATE INDEX "Dialogue_lessonId_idx" ON "Dialogue"("lessonId");

-- CreateIndex
CREATE INDEX "Exercise_lessonId_idx" ON "Exercise"("lessonId");

-- CreateIndex
CREATE INDEX "Exercise_grammarPointId_idx" ON "Exercise"("grammarPointId");

-- CreateIndex
CREATE INDEX "LearningObjective_scenarioId_idx" ON "LearningObjective"("scenarioId");

-- CreateIndex
CREATE INDEX "LearningObjective_lessonId_idx" ON "LearningObjective"("lessonId");

-- CreateIndex
CREATE INDEX "Mission_lessonId_idx" ON "Mission"("lessonId");

-- CreateIndex
CREATE INDEX "Mission_scenarioId_idx" ON "Mission"("scenarioId");

-- CreateIndex
CREATE INDEX "Quiz_lessonId_idx" ON "Quiz"("lessonId");
