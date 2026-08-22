-- AlterEnum
BEGIN;
CREATE TYPE "WritingTaskType_new" AS ENUM ('SHORT_MESSAGE', 'PARAGRAPH', 'PRACTICAL_WRITING', 'TRANSLATION_CHALLENGE');
ALTER TABLE "WritingTask" ALTER COLUMN "type" TYPE "WritingTaskType_new" USING ("type"::text::"WritingTaskType_new");
ALTER TYPE "WritingTaskType" RENAME TO "WritingTaskType_old";
ALTER TYPE "WritingTaskType_new" RENAME TO "WritingTaskType";
DROP TYPE "public"."WritingTaskType_old";
COMMIT;

-- AlterTable
ALTER TABLE "WritingTask" ADD COLUMN     "referenceAnswer" TEXT;

