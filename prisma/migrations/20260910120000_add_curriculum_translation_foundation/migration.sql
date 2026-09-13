-- Phase 4A: locale-specific curriculum display copy. Existing authored
-- English fields remain on their base records as the safe fallback.

CREATE TABLE "DomainTranslation" (
    "id" TEXT NOT NULL,
    "domainId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DomainTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScenarioTranslation" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "context" TEXT,
    "communicationOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LessonTranslation" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "title" TEXT NOT NULL,
    "communicationObjective" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LessonStepTranslation" (
    "id" TEXT NOT NULL,
    "lessonStepId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonStepTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LearningObjectiveTranslation" (
    "id" TEXT NOT NULL,
    "learningObjectiveId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningObjectiveTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MissionTranslation" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT,
    "objective" TEXT NOT NULL,
    "learnerRole" TEXT,
    "aiRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MissionSuccessConditionTranslation" (
    "id" TEXT NOT NULL,
    "missionSuccessConditionId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionSuccessConditionTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MissionEvaluationCriterionTranslation" (
    "id" TEXT NOT NULL,
    "missionEvaluationCriterionId" TEXT NOT NULL,
    "locale" "InterfaceLanguage" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MissionEvaluationCriterionTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DomainTranslation_domainId_locale_key" ON "DomainTranslation"("domainId", "locale");
CREATE INDEX "DomainTranslation_locale_idx" ON "DomainTranslation"("locale");
CREATE UNIQUE INDEX "ScenarioTranslation_scenarioId_locale_key" ON "ScenarioTranslation"("scenarioId", "locale");
CREATE INDEX "ScenarioTranslation_locale_idx" ON "ScenarioTranslation"("locale");
CREATE UNIQUE INDEX "LessonTranslation_lessonId_locale_key" ON "LessonTranslation"("lessonId", "locale");
CREATE INDEX "LessonTranslation_locale_idx" ON "LessonTranslation"("locale");
CREATE UNIQUE INDEX "LessonStepTranslation_lessonStepId_locale_key" ON "LessonStepTranslation"("lessonStepId", "locale");
CREATE INDEX "LessonStepTranslation_locale_idx" ON "LessonStepTranslation"("locale");
CREATE UNIQUE INDEX "LearningObjectiveTranslation_learningObjectiveId_locale_key" ON "LearningObjectiveTranslation"("learningObjectiveId", "locale");
CREATE INDEX "LearningObjectiveTranslation_locale_idx" ON "LearningObjectiveTranslation"("locale");
CREATE UNIQUE INDEX "MissionTranslation_missionId_locale_key" ON "MissionTranslation"("missionId", "locale");
CREATE INDEX "MissionTranslation_locale_idx" ON "MissionTranslation"("locale");
CREATE UNIQUE INDEX "MissionSuccessConditionTranslation_missionSuccessConditionId_locale_key" ON "MissionSuccessConditionTranslation"("missionSuccessConditionId", "locale");
CREATE INDEX "MissionSuccessConditionTranslation_locale_idx" ON "MissionSuccessConditionTranslation"("locale");
CREATE UNIQUE INDEX "MissionEvaluationCriterionTranslation_missionEvaluationCriterionId_locale_key" ON "MissionEvaluationCriterionTranslation"("missionEvaluationCriterionId", "locale");
CREATE INDEX "MissionEvaluationCriterionTranslation_locale_idx" ON "MissionEvaluationCriterionTranslation"("locale");

ALTER TABLE "DomainTranslation" ADD CONSTRAINT "DomainTranslation_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScenarioTranslation" ADD CONSTRAINT "ScenarioTranslation_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonTranslation" ADD CONSTRAINT "LessonTranslation_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonStepTranslation" ADD CONSTRAINT "LessonStepTranslation_lessonStepId_fkey" FOREIGN KEY ("lessonStepId") REFERENCES "LessonStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningObjectiveTranslation" ADD CONSTRAINT "LearningObjectiveTranslation_learningObjectiveId_fkey" FOREIGN KEY ("learningObjectiveId") REFERENCES "LearningObjective"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MissionTranslation" ADD CONSTRAINT "MissionTranslation_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MissionSuccessConditionTranslation" ADD CONSTRAINT "MissionSuccessConditionTranslation_missionSuccessConditionId_fkey" FOREIGN KEY ("missionSuccessConditionId") REFERENCES "MissionSuccessCondition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MissionEvaluationCriterionTranslation" ADD CONSTRAINT "MissionEvaluationCriterionTranslation_missionEvaluationCriterionId_fkey" FOREIGN KEY ("missionEvaluationCriterionId") REFERENCES "MissionEvaluationCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
