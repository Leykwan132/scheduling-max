-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "stripeConnectAccountId" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "requiresUpfrontPayment" BOOLEAN NOT NULL DEFAULT false;
