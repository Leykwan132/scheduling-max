-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "styleBackground" TEXT NOT NULL DEFAULT '#FDFDFD',
ADD COLUMN     "stylePrimaryColor" TEXT NOT NULL DEFAULT '#FFC857',
ADD COLUMN     "styleSecondaryColor" TEXT NOT NULL DEFAULT '#E9F5DB',
ADD COLUMN     "styleTemplate" TEXT NOT NULL DEFAULT 'modern';
