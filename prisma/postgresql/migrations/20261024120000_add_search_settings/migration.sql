CREATE TABLE "SearchSettings" (
  "id" TEXT NOT NULL DEFAULT 'site',
  "googleVerification" TEXT NOT NULL DEFAULT '',
  "bingVerification" TEXT NOT NULL DEFAULT '',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SearchSettings_pkey" PRIMARY KEY ("id")
);
