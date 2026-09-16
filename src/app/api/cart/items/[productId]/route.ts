import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { productIdSchema, updateCartItemSchema } from "@/features/cart/schemas";
import {
  CartServiceError,
  removeCartItem,
  updateCartItemQuantity,
} from "@/features/cart/service";
import {
  commitCartSession,
  readCartRequestSession,
} from "@/features/cart/session";
import type {
  CartApiErrorResponse,
  CartApiResponse,
} from "@/features/cart/types";
import { isTrustedMutationOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CartItemRouteContext = {
  params: Promise<{ productId: string }>;
};

function successResponse(
  result: Awaited<ReturnType<typeof updateCartItemQuantity>>,
) {
  const response = NextResponse.json<CartApiResponse>(
    { data: result.cart },
    { headers: { "Cache-Control": "private, no-store" } },
  );
  commitCartSession(response, result.token, result.storedItems);
  return response;
}

function serviceErrorResponse(error: unknown) {
  if (error instanceof CartServiceError) {
    return NextResponse.json<CartApiErrorResponse>(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error("Failed to mutate an AVELIA cart item.", error);
  return NextResponse.json<CartApiErrorResponse>(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "تغییر سبد خرید انجام نشد. لطفاً دوباره تلاش کنید.",
      },
    },
    { status: 500 },
  );
}

async function parseProductId(context: CartItemRouteContext) {
  return productIdSchema.safeParse((await context.params).productId);
}

export async function PATCH(
  request: NextRequest,
  context: CartItemRouteContext,
) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json<CartApiErrorResponse>(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "درخواست سبد خرید معتبر نیست.",
        },
      },
      { status: 403 },
    );
  }

  const [parsedProductId, body] = await Promise.all([
    parseProductId(context),
    request.json().catch(() => null) as Promise<unknown>,
  ]);
  const parsedBody = updateCartItemSchema.safeParse(body);

  if (!parsedProductId.success || !parsedBody.success) {
    return NextResponse.json<CartApiErrorResponse>(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "تعداد محصول را بررسی و دوباره تلاش کنید.",
        },
      },
      { status: 400 },
    );
  }

  const session = readCartRequestSession(request);

  try {
    return successResponse(
      await updateCartItemQuantity(
        session.token,
        session.storedItems,
        parsedProductId.data,
        parsedBody.data.quantity,
      ),
    );
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: CartItemRouteContext,
) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json<CartApiErrorResponse>(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "درخواست سبد خرید معتبر نیست.",
        },
      },
      { status: 403 },
    );
  }

  const parsedProductId = await parseProductId(context);
  if (!parsedProductId.success) {
    return NextResponse.json<CartApiErrorResponse>(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "شناسهٔ محصول معتبر نیست.",
        },
      },
      { status: 400 },
    );
  }

  const session = readCartRequestSession(request);

  try {
    return successResponse(
      await removeCartItem(
        session.token,
        session.storedItems,
        parsedProductId.data,
      ),
    );
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
