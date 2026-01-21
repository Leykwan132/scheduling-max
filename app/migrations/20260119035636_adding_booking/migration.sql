-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "reminderPreference" TEXT NOT NULL DEFAULT 'email',
ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;
