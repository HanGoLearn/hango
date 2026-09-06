/*
  Warnings:

  - You are about to drop the `StudyPlan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudyPlanStep` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudyPlan" DROP CONSTRAINT "StudyPlan_userId_fkey";

-- DropForeignKey
ALTER TABLE "StudyPlanStep" DROP CONSTRAINT "StudyPlanStep_grammarPointId_fkey";

-- DropForeignKey
ALTER TABLE "StudyPlanStep" DROP CONSTRAINT "StudyPlanStep_lessonId_fkey";

-- DropForeignKey
ALTER TABLE "StudyPlanStep" DROP CONSTRAINT "StudyPlanStep_planId_fkey";

-- DropTable
DROP TABLE "StudyPlan";

-- DropTable
DROP TABLE "StudyPlanStep";

-- DropEnum
DROP TYPE "StudyPlanStepType";
