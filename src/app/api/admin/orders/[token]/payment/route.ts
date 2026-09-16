import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import { AdminAuthError, readAdminSession } from "@/features/admin/auth";
import {
  AdminOrderError,
  reviewAdminOrderPayment,
} from "@/features/admin/orders";
import { adminPaymentReviewSchema } from "@/features/admin/schemas";
import { publicOrderTokenSchema } from "@/features/orders/schemas";
import { notifyCustomerAboutReview } from "@/features/telegram/client";
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

type AdminPaymentRouteContext = { params: Promise<{ token: string }> };

export async function POST(
  request: NextRequest,
  context: AdminPaymentRouteContext,
) {
  const requestId = randomUUID();
  try {
    const admin = readAdminSession(request);
    const rateLimit = await consumeRateLimit(request, {
      scope: "admin:payment:review",
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

    const [token, body] = await Promise.all([
      publicOrderTokenSchema.safeParseAsync((await context.params).token),
      readJsonBody(request),
    ]);
    const review = adminPaymentReviewSchema.safeParse(body);
    if (!token.success || !review.success) {
      return apiFailure(
        400,
        {
          code: "INVALID_REQUEST",
          message: "عملیات یا توضیح بررسی معتبر نیست.",
        },
        { requestId, rateLimit },
      );
    }

    const order = await reviewAdminOrderPayment(
      token.data,
      review.data.action,
      admin.email,
      review.data.note,
    );
    await notifyCustomerAboutReview(token.data, review.data.action).catch(
      (error: unknown) =>
        logApiError("telegram:review-notification", requestId, error),
    );

    return apiSuccess(order, {
      requestId,
      rateLimit,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    if (
      error instanceof AdminAuthError ||
      error instanceof AdminOrderError ||
      error instanceof ApiRequestError
    ) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId },
      );
    }
    logApiError("admin:payment:review", requestId, error);
    return apiFailure(
      500,
      { code: "INTERNAL_ERROR", message: "بررسی پرداخت انجام نشد." },
      { requestId },
    );
  }
}
