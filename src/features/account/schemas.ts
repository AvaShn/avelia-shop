import { z } from "zod";

import { checkoutCustomerSchema } from "@/features/orders/customer";
import { cursorSchema } from "@/lib/api/cursor";

export const registerAccountSchema = checkoutCustomerSchema
  .extend({
    password: z.string().min(1, "رمز عبور را وارد کنید."),
    passwordConfirmation: z.string(),
  })
  .superRefine((value, context) => {
    if (value.password !== value.passwordConfirmation) {
      context.addIssue({
        code: "custom",
        path: ["passwordConfirmation"],
        message: "تکرار رمز عبور یکسان نیست.",
      });
    }
  });

export const loginAccountSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "ایمیل یا شماره موبایل را وارد کنید.")
    .max(254),
  password: z.string().min(1, "رمز عبور را وارد کنید."),
});

export const accountUserSchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  defaultAddress: z.object({
    city: z.string().nullable(),
    addressLine: z.string().nullable(),
    postalCode: z.string().nullable(),
    plaque: z.string().nullable(),
    unit: z.string().nullable(),
  }),
});

export const accountOrdersQuerySchema = z.object({
  cursor: cursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const accountOrderSummarySchema = z.object({
  publicToken: z.string(),
  status: z.enum(["PENDING_PAYMENT", "WAITING_REVIEW", "PAID", "REJECTED"]),
  paymentStatus: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"]),
  totalPriceRial: z.number().int().nonnegative(),
  totalPrice: z.object({ rial: z.string(), tomanWords: z.string() }),
  itemCount: z.number().int().nonnegative(),
  deliveryCity: z.string(),
  createdAt: z.string().datetime(),
});

export type AccountUser = z.infer<typeof accountUserSchema>;
export type AccountOrderSummary = z.infer<typeof accountOrderSummarySchema>;
