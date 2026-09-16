import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AdminAuthError, readAdminSession } from "@/features/admin/auth";
import {
  AdminOrderError,
  getAdminReceiptReference,
} from "@/features/admin/orders";
import { publicOrderTokenSchema } from "@/features/orders/schemas";
import { downloadTelegramPhoto } from "@/features/telegram/client";
import { readPrivateReceipt } from "@/features/telegram/storage";
import {
  apiFailure,
  apiRateLimitFailure,
  logApiError,
} from "@/lib/api/response";
import { consumeRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminReceiptRouteContext = { params: Promise<{ token: string }> };

export async function GET(
  request: NextRequest,
  context: AdminReceiptRouteContext,
) {
  const requestId = randomUUID();
  try {
    const admin = readAdminSession(request);
    const rateLimit = await consumeRateLimit(request, {
      scope: "admin:receipt:read",
      identifier: admin.email,
      limit: 60,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

    const token = publicOrderTokenSchema.safeParse(
      (await context.params).token,
    );
    if (!token.success) {
      return apiFailure(
        400,
        { code: "INVALID_REQUEST", message: "شناسهٔ سفارش معتبر نیست." },
        { requestId, rateLimit },
      );
    }

    const receipt = await getAdminReceiptReference(token.data);
    let body: BodyInit;
    let contentType: string;

    if (receipt.receiptObjectKey) {
      const storageResponse = await readPrivateReceipt(
        receipt.receiptObjectKey,
      );
      body = storageResponse.body!;
      contentType = storageResponse.headers.get("content-type") ?? "image/jpeg";
    } else if (receipt.telegramFileId) {
      const telegramReceipt = await downloadTelegramPhoto(
        receipt.telegramFileId,
      );
      body = Buffer.from(telegramReceipt.bytes);
      contentType = telegramReceipt.contentType;
    } else {
      return apiFailure(
        404,
        {
          code: "RECEIPT_NOT_FOUND",
          message: "رسیدی برای این سفارش ثبت نشده است.",
        },
        { requestId, rateLimit },
      );
    }

    return new NextResponse(body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": contentType,
        "Content-Disposition": "inline; filename=avelia-receipt",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error: unknown) {
    if (error instanceof AdminAuthError || error instanceof AdminOrderError) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId },
      );
    }
    logApiError("admin:receipt:read", requestId, error);
    return apiFailure(
      500,
      { code: "INTERNAL_ERROR", message: "نمایش رسید انجام نشد." },
      { requestId },
    );
  }
}
