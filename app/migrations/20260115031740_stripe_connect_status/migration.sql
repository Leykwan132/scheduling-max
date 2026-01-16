/*
  Warnings:

  - You are about to drop the column `stripeAccountId` on the `Business` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Business" DROP COLUMN "stripeAccountId";

-- CreateTable
CREATE TABLE "StripeConnectAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "displayName" TEXT,
    "country" TEXT NOT NULL DEFAULT 'us',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'usd',
    "dashboardAccess" TEXT NOT NULL DEFAULT 'full',
    "onboardingStatus" TEXT NOT NULL DEFAULT 'not_started',
    "disabledReason" TEXT,
    "requirementsStatus" TEXT,
    "pendingRequirements" TEXT,
    "cardPaymentsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "transfersEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastWebhookAt" TIMESTAMP(3),

    CONSTRAINT "StripeConnectAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeConnectAccount_businessId_key" ON "StripeConnectAccount"("businessId");

-- AddForeignKey
ALTER TABLE "StripeConnectAccount" ADD CONSTRAINT "StripeConnectAccount_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
