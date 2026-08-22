-- AlterEnum
BEGIN;
CREATE TYPE "AiTeacherModeDefault_new" AS ENUM ('TUTOR', 'PRACTICE');
ALTER TABLE "public"."LearnerProfile" ALTER COLUMN "defaultAiMode" DROP DEFAULT;
ALTER TABLE "LearnerProfile" ALTER COLUMN "defaultAiMode" TYPE "AiTeacherModeDefault_new" USING ("defaultAiMode"::text::"AiTeacherModeDefault_new");
ALTER TYPE "AiTeacherModeDefault" RENAME TO "AiTeacherModeDefault_old";
ALTER TYPE "AiTeacherModeDefault_new" RENAME TO "AiTeacherModeDefault";
DROP TYPE "public"."AiTeacherModeDefault_old";
ALTER TABLE "LearnerProfile" ALTER COLUMN "defaultAiMode" SET DEFAULT 'TUTOR';
COMMIT;

