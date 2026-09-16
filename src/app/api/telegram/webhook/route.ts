import { randomUUID } from "node:crypto";

import { telegramUpdateSchema } from "@/features/telegram/schemas";
import {
  TelegramServiceError,
  processTelegramUpdate,
} from "@/features/telegram/service";
import { ApiRequestError, readJsonBody } from "@/lib/api/request";
import {
  apiFailure,
  apiRateLimitFailure,
  apiSuccess,
  logApiError,
} from "@/lib/api/response";
import { serverEnvironment } from "@/lib/env/server";
import { constantTimeEqual } from "@/lib/security/constant-time";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const telegramWebhookBodyLimit = 128 * 1024;

export async function POST(request: Request) {
  const requestId = randomUUID();
  const configuredSecret = serverEnvironment.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (!configuredSecret) {
    return apiFailure(
      503,
      {
        code: "CONFIGURATION_ERROR",
        message: "وب‌هوک تلگرام هنوز پیکربندی نشده است.",
      },
      { requestId },
    );
  }
  if (!receivedSecret || !constantTimeEqual(receivedSecret, configuredSecret)) {
    return apiFailure(
      401,
      { code: "INVALID_WEBHOOK_SECRET", message: "درخواست معتبر نیست." },
      { requestId },
    );
  }

  const rateLimit = await consumeRateLimit(request, {
    scope: "telegram:webhook",
    limit: 300,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

  try {
    const update = telegramUpdateSchema.safeParse(
      await readJsonBody(request, telegramWebhookBodyLimit),
    );
    if (!update.success) {
      return apiFailure(
        400,
        {
          code: "INVALID_TELEGRAM_UPDATE",
          message: "دادهٔ تلگرام معتبر نیست.",
        },
        { requestId, rateLimit },
      );
    }

    return apiSuccess(await processTelegramUpdate(update.data), {
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
    logApiError("telegram:webhook", requestId, error);
    return apiFailure(
      500,
      { code: "INTERNAL_ERROR", message: "پردازش رویداد تلگرام انجام نشد." },
      { requestId, rateLimit },
    );
  }
}
