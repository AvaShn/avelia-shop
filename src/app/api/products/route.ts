import { randomUUID } from "node:crypto";

import {
  productsApiDataSchema,
  productsApiQuerySchema,
  type ProductsApiMeta,
} from "@/features/products/api-types";
import { listStorefrontProductPage } from "@/features/products/repository";
import {
  apiFailure,
  apiRateLimitFailure,
  apiSuccess,
  logApiError,
} from "@/lib/api/response";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = randomUUID();
  const rateLimit = await consumeRateLimit(request, {
    scope: "products:list",
    limit: 120,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

  const parameters = Object.fromEntries(new URL(request.url).searchParams);
  const parsedQuery = productsApiQuerySchema.safeParse(parameters);

  if (!parsedQuery.success) {
    return apiFailure(
      400,
      {
        code: "INVALID_REQUEST",
        message: "فیلترهای محصولات معتبر نیستند. آن‌ها را بررسی کنید.",
        fieldErrors: parsedQuery.error.flatten().fieldErrors,
      },
      { requestId, rateLimit },
    );
  }

  try {
    const page = await listStorefrontProductPage(parsedQuery.data);
    if (page.kind === "invalid-cursor") {
      return apiFailure(
        400,
        {
          code: "INVALID_CURSOR",
          message: "صفحهٔ درخواستی معتبر نیست؛ فهرست را از ابتدا باز کنید.",
        },
        { requestId, rateLimit },
      );
    }

    const data = productsApiDataSchema.parse(page.products);
    const normalizedQuery = {
      category: parsedQuery.data.category,
      sort: parsedQuery.data.sort,
      q: parsedQuery.data.q,
      discount: parsedQuery.data.discount,
      featured: parsedQuery.data.featured,
      availability: parsedQuery.data.availability,
      limit: parsedQuery.data.limit,
    };

    return apiSuccess<typeof data, ProductsApiMeta>(data, {
      requestId,
      rateLimit,
      meta: {
        count: data.length,
        total: page.total,
        nextCursor: page.nextCursor,
        query: normalizedQuery,
      },
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error: unknown) {
    logApiError("products:list", requestId, error);
    return apiFailure(
      500,
      {
        code: "INTERNAL_ERROR",
        message: "دریافت محصولات ممکن نشد. چند لحظه دیگر دوباره تلاش کنید.",
      },
      { requestId, rateLimit },
    );
  }
}
