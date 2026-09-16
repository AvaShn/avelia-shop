import { randomUUID } from "node:crypto";

import {
  publicOrderSchema,
  publicOrderTokenSchema,
} from "@/features/orders/schemas";
import { OrderServiceError, findPublicOrder } from "@/features/orders/service";
import {
  apiFailure,
  apiRateLimitFailure,
  apiSuccess,
  logApiError,
} from "@/lib/api/response";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, context: OrderRouteContext) {
  const requestId = randomUUID();
  const rateLimit = await consumeRateLimit(request, {
    scope: "orders:read",
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

  const parsedToken = publicOrderTokenSchema.safeParse(
    (await context.params).token,
  );
  if (!parsedToken.success) {
    return apiFailure(
      400,
      {
        code: "INVALID_REQUEST",
        message: "شناسهٔ پیگیری سفارش معتبر نیست.",
      },
      { requestId, rateLimit },
    );
  }

  try {
    const order = publicOrderSchema.parse(
      await findPublicOrder(parsedToken.data),
    );
    return apiSuccess(order, {
      requestId,
      rateLimit,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    if (error instanceof OrderServiceError) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId, rateLimit },
      );
    }

    logApiError("orders:read", requestId, error);
    return apiFailure(
      500,
      {
        code: "INTERNAL_ERROR",
        message: "نمایش سفارش ممکن نشد. چند لحظه دیگر دوباره تلاش کنید.",
      },
      { requestId, rateLimit },
    );
  }
}
