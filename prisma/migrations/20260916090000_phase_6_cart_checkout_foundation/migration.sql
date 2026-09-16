-- Phase 6 database foundation: persistent carts, safe public lookups,
-- idempotent checkout, payment sessions, and inventory reservations.

-- Normalize the documented order statuses without editing the initial migration.
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
CREATE TYPE "OrderStatus_new" AS ENUM (
  'PENDING_PAYMENT',
  'WAITING_REVIEW',
  'PAID',
  'REJECTED'
);
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order"
ALTER COLUMN "status" TYPE "OrderStatus_new"
USING (
  CASE "status"::text
    WHEN 'RECEIPT_SUBMITTED' THEN 'WAITING_REVIEW'
    WHEN 'CANCELED' THEN 'REJECTED'
    ELSE "status"::text
  END
)::"OrderStatus_new";
DROP TYPE "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
ALTER TABLE "Order"
ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';

-- Normalize the documented payment statuses.
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
CREATE TYPE "PaymentStatus_new" AS ENUM (
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED'
);
ALTER TABLE "Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payment"
ALTER COLUMN "status" TYPE "PaymentStatus_new"
USING (
  CASE "status"::text
    WHEN 'WAITING_RECEIPT' THEN 'PENDING'
    ELSE "status"::text
  END
)::"PaymentStatus_new";
DROP TYPE "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
ALTER TABLE "Payment"
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Use explicit domain names for normalized identity and money snapshots.
ALTER TABLE "User" RENAME COLUMN "phone" TO "phoneNormalized";
ALTER INDEX "User_phone_key" RENAME TO "User_phoneNormalized_key";
DROP INDEX "User_email_key";
CREATE INDEX "User_email_idx" ON "User"("email");

ALTER TABLE "Order" RENAME COLUMN "totalPrice" TO "totalPriceRial";
ALTER TABLE "OrderItem" RENAME COLUMN "price" TO "unitPriceRial";
ALTER TABLE "Payment" RENAME COLUMN "receiptImage" TO "receiptObjectKey";

ALTER TABLE "OrderItem"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "OrderItem" ALTER COLUMN "updatedAt" DROP DEFAULT;
CREATE INDEX "OrderItem_orderId_createdAt_idx"
ON "OrderItem"("orderId", "createdAt");

ALTER TABLE "Order" DROP CONSTRAINT "Order_totalPrice_nonnegative";
ALTER TABLE "Order"
ADD CONSTRAINT "Order_totalPriceRial_nonnegative"
CHECK ("totalPriceRial" >= 0);

ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_price_nonnegative";
ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_unitPriceRial_nonnegative"
CHECK ("unitPriceRial" >= 0);

-- Storefront publishing can be controlled independently of stock.
ALTER TABLE "Product"
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "Product_categoryId_isPublished_idx"
ON "Product"("categoryId", "isPublished");
CREATE INDEX "Product_isPublished_sortOrder_idx"
ON "Product"("isPublished", "sortOrder");

-- Persistent anonymous carts use a hash of the browser token.
CREATE TABLE "Cart" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "checkedOutAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CartItem_quantity_positive" CHECK ("quantity" > 0)
);

CREATE UNIQUE INDEX "Cart_tokenHash_key" ON "Cart"("tokenHash");
CREATE INDEX "Cart_expiresAt_idx" ON "Cart"("expiresAt");
CREATE INDEX "Cart_checkedOutAt_updatedAt_idx"
ON "Cart"("checkedOutAt", "updatedAt");
CREATE UNIQUE INDEX "CartItem_cartId_productId_key"
ON "CartItem"("cartId", "productId");
CREATE INDEX "CartItem_productId_idx" ON "CartItem"("productId");

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_cartId_fkey"
FOREIGN KEY ("cartId") REFERENCES "Cart"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing rows receive deterministic legacy values before columns become required.
ALTER TABLE "Order"
ADD COLUMN "publicToken" TEXT,
ADD COLUMN "checkoutIdempotencyKeyHash" TEXT,
ADD COLUMN "cartId" TEXT,
ADD COLUMN "inventoryReservationExpiresAt" TIMESTAMP(3),
ADD COLUMN "inventoryCommittedAt" TIMESTAMP(3),
ADD COLUMN "inventoryReleasedAt" TIMESTAMP(3),
ADD COLUMN "rejectionReason" TEXT;

UPDATE "Order"
SET
  "publicToken" = 'legacy_' || "id",
  "checkoutIdempotencyKeyHash" = 'legacy_' || "id",
  "inventoryReservationExpiresAt" = "createdAt" + INTERVAL '24 hours';

ALTER TABLE "Order"
ALTER COLUMN "publicToken" SET NOT NULL,
ALTER COLUMN "checkoutIdempotencyKeyHash" SET NOT NULL,
ALTER COLUMN "inventoryReservationExpiresAt" SET NOT NULL;

CREATE UNIQUE INDEX "Order_publicToken_key" ON "Order"("publicToken");
CREATE UNIQUE INDEX "Order_checkoutIdempotencyKeyHash_key"
ON "Order"("checkoutIdempotencyKeyHash");
CREATE UNIQUE INDEX "Order_cartId_key" ON "Order"("cartId");
CREATE INDEX "Order_inventoryReservationExpiresAt_inventoryReleasedAt_idx"
ON "Order"("inventoryReservationExpiresAt", "inventoryReleasedAt");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_cartId_fkey"
FOREIGN KEY ("cartId") REFERENCES "Cart"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Store only private receipt object keys and hashed Telegram session tokens.
ALTER TABLE "Payment"
ADD COLUMN "paymentSessionTokenHash" TEXT,
ADD COLUMN "sessionExpiresAt" TIMESTAMP(3),
ADD COLUMN "telegramFileId" TEXT,
ADD COLUMN "providerUpdateId" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedBy" TEXT,
ADD COLUMN "reviewNote" TEXT;

UPDATE "Payment"
SET
  "paymentSessionTokenHash" = 'legacy_' || "id",
  "sessionExpiresAt" = "createdAt" + INTERVAL '24 hours';

ALTER TABLE "Payment"
ALTER COLUMN "paymentSessionTokenHash" SET NOT NULL,
ALTER COLUMN "sessionExpiresAt" SET NOT NULL;

CREATE UNIQUE INDEX "Payment_paymentSessionTokenHash_key"
ON "Payment"("paymentSessionTokenHash");
CREATE UNIQUE INDEX "Payment_providerUpdateId_key"
ON "Payment"("providerUpdateId");
CREATE INDEX "Payment_sessionExpiresAt_idx" ON "Payment"("sessionExpiresAt");
CREATE INDEX "Payment_reviewedAt_idx" ON "Payment"("reviewedAt");
