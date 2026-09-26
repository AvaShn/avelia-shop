import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { AdminAuthError, readAdminSession } from "@/features/admin/auth";
import {
  AdminProductError,
  createAdminProduct,
  getAdminProductWorkspace,
} from "@/features/admin/products";
import { adminCreateProductSchema } from "@/features/admin/schemas";
import { ApiRequestError, readJsonBody } from "@/lib/api/request";
import {
  apiFailure,
  apiRateLimitFailure,
  apiSuccess,
  logApiError,
} from "@/lib/api/response";
import { isTrustedMutationOrigin } from "@/lib/security/origin";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  try {
    const admin = readAdminSession(request);
    const rateLimit = await consumeRateLimit(request, {
      scope: "admin:products:list",
      identifier: admin.email,
      limit: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

    return apiSuccess(await getAdminProductWorkspace(), {
      requestId,
      rateLimit,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    if (error instanceof AdminAuthError || error instanceof AdminProductError) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId },
      );
    }
    logApiError("admin:products:list", requestId, error);
    return apiFailure(
      500,
      {
        code: "INTERNAL_ERROR",
        message:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? `دریافت محصولات انجام نشد: ${error.message}`
            : "دریافت محصولات انجام نشد.",
      },
      { requestId },
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  try {
    const admin = readAdminSession(request);
    const rateLimit = await consumeRateLimit(request, {
      scope: "admin:products:create",
      identifier: admin.email,
      limit: 20,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

    if (!isTrustedMutationOrigin(request)) {
      return apiFailure(
        403,
        { code: "FORBIDDEN_ORIGIN", message: "مبدأ درخواست معتبر نیست." },
        { requestId, rateLimit },
      );
    }

    const parsedBody = adminCreateProductSchema.safeParse(
      await readJsonBody(request),
    );
    if (!parsedBody.success) {
      return apiFailure(
        400,
        {
          code: "INVALID_REQUEST",
          message: "اطلاعات محصول کامل یا معتبر نیست؛ فیلدها را بررسی کنید.",
          fieldErrors: parsedBody.error.flatten().fieldErrors,
        },
        { requestId, rateLimit },
      );
    }

    const product = await createAdminProduct(parsedBody.data);
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/sitemap.xml");

    return apiSuccess(product, {
      status: 201,
      requestId,
      rateLimit,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    if (
      error instanceof AdminAuthError ||
      error instanceof AdminProductError ||
      error instanceof ApiRequestError
    ) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId },
      );
    }
    logApiError("admin:products:create", requestId, error);
    return apiFailure(
      500,
      {
        code: "INTERNAL_ERROR",
        message: "ثبت محصول انجام نشد. دوباره تلاش کنید.",
      },
      { requestId },
    );
  }
}
