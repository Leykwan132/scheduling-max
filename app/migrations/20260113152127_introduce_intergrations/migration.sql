-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "isGoogleCalendarConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isStripeConnected" BOOLEAN NOT NULL DEFAULT false;
