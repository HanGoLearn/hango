-- Copy the existing shared policy once. Never overwrite a separately configured
-- policy or reinterpret old cost logs: they have no reliable product attribution.
BEGIN;

INSERT INTO "AiUsageCap" ("feature", "dailyLimitUsd", "updatedAt")
SELECT target.feature, legacy."dailyLimitUsd", CURRENT_TIMESTAMP
FROM "AiUsageCap" legacy
CROSS JOIN (VALUES
  ('han-tutor-realtime-session'),
  ('han-companion-realtime-session'),
  ('journey-speaking-realtime-session'),
  ('speaking-lab-realtime-session'),
  ('placement-realtime-session')
) AS target(feature)
WHERE legacy."feature" = 'han-realtime-session'
ON CONFLICT ("feature") DO NOTHING;

INSERT INTO "AiUsageUserCap" ("userId", "feature", "dailyLimitUsd", "updatedAt")
SELECT legacy."userId", target.feature, legacy."dailyLimitUsd", CURRENT_TIMESTAMP
FROM "AiUsageUserCap" legacy
CROSS JOIN (VALUES
  ('han-tutor-realtime-session'),
  ('han-companion-realtime-session'),
  ('journey-speaking-realtime-session'),
  ('speaking-lab-realtime-session'),
  ('placement-realtime-session')
) AS target(feature)
WHERE legacy."feature" = 'han-realtime-session'
ON CONFLICT ("userId", "feature") DO NOTHING;

COMMIT;
