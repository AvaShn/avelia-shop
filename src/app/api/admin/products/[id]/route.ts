import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

import { AdminAuthError, readAdminSession } from "@/features/admin/auth";
import {
  AdminProductError,
  deleteAdminProduct,
  getAdminProduct,
  updateAdminProduct,
} from "@/features/admin/products";
import {
  adminCreateProductSchema,
  adminProductIdSchema,
} from "@/features/admin/schemas";
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

type AdminProductRouteContext = { params: Promise<{ id: string }> };

function parseProductId(value: string) {
  return adminProductIdSchema.safeParse(value);
}

export async function GET(
  request: NextRequest,
  context: AdminProductRouteContext,
) {
  const requestId = randomUUID();
  try {
    const admin = readAdminSession(request);
    const rateLimit = await consumeRateLimit(request, {
      scope: "admin:products:detail",
      identifier: admin.email,
      limit: 120,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

    const productId = parseProductId((await context.params).id);
    if (!productId.success) {
      return apiFailure(
        400,
        { code: "INVALID_REQUEST", message: "شناسهٔ محصول معتبر نیست." },
        { requestId, rateLimit },
      );
    }

    return apiSuccess(await getAdminProduct(productId.data), {
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
    logApiError("admin:products:detail", requestId, error);
    return apiFailure(
      500,
      { code: "INTERNAL_ERROR", message: "دریافت محصول انجام نشد." },
      { requestId },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: AdminProductRouteContext,
) {
  const requestId = randomUUID();
  try {
    const admin = readAdminSession(request);
    const rateLimit = await consumeRateLimit(request, {
      scope: "admin:products:update",
      identifier: admin.email,
      limit: 30,
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

    const [productId, body] = await Promise.all([
      parseProductId((await context.params).id),
      readJsonBody(request),
    ]);
    const productInput = adminCreateProductSchema.safeParse(body);
    if (!productId.success || !productInput.success) {
      return apiFailure(
        400,
        {
          code: "INVALID_REQUEST",
          message: "اطلاعات محصول کامل یا معتبر نیست؛ فیلدها را بررسی کنید.",
          ...(productInput.success
            ? {}
            : { fieldErrors: productInput.error.flatten().fieldErrors }),
        },
        { requestId, rateLimit },
      );
    }

    const result = await updateAdminProduct(productId.data, productInput.data);
    revalidatePath("/");
    revalidatePath("/products");
    if (result.previousSlug) {
      revalidatePath(`/products/${result.previousSlug}`);
    }
    revalidatePath(`/products/${result.product.slug}`);
    revalidatePath("/sitemap.xml");

    return apiSuccess(result.product, {
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
    logApiError("admin:products:update", requestId, error);
    return apiFailure(
      500,
      {
        code: "INTERNAL_ERROR",
        message: "ذخیره تغییرات محصول انجام نشد. دوباره تلاش کنید.",
      },
      { requestId },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: AdminProductRouteContext,
) {
  const requestId = randomUUID();
  try {
    const admin = readAdminSession(request);
    const rateLimit = await consumeRateLimit(request, {
      scope: "admin:products:delete",
      identifier: admin.email,
      limit: 15,
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

    const productId = parseProductId((await context.params).id);
    if (!productId.success) {
      return apiFailure(
        400,
        { code: "INVALID_REQUEST", message: "شناسهٔ محصول معتبر نیست." },
        { requestId, rateLimit },
      );
    }

    const result = await deleteAdminProduct(productId.data);
    revalidatePath("/");
    revalidatePath("/products");
    if (result.slug) revalidatePath(`/products/${result.slug}`);
    revalidatePath("/sitemap.xml");

    return apiSuccess(result, {
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
    logApiError("admin:products:delete", requestId, error);
    return apiFailure(
      500,
      {
        code: "INTERNAL_ERROR",
        message: "حذف محصول انجام نشد. دوباره تلاش کنید.",
      },
      { requestId },
    );
  }
}
