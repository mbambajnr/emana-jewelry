ALTER TABLE "Product" ADD COLUMN "metalOptions" TEXT[] NOT NULL DEFAULT ARRAY['Gold', 'Silver']::TEXT[];
