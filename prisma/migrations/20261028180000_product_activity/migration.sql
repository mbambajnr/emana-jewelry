CREATE TABLE "ProductView" ("id" TEXT NOT NULL, "productSlug" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id"));
CREATE INDEX "ProductView_createdAt_productSlug_idx" ON "ProductView"("createdAt", "productSlug");
ALTER TABLE "WhatsAppClick" ADD COLUMN "productSlug" TEXT, ADD COLUMN "metal" TEXT;
