-- Preserve pre-existing general limits and per-user exceptions. Historical
-- logs have no reliable product attribution and are intentionally untouched.
BEGIN;
INSERT INTO "AiUsageCap" ("feature", "dailyLimitUsd", "updatedAt")
SELECT target.feature, legacy."dailyLimitUsd", CURRENT_TIMESTAMP
FROM "AiUsageCap" legacy
CROSS JOIN (VALUES ('han-tutor-chat'), ('han-companion-chat'), ('roleplay-chat')) AS target(feature)
WHERE legacy."feature" = 'ai-teacher-chat'
ON CONFLICT ("feature") DO NOTHING;

INSERT INTO "AiUsageUserCap" ("userId", "feature", "dailyLimitUsd", "updatedAt")
SELECT legacy."userId", target.feature, legacy."dailyLimitUsd", CURRENT_TIMESTAMP
FROM "AiUsageUserCap" legacy
CROSS JOIN (VALUES ('han-tutor-chat'), ('han-companion-chat'), ('roleplay-chat')) AS target(feature)
WHERE legacy."feature" = 'ai-teacher-chat'
ON CONFLICT ("userId", "feature") DO NOTHING;
COMMIT;
