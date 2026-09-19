BEGIN;

-- Prisma Studio cannot upload files. Store only ordered image paths so product
-- entry requires no JSON or duplicate alt text. Existing paths are preserved.
ALTER TABLE "Product"
DROP CONSTRAINT "Product_images_nonempty_array";

CREATE FUNCTION "__avelia_product_image_paths"(source JSONB)
RETURNS TEXT[]
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
  SELECT ARRAY(
    SELECT btrim(image ->> 'src')
    FROM jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(source) = 'array' THEN source
        ELSE '[]'::jsonb
      END
    ) WITH ORDINALITY AS existing_images(image, position)
    WHERE jsonb_typeof(image) = 'object'
      AND image ? 'src'
      AND btrim(image ->> 'src') <> ''
    ORDER BY position
  );
$$;

ALTER TABLE "Product"
ALTER COLUMN "images" TYPE TEXT[]
USING "__avelia_product_image_paths"("images");

DROP FUNCTION "__avelia_product_image_paths"(JSONB);

ALTER TABLE "Product"
ADD CONSTRAINT "Product_images_nonempty"
CHECK (
  cardinality("images") > 0
  AND array_position("images", NULL) IS NULL
  AND array_position("images", '') IS NULL
) NOT VALID;

COMMIT;
