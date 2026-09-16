import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import {
  AdminAuthError,
  authenticateAdmin,
  clearAdminSessionCookie,
  readAdminSession,
  setAdminSessionCookie,
} from "@/features/admin/auth";
import { adminLoginSchema } from "@/features/admin/schemas";
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
    const session = readAdminSession(request);
    return apiSuccess(
      { email: session.email, role: session.role },
      {
        requestId,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error: unknown) {
    if (error instanceof AdminAuthError) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId },
      );
    }
    logApiError("admin:session:read", requestId, error);
    return apiFailure(
      500,
      { code: "INTERNAL_ERROR", message: "بررسی نشست مدیریت انجام نشد." },
      { requestId },
    );
  }
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const rateLimit = await consumeRateLimit(request, {
    scope: "admin:login",
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!rateLimit.allowed) return apiRateLimitFailure(rateLimit, requestId);

  if (!isTrustedMutationOrigin(request)) {
    return apiFailure(
      403,
      { code: "FORBIDDEN_ORIGIN", message: "مبدأ درخواست معتبر نیست." },
      { requestId, rateLimit },
    );
  }

  try {
    const parsedBody = adminLoginSchema.safeParse(await readJsonBody(request));
    if (!parsedBody.success) {
      return apiFailure(
        400,
        {
          code: "INVALID_REQUEST",
          message: "ایمیل و رمز عبور را بررسی کنید.",
          fieldErrors: parsedBody.error.flatten().fieldErrors,
        },
        { requestId, rateLimit },
      );
    }

    const token = await authenticateAdmin(
      parsedBody.data.email,
      parsedBody.data.password,
    );
    const response = apiSuccess(
      { authenticated: true as const },
      {
        requestId,
        rateLimit,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
    setAdminSessionCookie(response, token);
    return response;
  } catch (error: unknown) {
    if (error instanceof AdminAuthError || error instanceof ApiRequestError) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId, rateLimit },
      );
    }
    logApiError("admin:session:create", requestId, error);
    return apiFailure(
      500,
      { code: "INTERNAL_ERROR", message: "ورود مدیریت انجام نشد." },
      { requestId, rateLimit },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = randomUUID();
  if (!isTrustedMutationOrigin(request)) {
    return apiFailure(
      403,
      { code: "FORBIDDEN_ORIGIN", message: "مبدأ درخواست معتبر نیست." },
      { requestId },
    );
  }

  const response = apiSuccess(
    { authenticated: false as const },
    {
      requestId,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
  clearAdminSessionCookie(response);
  return response;
}
