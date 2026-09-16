import { NextResponse } from "next/server";

import type {
  ApiErrorResponse,
  ProductsApiResponse,
} from "@/features/products/api-types";
import { normalizeCatalogQuery } from "@/features/products/queries";
import { listStorefrontProducts } from "@/features/products/repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const parameters = new URL(request.url).searchParams;
    const query = normalizeCatalogQuery({
      category: parameters.get("category") ?? undefined,
      sort: parameters.get("sort") ?? undefined,
      q: parameters.get("q") ?? undefined,
      discount: parameters.get("discount") ?? undefined,
    });
    const products = await listStorefrontProducts(query);

    return NextResponse.json<ProductsApiResponse>(
      {
        data: products,
        meta: {
          count: products.length,
          query,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error: unknown) {
    console.error("Failed to list AVELIA products.", error);

    return NextResponse.json<ApiErrorResponse>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "دریافت محصولات در حال حاضر امکان‌پذیر نیست.",
        },
      },
      { status: 500 },
    );
  }
}
