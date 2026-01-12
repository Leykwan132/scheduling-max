/*
  Warnings:

  - You are about to drop the `GptResponse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GptResponse" DROP CONSTRAINT "GptResponse_userId_fkey";

-- DropTable
DROP TABLE "GptResponse";
