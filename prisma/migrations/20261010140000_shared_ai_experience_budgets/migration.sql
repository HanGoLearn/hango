-- Shared experience budgets. Preserve raw keys as read-only legacy policies.
-- Choose the strictest explicit child policy; do not sum/multiply allowances.
BEGIN;
ALTER TABLE "AiUsageLog" ADD COLUMN "experience" TEXT;
ALTER TABLE "AiOperationLog" ADD COLUMN "experience" TEXT;
CREATE INDEX "AiUsageLog_userId_experience_createdAt_idx" ON "AiUsageLog" ("userId", "experience", "createdAt");
CREATE TEMP TABLE "_AiExperienceMap" ("feature" TEXT, "experience" TEXT, "fixed" BOOLEAN) ON COMMIT DROP;
INSERT INTO "_AiExperienceMap" VALUES
('han-tutor-chat', 'HAN_TUTOR', true),
('han-tutor-realtime-session', 'HAN_TUTOR', true),
('han-companion-chat', 'HAN_COMPANION', true),
('han-companion-realtime-session', 'HAN_COMPANION', true),
('learner-fact-extraction', 'HAN_COMPANION', true),
('roleplay-chat', 'JOURNEY_SPEAKING', false),
('roleplay-chat', 'SPEAKING_LAB', false),
('roleplay-chat', 'PLACEMENT', false),
('han-realtime-assessment', 'JOURNEY_SPEAKING', false),
('han-realtime-assessment', 'SPEAKING_LAB', false),
('han-realtime-assessment', 'PLACEMENT', false),
('han-speech', 'HAN_TUTOR', false),
('han-speech', 'HAN_COMPANION', false),
('han-speech', 'LESSON_REFLECTION', false),
('han-speech', 'SHARED_AUDIO', false),
('han-speech', 'JOURNEY_SPEAKING', false),
('han-speech', 'SPEAKING_LAB', false),
('han-teacher-transcribe', 'HAN_TUTOR', false),
('han-teacher-transcribe', 'HAN_COMPANION', false),
('journey-speaking-realtime-session', 'JOURNEY_SPEAKING', true),
('speaking-lab-realtime-session', 'SPEAKING_LAB', true),
('speaking-feedback', 'SPEAKING_LAB', true),
('speaking-transcribe', 'SPEAKING_LAB', true),
('speaking-scenario', 'SPEAKING_LAB', true),
('free-topic-feedback', 'SPEAKING_LAB', true),
('placement-realtime-session', 'PLACEMENT', true),
('placement-grading', 'PLACEMENT', true),
('vocabulary-lookup', 'HAN_VOCABULARY', true),
('lesson-reflection', 'LESSON_REFLECTION', true),
('writing-feedback', 'WRITING_LAB', true),
('handwritten-writing', 'WRITING_LAB', true),
('mission-chat', 'MISSIONS', true),
('mission-report', 'MISSIONS', true),
('welcome-audio', 'SHARED_AUDIO', true),
('dialogue-audio', 'SHARED_AUDIO', true),
('grammar-audio', 'SHARED_AUDIO', true),
('vocabulary-audio', 'SHARED_AUDIO', true),
('placement-listening-audio', 'SHARED_AUDIO', true);

-- Only unambiguous attribution is backfilled, never mixed chat/voice or generic TTS/STT.
UPDATE "AiUsageLog" log SET "experience" = m."experience"
FROM "_AiExperienceMap" m WHERE m."fixed" AND log."feature" = m."feature";
UPDATE "AiOperationLog" log SET "experience" = m."experience"
FROM "_AiExperienceMap" m WHERE m."fixed" AND log."feature" = m."feature";

INSERT INTO "AiUsageCap" ("feature", "dailyLimitUsd", "updatedAt")
SELECT 'experience:' || m."experience", COALESCE(MIN(c."dailyLimitUsd"), 1), CURRENT_TIMESTAMP
FROM "_AiExperienceMap" m LEFT JOIN "AiUsageCap" c ON c."feature" = m."feature"
GROUP BY m."experience" ON CONFLICT ("feature") DO NOTHING;

INSERT INTO "AiUsageUserCap" ("userId", "feature", "dailyLimitUsd", "updatedAt")
SELECT c."userId", 'experience:' || m."experience", MIN(c."dailyLimitUsd"), CURRENT_TIMESTAMP
FROM "_AiExperienceMap" m JOIN "AiUsageUserCap" c ON c."feature" = m."feature"
GROUP BY c."userId", m."experience" ON CONFLICT ("userId", "feature") DO NOTHING;
COMMIT;
