-- CreateTable
CREATE TABLE "Promo" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Promo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Promo" ADD CONSTRAINT "Promo_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
