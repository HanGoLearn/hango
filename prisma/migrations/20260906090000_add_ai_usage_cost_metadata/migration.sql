-- Preserve the method, historical rates, and audio-duration evidence used by
-- each AI cost estimate. Existing rows intentionally remain distinguishable
-- as LEGACY_ESTIMATE because those snapshots cannot be reconstructed safely.
CREATE TYPE "AiUsageCalculationMethod" AS ENUM ('TOKEN_RATES', 'PER_MINUTE', 'LEGACY_ESTIMATE');
CREATE TYPE "AiUsageDurationSource" AS ENUM ('CLIENT_RECORDED', 'PROVIDER_REPORTED', 'BYTE_SIZE_ESTIMATE', 'TEXT_LENGTH_ESTIMATE');

ALTER TABLE "AiUsageLog"
ADD COLUMN "calculationMethod" "AiUsageCalculationMethod" NOT NULL DEFAULT 'LEGACY_ESTIMATE',
ADD COLUMN "inputRateUsdPerMillionTokens" DOUBLE PRECISION,
ADD COLUMN "outputRateUsdPerMillionTokens" DOUBLE PRECISION,
ADD COLUMN "audioRateUsdPerMinute" DOUBLE PRECISION,
ADD COLUMN "durationSeconds" DOUBLE PRECISION,
ADD COLUMN "durationSource" "AiUsageDurationSource";
