-- Make direct local data entry safe when using Prisma Studio's database grid.
-- Existing invalid drafts are preserved, while every new or updated row must
-- satisfy these checks. NOT VALID avoids deleting or rewriting user data.

ALTER TABLE "Product"
ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Product"
ADD CONSTRAINT "Product_name_nonempty"
CHECK (btrim("name") <> '') NOT VALID,
ADD CONSTRAINT "Product_slug_format"
CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$') NOT VALID,
ADD CONSTRAINT "Product_shortDescription_nonempty"
CHECK (btrim("shortDescription") <> '') NOT VALID,
ADD CONSTRAINT "Product_description_nonempty"
CHECK (btrim("description") <> '') NOT VALID,
ADD CONSTRAINT "Product_brand_nonempty"
CHECK (btrim("brand") <> '') NOT VALID,
ADD CONSTRAINT "Product_usage_nonempty"
CHECK (btrim("usage") <> '') NOT VALID,
ADD CONSTRAINT "Product_priceRial_toman_compatible"
CHECK (MOD("priceRial", 10) = 0) NOT VALID,
ADD CONSTRAINT "Product_compareAtPriceRial_toman_compatible"
CHECK (
  "compareAtPriceRial" IS NULL
  OR MOD("compareAtPriceRial", 10) = 0
) NOT VALID,
ADD CONSTRAINT "Product_images_nonempty_array"
CHECK (
  jsonb_typeof("images") = 'array'
  AND jsonb_array_length("images") > 0
) NOT VALID,
ADD CONSTRAINT "Product_keyFeatures_nonempty"
CHECK (COALESCE(array_length("keyFeatures", 1), 0) > 0) NOT VALID,
ADD CONSTRAINT "Product_sortOrder_nonnegative"
CHECK ("sortOrder" >= 0) NOT VALID;
