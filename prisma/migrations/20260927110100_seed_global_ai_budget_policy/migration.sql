-- Keep the singleton on the fast path. Runtime code still self-heals safely
-- if an operator removes the row, but ordinary calls need only one read.
INSERT INTO "AiBudgetPolicy" (
    "id",
    "dailyLimitMicrousd",
    "textEnabled",
    "sttEnabled",
    "ttsEnabled",
    "realtimeEnabled",
    "updatedAt"
) VALUES (
    'global',
    5000000,
    true,
    true,
    true,
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
