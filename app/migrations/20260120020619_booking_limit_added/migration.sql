-- AlterTable
ALTER TABLE "User" ADD COLUMN     "maxAppointmentsMode" TEXT DEFAULT 'fully_booked',
ADD COLUMN     "maxAppointmentsPerDay" INTEGER DEFAULT 0;
