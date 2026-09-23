-- A customer explicitly deleted from the database must not be blocked by
-- historical orders. OrderItem, Payment, and UserSession already cascade.
ALTER TABLE "Order"
DROP CONSTRAINT "Order_userId_fkey";

ALTER TABLE "Order"
ADD CONSTRAINT "Order_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Deleting an unpaid order must release inventory before its line items are
-- removed by the cascade. Paid inventory is intentionally not restored.
CREATE FUNCTION restore_inventory_before_order_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."inventoryCommittedAt" IS NULL
     AND OLD."inventoryReleasedAt" IS NULL THEN
    UPDATE "Product" AS product
    SET "stock" = product."stock" + reserved."quantity"
    FROM "OrderItem" AS reserved
    WHERE reserved."orderId" = OLD."id"
      AND product."id" = reserved."productId";
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Order_restore_inventory_before_delete"
BEFORE DELETE ON "Order"
FOR EACH ROW
EXECUTE FUNCTION restore_inventory_before_order_delete();

-- Checked-out carts have no value once their order is deliberately removed.
CREATE FUNCTION delete_order_cart_after_order_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD."cartId" IS NOT NULL THEN
    DELETE FROM "Cart" WHERE "id" = OLD."cartId";
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Order_delete_cart_after_delete"
AFTER DELETE ON "Order"
FOR EACH ROW
EXECUTE FUNCTION delete_order_cart_after_order_delete();
