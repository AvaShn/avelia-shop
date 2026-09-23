import { z } from "zod";

import {
  checkoutCustomerSchema,
  shippingAddressSchema,
} from "@/features/orders/customer";

export const createOrderSchema = z.object({
  customer: checkoutCustomerSchema,
  shippingAddress: shippingAddressSchema,
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

export const publicOrderItemSchema = z.object({
  product: z.object({
    slug: z.string(),
    name: z.string(),
    image: z.string(),
    imageAlt: z.string(),
  }),
  quantity: z.number().int().positive(),
  unitPriceRial: z.number().int().nonnegative(),
  lineTotalRial: z.number().int().nonnegative(),
});

export const publicOrderSchema = z.object({
  publicToken: publicOrderTokenSchema,
  status: z.enum(["PENDING_PAYMENT", "WAITING_REVIEW", "PAID", "REJECTED"]),
  paymentStatus: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"]),
  totalPriceRial: z.number().int().nonnegative(),
  items: z.array(publicOrderItemSchema),
  inventoryReservationExpiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});
