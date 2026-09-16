-- Phase 7 API security: shared, atomic rate-limit windows for serverless instances.
CREATE TABLE "ApiRateLimit" (
  "scope" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApiRateLimit_pkey" PRIMARY KEY ("scope", "keyHash", "windowStart"),
  CONSTRAINT "ApiRateLimit_count_positive" CHECK ("count" > 0)
);

CREATE INDEX "ApiRateLimit_expiresAt_idx" ON "ApiRateLimit"("expiresAt");
