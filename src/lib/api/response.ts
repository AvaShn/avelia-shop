import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import type { ApiEnvelope, ApiError } from "@/lib/api/contracts";
import type { RateLimitResult } from "@/lib/security/rate-limit";

type ApiResponseOptions<Meta extends Record<string, unknown>> = {
  status?: number;
  meta?: Meta;
  headers?: HeadersInit;
  requestId?: string;
  rateLimit?: RateLimitResult;
};

function responseHeaders(
  headers: HeadersInit | undefined,
  rateLimit: RateLimitResult | undefined,
) {
  const result = new Headers(headers);
  result.set("X-Content-Type-Options", "nosniff");

  if (rateLimit) {
    result.set("RateLimit-Limit", String(rateLimit.limit));
    result.set("RateLimit-Remaining", String(rateLimit.remaining));
    result.set("RateLimit-Reset", String(rateLimit.resetAtUnix));
    if (!rateLimit.allowed) {
      result.set("Retry-After", String(rateLimit.retryAfterSeconds));
    }
  }

  return result;
}

export function apiSuccess<
  Data,
  Meta extends Record<string, unknown> = Record<string, never>,
>(data: Data, options: ApiResponseOptions<Meta> = {}) {
  const payload: ApiEnvelope<Data, Meta> = {
    data,
    error: null,
    meta: {
      requestId: options.requestId ?? randomUUID(),
      ...(options.meta ?? ({} as Meta)),
    },
  };

  return NextResponse.json(payload, {
    status: options.status ?? 200,
    headers: responseHeaders(options.headers, options.rateLimit),
  });
}

export function apiFailure<
  Meta extends Record<string, unknown> = Record<string, never>,
>(status: number, error: ApiError, options: ApiResponseOptions<Meta> = {}) {
  const payload: ApiEnvelope<never, Meta> = {
    data: null,
    error,
    meta: {
      requestId: options.requestId ?? randomUUID(),
      ...(options.meta ?? ({} as Partial<Meta>)),
    },
  };

  return NextResponse.json(payload, {
    status,
    headers: responseHeaders(options.headers, options.rateLimit),
  });
}

export function apiRateLimitFailure(
  rateLimit: RateLimitResult,
  requestId?: string,
) {
  return apiFailure(
    429,
    {
      code: "RATE_LIMITED",
      message: "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
    },
    { rateLimit, ...(requestId ? { requestId } : {}) },
  );
}

export function logApiError(scope: string, requestId: string, error: unknown) {
  console.error(`[${scope}] requestId=${requestId}`, error);
}
