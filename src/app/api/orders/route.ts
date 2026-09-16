import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  createOrderSchema,
  idempotencyKeySchema,
} from "@/features/orders/schemas";
import {
  OrderServiceError,
  createOrderFromCart,
} from "@/features/orders/service";
import type {
  CreateOrderApiResponse,
  OrderApiErrorResponse,
} from "@/features/orders/types";
import {
  clearCartSession,
  readCartRequestSession,
} from "@/features/cart/session";
import { isTrustedMutationOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function orderErrorResponse(error: unknown) {
  if (error instanceof OrderServiceError) {
    return NextResponse.json<OrderApiErrorResponse>(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error("Failed to create an AVELIA order.", error);
  return NextResponse.json<OrderApiErrorResponse>(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "ثبت سفارش انجام نشد. لطفاً چند لحظه دیگر دوباره تلاش کنید.",
      },
    },
    { status: 500 },
  );
}

export async function POST(request: NextRequest) {
  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json<OrderApiErrorResponse>(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "درخواست ثبت سفارش معتبر نیست.",
        },
      },
      { status: 403 },
    );
  }

  const idempotencyKey = idempotencyKeySchema.safeParse(
    request.headers.get("Idempotency-Key"),
  );
  const body: unknown = await request.json().catch(() => null);
  const parsedBody = createOrderSchema.safeParse(body);

  if (!idempotencyKey.success || !parsedBody.success) {
    return NextResponse.json<OrderApiErrorResponse>(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "اطلاعات تماس را بررسی و دوباره تلاش کنید.",
          ...(parsedBody.success
            ? {}
            : { fieldErrors: parsedBody.error.flatten().fieldErrors }),
        },
      },
      { status: 400 },
    );
  }

  const cartSession = readCartRequestSession(request);

  try {
    const order = await createOrderFromCart({
      cartToken: cartSession.token,
      idempotencyKey: idempotencyKey.data,
      customer: parsedBody.data.customer,
    });
    const response = NextResponse.json<CreateOrderApiResponse>(
      { data: order },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
    clearCartSession(response);
    return response;
  } catch (error: unknown) {
    return orderErrorResponse(error);
  }
}
