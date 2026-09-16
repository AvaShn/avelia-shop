import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import { AdminAuthError, readAdminSession } from "@/features/admin/auth";
import { AdminOrderError, getAdminOrder } from "@/features/admin/orders";
import { publicOrderTokenSchema } from "@/features/orders/schemas";
import {
  apiFailure,
  apiRateLimitFailure,
  apiSuccess,
  logApiError,
} from "@/lib/api/response";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminOrderRouteContext = { params: Promise<{ token: string }> };

export async function GET(
  request: NextRequest,
  context: AdminOrderRouteContext,
) {
  const requestId = randomUUID();
  try {
    const admin = readAdminSession(request);
    const rateLimit = await consumeRateLimit(request, {
      scope: "admin:orders:detail",
      identifier: admin.email,
      limit: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

    const token = publicOrderTokenSchema.safeParse(
      (await context.params).token,
    );
    if (!token.success) {
      return apiFailure(
        400,
        { code: "INVALID_REQUEST", message: "شناسهٔ سفارش معتبر نیست." },
        { requestId, rateLimit },
      );
    }

    return apiSuccess(await getAdminOrder(token.data), {
      requestId,
      rateLimit,
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
    logApiError("admin:orders:detail", requestId, error);
    return apiFailure(
      500,
      { code: "INTERNAL_ERROR", message: "دریافت سفارش انجام نشد." },
      { requestId },
    );
  }
}
