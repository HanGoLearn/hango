-- Optional user-specific AI limits. A zero limit means the feature is
-- explicitly blocked; absence of a row inherits AiUsageCap/default behavior.
CREATE TABLE "AiUsageUserCap" (
    "userId" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "dailyLimitUsd" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiUsageUserCap_pkey" PRIMARY KEY ("userId", "feature")
);

CREATE INDEX "AiUsageUserCap_feature_idx" ON "AiUsageUserCap"("feature");

ALTER TABLE "AiUsageUserCap" ADD CONSTRAINT "AiUsageUserCap_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
