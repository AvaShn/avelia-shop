import type { z } from "zod";

import type { ApiEnvelope } from "@/lib/api/contracts";
import type {
  publicOrderItemSchema,
  publicOrderSchema,
} from "@/features/orders/schemas";

export type PublicOrderStatus =
  "PENDING_PAYMENT" | "WAITING_REVIEW" | "PAID" | "REJECTED";

export type PublicPaymentStatus =
  "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export type PublicOrderItem = z.infer<typeof publicOrderItemSchema>;
export type PublicOrder = z.infer<typeof publicOrderSchema>;

export type CreateOrderApiResponse = ApiEnvelope<PublicOrder>;

export type OrderApiResponse = ApiEnvelope<PublicOrder>;

export type OrderApiErrorCode =
  | "INVALID_REQUEST"
  | "EMPTY_CART"
  | "STOCK_CHANGED"
  | "ORDER_NOT_FOUND"
  | "DATABASE_UNAVAILABLE"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

export type OrderApiErrorResponse = ApiEnvelope<PublicOrder>;
