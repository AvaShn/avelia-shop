import { z } from "zod";

import { cursorSchema } from "@/lib/api/cursor";

export const adminLoginSchema = z.object({
  email: z.email("ایمیل مدیریت معتبر نیست."),
  password: z
    .string()
    .min(12, "رمز عبور مدیریت باید دست‌کم ۱۲ نویسه داشته باشد.")
    .max(200),
});

export const adminOrdersQuerySchema = z.object({
  status: z
    .enum(["PENDING_PAYMENT", "WAITING_REVIEW", "PAID", "REJECTED"])
    .optional(),
  paymentStatus: z
    .enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"])
    .optional(),
  q: z.string().trim().max(100).default(""),
  cursor: cursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const adminPaymentReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(500).optional(),
});

const formattedPriceSchema = z.object({
  rial: z.string(),
  tomanWords: z.string(),
});

const adminOrderCustomerSchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  telegramConnected: z.boolean(),
});

export const adminOrderSummarySchema = z.object({
  publicToken: z.string(),
  status: z.enum(["PENDING_PAYMENT", "WAITING_REVIEW", "PAID", "REJECTED"]),
  paymentStatus: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"]),
  customer: adminOrderCustomerSchema,
  totalPriceRial: z.number().int().nonnegative(),
  totalPrice: formattedPriceSchema,
  itemCount: z.number().int().nonnegative(),
  receiptAvailable: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const adminOrderDetailSchema = adminOrderSummarySchema.extend({
  items: z.array(
    z.object({
      product: z.object({ slug: z.string(), name: z.string() }),
      quantity: z.number().int().positive(),
      unitPriceRial: z.number().int().nonnegative(),
      unitPrice: formattedPriceSchema,
      lineTotalRial: z.number().int().nonnegative(),
      lineTotal: formattedPriceSchema,
    }),
  ),
  inventoryReservationExpiresAt: z.string().datetime(),
  inventoryCommittedAt: z.string().datetime().nullable(),
  inventoryReleasedAt: z.string().datetime().nullable(),
  rejectionReason: z.string().nullable(),
  delivery: z.object({
    city: z.string(),
    addressLine: z.string(),
    postalCode: z.string(),
    plaque: z.string(),
    unit: z.string().nullable(),
  }),
  receiptPath: z.string().nullable(),
  review: z.object({
    reviewedAt: z.string().datetime().nullable(),
    reviewedBy: z.string().nullable(),
    note: z.string().nullable(),
  }),
});

export type AdminOrderSummary = z.infer<typeof adminOrderSummarySchema>;
export type AdminOrderDetail = z.infer<typeof adminOrderDetailSchema>;
