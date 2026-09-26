-- Vercel has no durable local filesystem. Keep receipt images private in
-- PostgreSQL when an external object-storage provider is not configured.
CREATE TABLE "PrivateReceipt" (
  "objectKey" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "bytes" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PrivateReceipt_pkey" PRIMARY KEY ("objectKey"),
  CONSTRAINT "PrivateReceipt_contentType_supported"
    CHECK ("contentType" IN ('image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT "PrivateReceipt_size_valid"
    CHECK (octet_length("bytes") BETWEEN 1 AND 8388608)
);

CREATE INDEX "PrivateReceipt_createdAt_idx"
ON "PrivateReceipt"("createdAt");
