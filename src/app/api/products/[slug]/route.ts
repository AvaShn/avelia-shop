import { NextResponse } from "next/server";
import { z } from "zod";

import type {
  ApiErrorResponse,
  ProductApiResponse,
} from "@/features/products/api-types";
import { findStorefrontProductBySlug } from "@/features/products/repository";

export const runtime = "nodejs";

const productSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

type ProductApiRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: ProductApiRouteContext) {
  const parsedSlug = productSlugSchema.safeParse((await context.params).slug);

  if (!parsedSlug.success) {
    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "شناسهٔ محصول معتبر نیست.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const product = await findStorefrontProductBySlug(parsedSlug.data);

    if (!product) {
      return NextResponse.json<ApiErrorResponse>(
        {
          error: {
            code: "NOT_FOUND",
            message: "محصول موردنظر پیدا نشد.",
          },
        },
        { status: 404 },
      );
    }

    return NextResponse.json<ProductApiResponse>(
      { data: product },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error: unknown) {
    console.error("Failed to read an AVELIA product.", error);

    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "دریافت محصول در حال حاضر امکان‌پذیر نیست.",
        },
      },
      { status: 500 },
    );
  }
}
