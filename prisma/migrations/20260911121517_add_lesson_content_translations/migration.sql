-- CreateTable
CREATE TABLE "DialogueTranslation" (
    "id" TEXT NOT NULL,
    "dialogueId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "title" TEXT NOT NULL,
    "communicationObjective" TEXT,
    "contextDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DialogueTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DialogueSpeakerTranslation" (
    "id" TEXT NOT NULL,
    "dialogueSpeakerId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DialogueSpeakerTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DialogueLineTranslation" (
    "id" TEXT NOT NULL,
    "dialogueLineId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "translation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DialogueLineTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyItemTranslation" (
    "id" TEXT NOT NULL,
    "vocabularyItemId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "meaning" TEXT NOT NULL,
    "partOfSpeech" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyItemTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyExampleTranslation" (
    "id" TEXT NOT NULL,
    "vocabularyExampleId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "translation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyExampleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarPointTranslation" (
    "id" TEXT NOT NULL,
    "grammarPointId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "name" TEXT NOT NULL,
    "communicationPurpose" TEXT,
    "explanation" TEXT NOT NULL,
    "commonMistake" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrammarPointTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrammarExampleTranslation" (
    "id" TEXT NOT NULL,
    "grammarExampleId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "translation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrammarExampleTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseTranslation" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseOptionTranslation" (
    "id" TEXT NOT NULL,
    "exerciseOptionId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseOptionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseHintTranslation" (
    "id" TEXT NOT NULL,
    "exerciseHintId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseHintTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizTranslation" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestionTranslation" (
    "id" TEXT NOT NULL,
    "quizQuestionId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestionOptionTranslation" (
    "id" TEXT NOT NULL,
    "quizQuestionOptionId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestionOptionTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingTaskTranslation" (
    "id" TEXT NOT NULL,
    "writingTaskId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WritingTaskTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DialogueTranslation_locale_idx" ON "DialogueTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "DialogueTranslation_dialogueId_locale_key" ON "DialogueTranslation"("dialogueId", "locale");

-- CreateIndex
CREATE INDEX "DialogueSpeakerTranslation_locale_idx" ON "DialogueSpeakerTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "DialogueSpeakerTranslation_dialogueSpeakerId_locale_key" ON "DialogueSpeakerTranslation"("dialogueSpeakerId", "locale");

-- CreateIndex
CREATE INDEX "DialogueLineTranslation_locale_idx" ON "DialogueLineTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "DialogueLineTranslation_dialogueLineId_locale_key" ON "DialogueLineTranslation"("dialogueLineId", "locale");

-- CreateIndex
CREATE INDEX "VocabularyItemTranslation_locale_idx" ON "VocabularyItemTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyItemTranslation_vocabularyItemId_locale_key" ON "VocabularyItemTranslation"("vocabularyItemId", "locale");

-- CreateIndex
CREATE INDEX "VocabularyExampleTranslation_locale_idx" ON "VocabularyExampleTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyExampleTranslation_vocabularyExampleId_locale_key" ON "VocabularyExampleTranslation"("vocabularyExampleId", "locale");

-- CreateIndex
CREATE INDEX "GrammarPointTranslation_locale_idx" ON "GrammarPointTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarPointTranslation_grammarPointId_locale_key" ON "GrammarPointTranslation"("grammarPointId", "locale");

-- CreateIndex
CREATE INDEX "GrammarExampleTranslation_locale_idx" ON "GrammarExampleTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "GrammarExampleTranslation_grammarExampleId_locale_key" ON "GrammarExampleTranslation"("grammarExampleId", "locale");

-- CreateIndex
CREATE INDEX "ExerciseTranslation_locale_idx" ON "ExerciseTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseTranslation_exerciseId_locale_key" ON "ExerciseTranslation"("exerciseId", "locale");

-- CreateIndex
CREATE INDEX "ExerciseOptionTranslation_locale_idx" ON "ExerciseOptionTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseOptionTranslation_exerciseOptionId_locale_key" ON "ExerciseOptionTranslation"("exerciseOptionId", "locale");

-- CreateIndex
CREATE INDEX "ExerciseHintTranslation_locale_idx" ON "ExerciseHintTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseHintTranslation_exerciseHintId_locale_key" ON "ExerciseHintTranslation"("exerciseHintId", "locale");

-- CreateIndex
CREATE INDEX "QuizTranslation_locale_idx" ON "QuizTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "QuizTranslation_quizId_locale_key" ON "QuizTranslation"("quizId", "locale");

-- CreateIndex
CREATE INDEX "QuizQuestionTranslation_locale_idx" ON "QuizQuestionTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestionTranslation_quizQuestionId_locale_key" ON "QuizQuestionTranslation"("quizQuestionId", "locale");

-- CreateIndex
CREATE INDEX "QuizQuestionOptionTranslation_locale_idx" ON "QuizQuestionOptionTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestionOptionTranslation_quizQuestionOptionId_locale_key" ON "QuizQuestionOptionTranslation"("quizQuestionOptionId", "locale");

-- CreateIndex
CREATE INDEX "WritingTaskTranslation_locale_idx" ON "WritingTaskTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "WritingTaskTranslation_writingTaskId_locale_key" ON "WritingTaskTranslation"("writingTaskId", "locale");

-- RenameForeignKey
ALTER TABLE "MissionEvaluationCriterionTranslation" RENAME CONSTRAINT "MissionEvaluationCriterionTranslation_missionEvaluationCriterio" TO "MissionEvaluationCriterionTranslation_missionEvaluationCri_fkey";

-- RenameForeignKey
ALTER TABLE "MissionSuccessConditionTranslation" RENAME CONSTRAINT "MissionSuccessConditionTranslation_missionSuccessConditionId_fk" TO "MissionSuccessConditionTranslation_missionSuccessCondition_fkey";

-- AddForeignKey
ALTER TABLE "DialogueTranslation" ADD CONSTRAINT "DialogueTranslation_dialogueId_fkey" FOREIGN KEY ("dialogueId") REFERENCES "Dialogue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DialogueSpeakerTranslation" ADD CONSTRAINT "DialogueSpeakerTranslation_dialogueSpeakerId_fkey" FOREIGN KEY ("dialogueSpeakerId") REFERENCES "DialogueSpeaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DialogueLineTranslation" ADD CONSTRAINT "DialogueLineTranslation_dialogueLineId_fkey" FOREIGN KEY ("dialogueLineId") REFERENCES "DialogueLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyItemTranslation" ADD CONSTRAINT "VocabularyItemTranslation_vocabularyItemId_fkey" FOREIGN KEY ("vocabularyItemId") REFERENCES "VocabularyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyExampleTranslation" ADD CONSTRAINT "VocabularyExampleTranslation_vocabularyExampleId_fkey" FOREIGN KEY ("vocabularyExampleId") REFERENCES "VocabularyExample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarPointTranslation" ADD CONSTRAINT "GrammarPointTranslation_grammarPointId_fkey" FOREIGN KEY ("grammarPointId") REFERENCES "GrammarPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarExampleTranslation" ADD CONSTRAINT "GrammarExampleTranslation_grammarExampleId_fkey" FOREIGN KEY ("grammarExampleId") REFERENCES "GrammarExample"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseTranslation" ADD CONSTRAINT "ExerciseTranslation_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseOptionTranslation" ADD CONSTRAINT "ExerciseOptionTranslation_exerciseOptionId_fkey" FOREIGN KEY ("exerciseOptionId") REFERENCES "ExerciseOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseHintTranslation" ADD CONSTRAINT "ExerciseHintTranslation_exerciseHintId_fkey" FOREIGN KEY ("exerciseHintId") REFERENCES "ExerciseHint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizTranslation" ADD CONSTRAINT "QuizTranslation_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestionTranslation" ADD CONSTRAINT "QuizQuestionTranslation_quizQuestionId_fkey" FOREIGN KEY ("quizQuestionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestionOptionTranslation" ADD CONSTRAINT "QuizQuestionOptionTranslation_quizQuestionOptionId_fkey" FOREIGN KEY ("quizQuestionOptionId") REFERENCES "QuizQuestionOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingTaskTranslation" ADD CONSTRAINT "WritingTaskTranslation_writingTaskId_fkey" FOREIGN KEY ("writingTaskId") REFERENCES "WritingTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "MissionEvaluationCriterionTranslation_missionEvaluationCriterio" RENAME TO "MissionEvaluationCriterionTranslation_missionEvaluationCrit_key";

-- RenameIndex
ALTER INDEX "MissionSuccessConditionTranslation_missionSuccessConditionId_lo" RENAME TO "MissionSuccessConditionTranslation_missionSuccessConditionI_key";
