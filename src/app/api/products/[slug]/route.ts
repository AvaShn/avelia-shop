import { randomUUID } from "node:crypto";

import { z } from "zod";

import { productDetailsApiDataSchema } from "@/features/products/api-types";
import {
  findStorefrontProductBySlug,
  listRelatedStorefrontProducts,
} from "@/features/products/repository";
import {
  apiFailure,
  apiRateLimitFailure,
  apiSuccess,
  logApiError,
} from "@/lib/api/response";
import { consumeRateLimit } from "@/lib/security/rate-limit";

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

export async function GET(request: Request, context: ProductApiRouteContext) {
  const requestId = randomUUID();
  const rateLimit = await consumeRateLimit(request, {
    scope: "products:detail",
    limit: 180,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

  const parsedSlug = productSlugSchema.safeParse((await context.params).slug);
  if (!parsedSlug.success) {
    return apiFailure(
      400,
      { code: "INVALID_REQUEST", message: "شناسهٔ محصول معتبر نیست." },
      { requestId, rateLimit },
    );
  }

  try {
    const product = await findStorefrontProductBySlug(parsedSlug.data);
    if (!product) {
      return apiFailure(
        404,
        {
          code: "NOT_FOUND",
          message: "محصول پیدا نشد؛ می‌توانید به مجموعه محصولات بازگردید.",
        },
        { requestId, rateLimit },
      );
    }

    const data = productDetailsApiDataSchema.parse({
      product,
      relatedProducts: await listRelatedStorefrontProducts(product, 4),
    });

    return apiSuccess(data, {
      requestId,
      rateLimit,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error: unknown) {
    logApiError("products:detail", requestId, error);
    return apiFailure(
      500,
      {
        code: "INTERNAL_ERROR",
        message: "دریافت محصول ممکن نشد. چند لحظه دیگر دوباره تلاش کنید.",
      },
      { requestId, rateLimit },
    );
  }
}
