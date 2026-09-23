import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import {
  AccountAuthError,
  loginCustomer,
  setCustomerSessionCookie,
} from "@/features/account/auth";
import {
  accountUserSchema,
  loginAccountSchema,
} from "@/features/account/schemas";
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
    scope: "account:login",
    limit: 10,
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
    const parsed = loginAccountSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return apiFailure(
        400,
        {
          code: "INVALID_REQUEST",
          message: "اطلاعات ورود را بررسی کنید.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { requestId, rateLimit },
      );
    }
    const result = await loginCustomer(parsed.data);
    const response = apiSuccess(accountUserSchema.parse(result.user), {
      requestId,
      rateLimit,
      headers: { "Cache-Control": "private, no-store" },
    });
    setCustomerSessionCookie(response, result.token, result.expiresAt);
    return response;
  } catch (error: unknown) {
    if (error instanceof AccountAuthError || error instanceof ApiRequestError) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId, rateLimit },
      );
    }
    logApiError("account:login", requestId, error);
    return apiFailure(
      500,
      { code: "INTERNAL_ERROR", message: "ورود انجام نشد؛ دوباره تلاش کنید." },
      { requestId, rateLimit },
    );
  }
}
