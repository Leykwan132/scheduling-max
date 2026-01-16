/*
  Warnings:

  - You are about to drop the column `styleBackground` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `stylePrimaryColor` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `styleSecondaryColor` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `styleTemplate` on the `Business` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Business" DROP COLUMN "styleBackground",
DROP COLUMN "stylePrimaryColor",
DROP COLUMN "styleSecondaryColor",
DROP COLUMN "styleTemplate";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "styleConfig" TEXT;
