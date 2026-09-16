import { randomUUID } from "node:crypto";

import { releaseExpiredInventoryReservations } from "@/features/orders/inventory";
import { apiFailure, apiSuccess, logApiError } from "@/lib/api/response";
import { serverEnvironment } from "@/lib/env/server";
import { constantTimeEqual } from "@/lib/security/constant-time";
import { purgeExpiredRateLimits } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = randomUUID();
  const secret = serverEnvironment.INVENTORY_CRON_SECRET;
  if (!secret) {
    return apiFailure(
      503,
      {
        code: "CONFIGURATION_ERROR",
        message: "پاک‌سازی رزروهای موجودی هنوز پیکربندی نشده است.",
      },
      { requestId },
    );
  }

  const authorization = request.headers.get("authorization");
  const receivedSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  if (!receivedSecret || !constantTimeEqual(receivedSecret, secret)) {
    return apiFailure(
      401,
      { code: "UNAUTHORIZED", message: "دسترسی به این عملیات مجاز نیست." },
      { requestId },
    );
  }

  try {
    const [releasedOrders, purgedRateLimitBuckets] = await Promise.all([
      releaseExpiredInventoryReservations(),
      purgeExpiredRateLimits(),
    ]);
    return apiSuccess(
      { releasedOrders, purgedRateLimitBuckets },
      {
        requestId,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error: unknown) {
    logApiError("inventory:release-expired", requestId, error);
    return apiFailure(
      500,
      {
        code: "INTERNAL_ERROR",
        message: "پاک‌سازی رزروهای منقضی انجام نشد.",
      },
      { requestId },
    );
  }
}
