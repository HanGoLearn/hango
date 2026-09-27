-- Guided tour progress (2026-09-23).
--
-- Additive only: three new columns on an existing table, every one of them
-- nullable or defaulted, so existing rows need no backfill and nothing
-- already stored is read or rewritten.
--
-- `seenTourHints` is a list rather than a column per section so that adding
-- a section later needs no further migration.
-- AlterTable
ALTER TABLE "LearnerProfile" ADD COLUMN     "seenTourHints" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tourCompletedAt" TIMESTAMP(3),
ADD COLUMN     "tourSkippedAt" TIMESTAMP(3);
