CREATE TABLE "SocialSettings" (
  "id" TEXT NOT NULL DEFAULT 'site',
  "instagram" TEXT NOT NULL DEFAULT '',
  "facebook" TEXT NOT NULL DEFAULT '',
  "tiktok" TEXT NOT NULL DEFAULT '',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SocialSettings_pkey" PRIMARY KEY ("id")
);
