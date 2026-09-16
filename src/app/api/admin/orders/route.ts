import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import { AdminAuthError, readAdminSession } from "@/features/admin/auth";
import { AdminOrderError, listAdminOrders } from "@/features/admin/orders";
import { adminOrdersQuerySchema } from "@/features/admin/schemas";
import {
  apiFailure,
  apiRateLimitFailure,
  apiSuccess,
  logApiError,
} from "@/lib/api/response";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = randomUUID();

  try {
    const admin = readAdminSession(request);
    const rateLimit = await consumeRateLimit(request, {
      scope: "admin:orders:list",
      identifier: admin.email,
      limit: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

    const parsedQuery = adminOrdersQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsedQuery.success) {
      return apiFailure(
        400,
        {
          code: "INVALID_REQUEST",
          message: "فیلترهای سفارش‌ها معتبر نیستند.",
          fieldErrors: parsedQuery.error.flatten().fieldErrors,
        },
        { requestId, rateLimit },
      );
    }

    const result = await listAdminOrders(parsedQuery.data);
    return apiSuccess(result.orders, {
      requestId,
      rateLimit,
      meta: {
        count: result.orders.length,
        total: result.total,
        nextCursor: result.nextCursor,
      },
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    if (error instanceof AdminAuthError || error instanceof AdminOrderError) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId },
      );
    }
    logApiError("admin:orders:list", requestId, error);
    return apiFailure(
      500,
      {
        code: "INTERNAL_ERROR",
        message: "دریافت سفارش‌ها انجام نشد. دوباره تلاش کنید.",
      },
      { requestId },
    );
  }
}
