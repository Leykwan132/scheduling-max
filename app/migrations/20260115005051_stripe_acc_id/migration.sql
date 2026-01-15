/*
  Warnings:

  - You are about to drop the column `stripeConnectAccountId` on the `Business` table. All the data in the column will be lost.
  - You are about to drop the column `requiresUpfrontPayment` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Business" DROP COLUMN "stripeConnectAccountId",
ADD COLUMN     "stripeAccountId" TEXT;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "requiresUpfrontPayment";
