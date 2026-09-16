import { z } from "zod";

import { checkoutCustomerSchema } from "@/features/orders/customer";

export const createOrderSchema = z.object({
  customer: checkoutCustomerSchema,
});

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(16)
  .max(160)
  .regex(/^[A-Za-z0-9_-]+$/);

export const publicOrderTokenSchema = z
  .string()
  .trim()
  .min(32)
  .max(160)
  .regex(/^[A-Za-z0-9_-]+$/);
