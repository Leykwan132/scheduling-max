-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bufferAfter" INTEGER DEFAULT 0,
ADD COLUMN     "bufferBefore" INTEGER DEFAULT 0;
