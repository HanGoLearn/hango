-- Product-wide AI budget controls. Integer micro-dollars keep the atomic
-- authorization counter exact while still supporting sub-cent reservations.
CREATE TABLE "AiBudgetPolicy" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "dailyLimitMicrousd" INTEGER NOT NULL DEFAULT 5000000,
    "textEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sttEnabled" BOOLEAN NOT NULL DEFAULT true,
    "ttsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "realtimeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiBudgetPolicy_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AiDailyBudgetCounter" (
    "day" TEXT NOT NULL,
    "authorizedMicrousd" INTEGER NOT NULL DEFAULT 0,
    "authorizationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiDailyBudgetCounter_pkey" PRIMARY KEY ("day")
);
