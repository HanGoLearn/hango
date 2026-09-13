-- Match ScenarioTranslation.communicationOutcomes' required Prisma list.
-- The table is new and empty, so enforcing the constraint is non-destructive.
ALTER TABLE "ScenarioTranslation"
ALTER COLUMN "communicationOutcomes" SET NOT NULL;
