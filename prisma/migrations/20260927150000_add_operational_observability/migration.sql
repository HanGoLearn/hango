CREATE TYPE "OperationalEventSeverity" AS ENUM (
    'INFO',
    'WARNING',
    'CRITICAL'
);

CREATE TYPE "OperationalEventSource" AS ENUM (
    'SERVER',
    'CLIENT',
    'CRON',
    'EMAIL',
    'STORAGE',
    'DATABASE'
);

CREATE TYPE "OperationalHeartbeatStatus" AS ENUM (
    'RUNNING',
    'HEALTHY',
    'DEGRADED',
    'FAILED'
);

CREATE TABLE "OperationalEvent" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "source" "OperationalEventSource" NOT NULL,
    "severity" "OperationalEventSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "route" TEXT,
    "method" TEXT,
    "digest" TEXT,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OperationalEvent_fingerprint_key"
    ON "OperationalEvent"("fingerprint");
CREATE INDEX "OperationalEvent_resolvedAt_severity_lastSeenAt_idx"
    ON "OperationalEvent"("resolvedAt", "severity", "lastSeenAt");
CREATE INDEX "OperationalEvent_source_lastSeenAt_idx"
    ON "OperationalEvent"("source", "lastSeenAt");

CREATE TABLE "OperationalHeartbeat" (
    "key" TEXT NOT NULL,
    "status" "OperationalHeartbeatStatus" NOT NULL,
    "lastStartedAt" TIMESTAMP(3),
    "lastSucceededAt" TIMESTAMP(3),
    "lastFailedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalHeartbeat_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "OperationalHeartbeat_status_updatedAt_idx"
    ON "OperationalHeartbeat"("status", "updatedAt");
