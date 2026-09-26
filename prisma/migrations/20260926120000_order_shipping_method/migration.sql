-- Store the customer's delivery choice and the immutable shipping amount
-- included in the payable order total. Existing orders did not charge a
-- shipping amount, so they are represented as TIPAX with zero prepaid cost.
CREATE TYPE "ShippingMethod" AS ENUM ('POST', 'TIPAX');

ALTER TABLE "Order"
ADD COLUMN "shippingMethod" "ShippingMethod" NOT NULL DEFAULT 'TIPAX',
ADD COLUMN "shippingCostRial" BIGINT NOT NULL DEFAULT 0;

ALTER TABLE "Order"
ADD CONSTRAINT "Order_shippingCostRial_nonnegative"
CHECK ("shippingCostRial" >= 0);
