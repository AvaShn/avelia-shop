import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import { AccountAuthError, readCustomerSession } from "@/features/account/auth";
import {
  AccountOrdersError,
  listCustomerOrders,
} from "@/features/account/orders";
import { accountOrdersQuerySchema } from "@/features/account/schemas";
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
    const session = await readCustomerSession(request);
    const rateLimit = await consumeRateLimit(request, {
      scope: "account:orders:list",
      identifier: session.userId,
      limit: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

    const parsed = accountOrdersQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) {
      return apiFailure(
        400,
        { code: "INVALID_REQUEST", message: "صفحه سفارش‌ها معتبر نیست." },
        { requestId, rateLimit },
      );
    }
    const result = await listCustomerOrders(session.userId, parsed.data);
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
    if (
      error instanceof AccountAuthError ||
      error instanceof AccountOrdersError
    ) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId },
      );
    }
    logApiError("account:orders:list", requestId, error);
    return apiFailure(
      500,
      { code: "INTERNAL_ERROR", message: "دریافت سفارش‌های شما انجام نشد." },
      { requestId },
    );
  }
}
