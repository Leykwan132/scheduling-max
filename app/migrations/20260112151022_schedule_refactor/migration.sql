/*
  Warnings:

  - You are about to drop the column `dates` on the `ScheduleOverride` table. All the data in the column will be lost.
  - Added the required column `date` to the `ScheduleOverride` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ScheduleOverride" DROP COLUMN "dates",
ADD COLUMN     "date" TEXT NOT NULL;
