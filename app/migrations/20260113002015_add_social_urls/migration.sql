-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "isContactEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isFacebookEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isInstagramEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPhoneEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isTikTokEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isWebsiteEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "tiktokUrl" TEXT,
ADD COLUMN     "websiteUrl" TEXT;
