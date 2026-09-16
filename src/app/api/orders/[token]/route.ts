import { NextResponse } from "next/server";

import { publicOrderTokenSchema } from "@/features/orders/schemas";
import { OrderServiceError, findPublicOrder } from "@/features/orders/service";
import type {
  OrderApiErrorResponse,
  OrderApiResponse,
} from "@/features/orders/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_request: Request, context: OrderRouteContext) {
  const parsedToken = publicOrderTokenSchema.safeParse(
    (await context.params).token,
  );

  if (!parsedToken.success) {
    return NextResponse.json<OrderApiErrorResponse>(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "شناسهٔ پیگیری سفارش معتبر نیست.",
        },
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json<OrderApiResponse>(
      { data: await findPublicOrder(parsedToken.data) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error: unknown) {
    if (error instanceof OrderServiceError) {
      return NextResponse.json<OrderApiErrorResponse>(
        { error: { code: error.code, message: error.message } },
        { status: error.status },
      );
    }

    console.error("Failed to read an AVELIA order.", error);
    return NextResponse.json<OrderApiErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "نمایش سفارش در حال حاضر امکان‌پذیر نیست.",
        },
      },
      { status: 500 },
    );
  }
}
