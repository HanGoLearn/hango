-- AlterTable
ALTER TABLE "Exercise" ADD COLUMN     "grammarPointId" TEXT;

-- AlterTable
ALTER TABLE "GrammarExample" ADD COLUMN     "audioFilePath" TEXT;

-- AlterTable
ALTER TABLE "GrammarPoint" ADD COLUMN     "detailedExplanation" TEXT;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_grammarPointId_fkey" FOREIGN KEY ("grammarPointId") REFERENCES "GrammarPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
