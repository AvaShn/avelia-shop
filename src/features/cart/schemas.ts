import { z } from "zod";

export const maximumCartItemQuantity = 10;
export const maximumDistinctCartItems = 20;

export const productIdSchema = z.string().trim().min(1).max(120);

export const addCartItemSchema = z.object({
  productId: productIdSchema,
  quantity: z.coerce
    .number()
    .int()
    .min(1)
    .max(maximumCartItemQuantity)
    .default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(maximumCartItemQuantity),
});

export const storedCartItemsSchema = z
  .array(
    z.object({
      productId: productIdSchema,
      quantity: z.number().int().min(1).max(maximumCartItemQuantity),
    }),
  )
  .max(maximumDistinctCartItems);
