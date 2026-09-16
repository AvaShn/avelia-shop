import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import {
  cartViewSchema,
  productIdSchema,
  updateCartItemSchema,
} from "@/features/cart/schemas";
import {
  CartServiceError,
  removeCartItem,
  updateCartItemQuantity,
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

type CartItemRouteContext = {
  params: Promise<{ productId: string }>;
};

function successResponse(
  result: Awaited<ReturnType<typeof updateCartItemQuantity>>,
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

function errorResponse(
  error: unknown,
  requestId: string,
  rateLimit: RateLimitResult,
) {
  if (error instanceof CartServiceError || error instanceof ApiRequestError) {
    return apiFailure(
      error.status,
      { code: error.code, message: error.message },
      { requestId, rateLimit },
    );
  }

  logApiError("cart:item", requestId, error);
  return apiFailure(
    500,
    {
      code: "INTERNAL_ERROR",
      message: "تغییر سبد خرید انجام نشد. چند لحظه دیگر دوباره تلاش کنید.",
    },
    { requestId, rateLimit },
  );
}

async function mutationContext(request: NextRequest) {
  const requestId = randomUUID();
  const rateLimit = await consumeRateLimit(request, {
    scope: "cart:mutate",
    limit: 60,
    windowMs: 60_000,
  });
  return { requestId, rateLimit };
}

export async function PATCH(
  request: NextRequest,
  context: CartItemRouteContext,
) {
  const apiContext = await mutationContext(request);
  if (!apiContext.rateLimit.allowed) {
    return apiRateLimitFailure(apiContext.rateLimit, apiContext.requestId);
  }
  if (!isTrustedMutationOrigin(request)) {
    return apiFailure(
      403,
      {
        code: "FORBIDDEN_ORIGIN",
        message: "این درخواست از مبدأ معتبری ارسال نشده است.",
      },
      apiContext,
    );
  }

  try {
    const [parsedProductId, body] = await Promise.all([
      productIdSchema.safeParseAsync((await context.params).productId),
      readJsonBody(request),
    ]);
    const parsedBody = updateCartItemSchema.safeParse(body);

    if (!parsedProductId.success || !parsedBody.success) {
      return apiFailure(
        400,
        {
          code: "INVALID_REQUEST",
          message: "شناسه و تعداد محصول را بررسی و دوباره تلاش کنید.",
        },
        apiContext,
      );
    }

    const session = readCartRequestSession(request);
    return successResponse(
      await updateCartItemQuantity(
        session.token,
        session.storedItems,
        parsedProductId.data,
        parsedBody.data.quantity,
      ),
      apiContext.requestId,
      apiContext.rateLimit,
    );
  } catch (error: unknown) {
    return errorResponse(error, apiContext.requestId, apiContext.rateLimit);
  }
}

export async function DELETE(
  request: NextRequest,
  context: CartItemRouteContext,
) {
  const apiContext = await mutationContext(request);
  if (!apiContext.rateLimit.allowed) {
    return apiRateLimitFailure(apiContext.rateLimit, apiContext.requestId);
  }
  if (!isTrustedMutationOrigin(request)) {
    return apiFailure(
      403,
      {
        code: "FORBIDDEN_ORIGIN",
        message: "این درخواست از مبدأ معتبری ارسال نشده است.",
      },
      apiContext,
    );
  }

  try {
    const parsedProductId = productIdSchema.safeParse(
      (await context.params).productId,
    );
    if (!parsedProductId.success) {
      return apiFailure(
        400,
        { code: "INVALID_REQUEST", message: "شناسهٔ محصول معتبر نیست." },
        apiContext,
      );
    }

    const session = readCartRequestSession(request);
    return successResponse(
      await removeCartItem(
        session.token,
        session.storedItems,
        parsedProductId.data,
      ),
      apiContext.requestId,
      apiContext.rateLimit,
    );
  } catch (error: unknown) {
    return errorResponse(error, apiContext.requestId, apiContext.rateLimit);
  }
}
