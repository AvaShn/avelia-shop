import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import { addCartItemSchema, cartViewSchema } from "@/features/cart/schemas";
import {
  CartServiceError,
  addCartItem,
  readCart,
} from "@/features/cart/service";
import {
  commitCartSession,
  readCartRequestSession,
} from "@/features/cart/session";
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

function successResponse(
  result: Awaited<ReturnType<typeof readCart>>,
  requestId: string,
  rateLimit: RateLimitResult,
) {
  const response = apiSuccess(cartViewSchema.parse(result.cart), {
    requestId,
    rateLimit,
    headers: { "Cache-Control": "private, no-store" },
  });
  commitCartSession(response, result.token, result.storedItems);
  return response;
}

function serviceErrorResponse(
  error: unknown,
  requestId: string,
  rateLimit: RateLimitResult,
) {
  if (error instanceof CartServiceError) {
    return apiFailure(
      error.status,
      { code: error.code, message: error.message },
      { requestId, rateLimit },
    );
  }

  if (error instanceof ApiRequestError) {
    return apiFailure(
      error.status,
      { code: error.code, message: error.message },
      { requestId, rateLimit },
    );
  }

  logApiError("cart", requestId, error);
  return apiFailure(
    500,
    {
      code: "INTERNAL_ERROR",
      message: "سبد خرید در دسترس نیست. چند لحظه دیگر دوباره تلاش کنید.",
    },
    { requestId, rateLimit },
  );
}

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  const rateLimit = await consumeRateLimit(request, {
    scope: "cart:read",
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

  const session = readCartRequestSession(request);
  try {
    return successResponse(
      await readCart(session.token, session.storedItems),
      requestId,
      rateLimit,
    );
  } catch (error: unknown) {
    return serviceErrorResponse(error, requestId, rateLimit);
  }
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const rateLimit = await consumeRateLimit(request, {
    scope: "cart:mutate",
    limit: 60,
    windowMs: 60_000,
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
    const parsedBody = addCartItemSchema.safeParse(await readJsonBody(request));
    if (!parsedBody.success) {
      return apiFailure(
        400,
        {
          code: "INVALID_REQUEST",
          message: "اطلاعات محصول را بررسی و دوباره تلاش کنید.",
          fieldErrors: parsedBody.error.flatten().fieldErrors,
        },
        { requestId, rateLimit },
      );
    }

    const session = readCartRequestSession(request);
    return successResponse(
      await addCartItem(
        session.token,
        session.storedItems,
        parsedBody.data.productId,
        parsedBody.data.quantity,
      ),
      requestId,
      rateLimit,
    );
  } catch (error: unknown) {
    return serviceErrorResponse(error, requestId, rateLimit);
  }
}
