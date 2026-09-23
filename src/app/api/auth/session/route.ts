import { randomUUID } from "node:crypto";

import type { NextRequest } from "next/server";

import {
  AccountAuthError,
  clearCustomerSessionCookie,
  deleteCustomerSession,
  readCustomerSession,
} from "@/features/account/auth";
import { accountUserSchema } from "@/features/account/schemas";
import { apiFailure, apiSuccess, logApiError } from "@/lib/api/response";
import { isTrustedMutationOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestId = randomUUID();
  try {
    const session = await readCustomerSession(request);
    return apiSuccess(accountUserSchema.parse(session.user), {
      requestId,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error: unknown) {
    if (error instanceof AccountAuthError) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId },
      );
    }
    logApiError("account:session:read", requestId, error);
    return apiFailure(
      500,
      { code: "INTERNAL_ERROR", message: "بررسی حساب انجام نشد." },
      { requestId },
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
  try {
    await deleteCustomerSession(request);
    const response = apiSuccess(
      { authenticated: false as const },
      { requestId, headers: { "Cache-Control": "private, no-store" } },
    );
    clearCustomerSessionCookie(response);
    return response;
  } catch (error: unknown) {
    if (error instanceof AccountAuthError) {
      return apiFailure(
        error.status,
        { code: error.code, message: error.message },
        { requestId },
      );
    }
    logApiError("account:session:delete", requestId, error);
    return apiFailure(
      500,
      { code: "INTERNAL_ERROR", message: "خروج از حساب انجام نشد." },
      { requestId },
    );
  }
}
