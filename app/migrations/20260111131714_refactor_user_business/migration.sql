/*
  Warnings:

  - You are about to drop the column `userId` on the `Business` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Business" DROP CONSTRAINT "Business_userId_fkey";

-- DropIndex
DROP INDEX "Business_userId_key";

-- AlterTable
ALTER TABLE "Business" DROP COLUMN "userId",
ADD COLUMN     "profileLogoUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "businessId" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "profileImage" TEXT,
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_slug_key" ON "User"("slug");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
