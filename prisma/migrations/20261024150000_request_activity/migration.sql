CREATE TABLE "RequestActivity" (
  "id" TEXT NOT NULL,
  "requestKind" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "fromStatus" TEXT NOT NULL,
  "toStatus" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "actor" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RequestActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RequestActivity_requestKind_requestId_createdAt_idx" ON "RequestActivity"("requestKind", "requestId", "createdAt");
UPDATE "Order" SET "status" = 'new' WHERE "status" = 'pending';
ALTER TABLE "Consultation" ALTER COLUMN "status" SET DEFAULT 'requested';

ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'new';
