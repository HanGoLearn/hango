-- Additive metadata only; original attempt/evaluation migration is unchanged.
ALTER TABLE "JourneySpeakingAttempt" ADD COLUMN "captureQuality" JSONB;
ALTER TABLE "JourneySpeakingTurn" ADD COLUMN "recognition" JSONB;
