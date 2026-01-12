/*
  Warnings:

  - You are about to drop the column `profileImage` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[profileImageFileId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileImage",
ADD COLUMN     "profileImageFileId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_profileImageFileId_key" ON "User"("profileImageFileId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileImageFileId_fkey" FOREIGN KEY ("profileImageFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
