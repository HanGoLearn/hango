-- AlterEnum
ALTER TYPE "HanResponseMode" ADD VALUE 'AUDIO_ONLY';

-- AlterTable
ALTER TABLE "LearnerProfile" ALTER COLUMN "hanResponseMode" SET DEFAULT 'AUDIO_ONLY';

-- DataMigration: restrict Han's voice to Cedar (2026-08-21, user request)
-- Existing profiles on any other voice are backfilled now; new profiles
-- already default to "cedar" via the schema's @default. Does not touch
-- hanResponseMode - existing profiles keep whatever response mode they
-- already had, only the new default (above) changes for future signups.
UPDATE "LearnerProfile" SET "hanVoice" = 'cedar' WHERE "hanVoice" <> 'cedar';
