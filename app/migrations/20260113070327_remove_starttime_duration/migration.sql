/*
  Warnings:

  - You are about to drop the column `duration` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Booking` table. All the data in the column will be lost.
  - Made the column `endTimeUtc` on table `Booking` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startTimeUtc` on table `Booking` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "duration",
DROP COLUMN "startTime",
ALTER COLUMN "endTimeUtc" SET NOT NULL,
ALTER COLUMN "startTimeUtc" SET NOT NULL;
