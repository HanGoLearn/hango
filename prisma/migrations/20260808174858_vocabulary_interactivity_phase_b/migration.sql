/*
  Warnings:

  - You are about to drop the column `exampleSentenceChinese` on the `VocabularyItem` table. All the data in the column will be lost.
  - You are about to drop the column `exampleSentencePinyin` on the `VocabularyItem` table. All the data in the column will be lost.
  - You are about to drop the column `exampleSentenceTranslation` on the `VocabularyItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VocabularyItem" DROP COLUMN "exampleSentenceChinese",
DROP COLUMN "exampleSentencePinyin",
DROP COLUMN "exampleSentenceTranslation",
ADD COLUMN     "audioFilePath" TEXT;

-- CreateTable
CREATE TABLE "VocabularyExample" (
    "id" TEXT NOT NULL,
    "vocabularyItemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "chineseText" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "translation" TEXT NOT NULL,
    "audioFilePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyExample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyExample_vocabularyItemId_order_key" ON "VocabularyExample"("vocabularyItemId", "order");

-- AddForeignKey
ALTER TABLE "VocabularyExample" ADD CONSTRAINT "VocabularyExample_vocabularyItemId_fkey" FOREIGN KEY ("vocabularyItemId") REFERENCES "VocabularyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
