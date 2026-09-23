-- Customer accounts use revocable opaque sessions. Existing checkout-created
-- users remain valid historical records but cannot sign in until an account is
-- explicitly created or recovered.
ALTER TABLE "User"
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "defaultCity" TEXT,
ADD COLUMN "defaultAddressLine" TEXT,
ADD COLUMN "defaultPostalCode" TEXT,
ADD COLUMN "defaultPlaque" TEXT,
ADD COLUMN "defaultUnit" TEXT;

UPDATE "User"
SET "email" = lower(trim("email"))
WHERE "email" IS NOT NULL;

DROP INDEX IF EXISTS "User_email_idx";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "UserSession" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSession_tokenHash_key"
ON "UserSession"("tokenHash");
CREATE INDEX "UserSession_userId_expiresAt_idx"
ON "UserSession"("userId", "expiresAt");
CREATE INDEX "UserSession_expiresAt_idx"
ON "UserSession"("expiresAt");

ALTER TABLE "UserSession"
ADD CONSTRAINT "UserSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Delivery data is copied to each order so later profile edits never rewrite
-- the address or recipient identity of an existing purchase.
ALTER TABLE "Order"
ADD COLUMN "recipientName" TEXT,
ADD COLUMN "recipientPhoneNormalized" TEXT,
ADD COLUMN "recipientEmail" TEXT,
ADD COLUMN "shippingCity" TEXT,
ADD COLUMN "shippingAddressLine" TEXT,
ADD COLUMN "shippingPostalCode" TEXT,
ADD COLUMN "shippingPlaque" TEXT,
ADD COLUMN "shippingUnit" TEXT;

UPDATE "Order" AS orders
SET
  "recipientName" = users."name",
  "recipientPhoneNormalized" = users."phoneNormalized",
  "recipientEmail" = COALESCE(users."email", ''),
  "shippingCity" = 'ثبت‌نشده',
  "shippingAddressLine" = 'نشانی سفارش قدیمی ثبت نشده است',
  "shippingPostalCode" = '0000000000',
  "shippingPlaque" = '—'
FROM "User" AS users
WHERE users."id" = orders."userId";

ALTER TABLE "Order"
ALTER COLUMN "recipientName" SET NOT NULL,
ALTER COLUMN "recipientPhoneNormalized" SET NOT NULL,
ALTER COLUMN "recipientEmail" SET NOT NULL,
ALTER COLUMN "shippingCity" SET NOT NULL,
ALTER COLUMN "shippingAddressLine" SET NOT NULL,
ALTER COLUMN "shippingPostalCode" SET NOT NULL,
ALTER COLUMN "shippingPlaque" SET NOT NULL;
