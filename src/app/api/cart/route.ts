import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { addCartItemSchema } from "@/features/cart/schemas";
import {
  CartServiceError,
  addCartItem,
  readCart,
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

function successResponse(result: Awaited<ReturnType<typeof readCart>>) {
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

  console.error("Failed to update the AVELIA cart.", error);
  return NextResponse.json<CartApiErrorResponse>(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "سبد خرید در حال حاضر در دسترس نیست. لطفاً دوباره تلاش کنید.",
      },
    },
    { status: 500 },
  );
}

export async function GET(request: NextRequest) {
  const session = readCartRequestSession(request);

  try {
    return successResponse(await readCart(session.token, session.storedItems));
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
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

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = addCartItemSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json<CartApiErrorResponse>(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "اطلاعات محصول را بررسی و دوباره تلاش کنید.",
          fieldErrors: parsedBody.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const session = readCartRequestSession(request);

  try {
    return successResponse(
      await addCartItem(
        session.token,
        session.storedItems,
        parsedBody.data.productId,
        parsedBody.data.quantity,
      ),
    );
  } catch (error: unknown) {
    return serviceErrorResponse(error);
  }
}
