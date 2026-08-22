/*
  Warnings:

  - You are about to drop the column `audioUrl` on the `DialogueLine` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DialogueLine" DROP COLUMN "audioUrl",
ADD COLUMN     "audioFilePath" TEXT;
