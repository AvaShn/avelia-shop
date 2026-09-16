import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import {
  clearCartSession,
  readCartRequestSession,
} from "@/features/cart/session";
import {
  createOrderSchema,
  idempotencyKeySchema,
  publicOrderSchema,
} from "@/features/orders/schemas";
import {
  OrderServiceError,
  createOrderFromCart,
} from "@/features/orders/service";
import { ApiRequestError, readJsonBody } from "@/lib/api/request";
import {
  apiFailure,
  apiRateLimitFailure,
  apiSuccess,
  logApiError,
} from "@/lib/api/response";
import { isTrustedMutationOrigin } from "@/lib/security/origin";
import {
  consumeRateLimit,
  type RateLimitResult,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function orderErrorResponse(
  error: unknown,
  requestId: string,
  rateLimit: RateLimitResult,
) {
  if (error instanceof OrderServiceError || error instanceof ApiRequestError) {
    return apiFailure(
      error.status,
      { code: error.code, message: error.message },
      { requestId, rateLimit },
    );
  }

  logApiError("orders:create", requestId, error);
  return apiFailure(
    500,
    {
      code: "INTERNAL_ERROR",
      message: "ثبت سفارش انجام نشد. چند لحظه دیگر دوباره تلاش کنید.",
    },
    { requestId, rateLimit },
  );
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const rateLimit = await consumeRateLimit(request, {
    scope: "orders:create",
    limit: 10,
    windowMs: 10 * 60_000,
  });
  if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

  if (!isTrustedMutationOrigin(request)) {
    return apiFailure(
      403,
      {
        code: "FORBIDDEN_ORIGIN",
        message: "این درخواست از مبدأ معتبری ارسال نشده است.",
      },
      { requestId, rateLimit },
    );
  }

  try {
    const idempotencyKey = idempotencyKeySchema.safeParse(
      request.headers.get("Idempotency-Key"),
    );
    const parsedBody = createOrderSchema.safeParse(await readJsonBody(request));

    if (!idempotencyKey.success || !parsedBody.success) {
      return apiFailure(
        400,
        {
          code: "INVALID_REQUEST",
          message: "اطلاعات تماس را بررسی و دوباره تلاش کنید.",
          ...(parsedBody.success
            ? {}
            : { fieldErrors: parsedBody.error.flatten().fieldErrors }),
        },
        { requestId, rateLimit },
      );
    }

    const cartSession = readCartRequestSession(request);
    const order = publicOrderSchema.parse(
      await createOrderFromCart({
        cartToken: cartSession.token,
        idempotencyKey: idempotencyKey.data,
        customer: parsedBody.data.customer,
      }),
    );
    const response = apiSuccess(order, {
      requestId,
      rateLimit,
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
    clearCartSession(response);
    return response;
  } catch (error: unknown) {
    return orderErrorResponse(error, requestId, rateLimit);
  }
}
