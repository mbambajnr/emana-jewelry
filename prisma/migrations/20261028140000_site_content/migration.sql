CREATE TABLE "SiteContent" (
  "id" TEXT NOT NULL DEFAULT 'site', "draft" JSONB NOT NULL, "published" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0, "publishedAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ContentRevision" (
  "id" TEXT NOT NULL, "content" JSONB NOT NULL, "action" TEXT NOT NULL, "actor" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ContentRevision_createdAt_idx" ON "ContentRevision"("createdAt");
