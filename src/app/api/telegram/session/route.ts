import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import {
  telegramSessionRequestSchema,
  telegramSessionSchema,
} from "@/features/telegram/schemas";
import {
  TelegramServiceError,
  createTelegramHandoff,
} from "@/features/telegram/service";
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

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const rateLimit = await consumeRateLimit(request, {
    scope: "telegram:session",
    limit: 10,
    windowMs: 10 * 60_000,
  });
  if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);
  if (!isTrustedMutationOrigin(request)) {
    return apiFailure(
      403,
      {
        code: "FORBIDDEN_ORIGIN",
        message: "این درخواست از مبدأ معتبری ارسال نشده است.",
      },
      { requestId, rateLimit },
    );
  }

  try {
    const body = telegramSessionRequestSchema.safeParse(
      await readJsonBody(request),
    );
    if (!body.success) {
      return apiFailure(
        400,
        {
          code: "INVALID_REQUEST",
          message: "شناسهٔ سفارش برای ادامه در تلگرام معتبر نیست.",
          fieldErrors: body.error.flatten().fieldErrors,
        },
        { requestId, rateLimit },
      );
    }

    const handoff = telegramSessionSchema.parse(
      await createTelegramHandoff(body.data.orderToken),
    );
    return apiSuccess(handoff, {
      requestId,
      rateLimit,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    if (
      error instanceof TelegramServiceError ||
      error instanceof ApiRequestError
    ) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId, rateLimit },
      );
    }
    logApiError("telegram:session", requestId, error);
    return apiFailure(
      500,
      {
        code: "INTERNAL_ERROR",
        message: "ساخت لینک تلگرام انجام نشد. دوباره تلاش کنید.",
      },
      { requestId, rateLimit },
    );
  }
}
