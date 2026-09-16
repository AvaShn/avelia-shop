import "server-only";

import { getPrismaClient } from "@/lib/prisma/client";
import { hashToken } from "@/lib/security/tokens";

type RateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
  identifier?: string;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAtUnix: number;
  retryAfterSeconds: number;
};

type MemoryBucket = {
  count: number;
  expiresAt: number;
};

type RateLimitGlobal = typeof globalThis & {
  aveliaRateLimits?: Map<string, MemoryBucket> | undefined;
};

const rateLimitGlobal = globalThis as RateLimitGlobal;
const memoryBuckets =
  rateLimitGlobal.aveliaRateLimits ?? new Map<string, MemoryBucket>();

if (process.env.NODE_ENV !== "production") {
  rateLimitGlobal.aveliaRateLimits = memoryBuckets;
}

function requestIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0];
  return (
    forwardedFor?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown-client"
  );
}

function createResult(count: number, limit: number, resetAt: number) {
  const now = Date.now();
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAtUnix: Math.ceil(resetAt / 1000),
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
  } satisfies RateLimitResult;
}

function consumeMemoryBucket(
  key: string,
  limit: number,
  windowStart: number,
  windowMs: number,
) {
  if (memoryBuckets.size > 2_000) {
    const now = Date.now();
    for (const [candidateKey, bucket] of memoryBuckets) {
      if (bucket.expiresAt <= now) memoryBuckets.delete(candidateKey);
    }
  }

  const expiresAt = windowStart + windowMs;
  const existing = memoryBuckets.get(key);
  const count =
    existing && existing.expiresAt === expiresAt ? existing.count + 1 : 1;

  memoryBuckets.set(key, { count, expiresAt });
  return createResult(count, limit, expiresAt);
}

export async function consumeRateLimit(
  request: Request,
  options: RateLimitOptions,
) {
  const now = Date.now();
  const windowStartMs = Math.floor(now / options.windowMs) * options.windowMs;
  const expiresAtMs = windowStartMs + options.windowMs;
  const rawIdentifier = options.identifier ?? requestIdentifier(request);
  const keyHash = hashToken(`${options.scope}:${rawIdentifier}`);
  const memoryKey = `${options.scope}:${keyHash}:${windowStartMs}`;
  const prisma = getPrismaClient();

  if (!prisma) {
    return consumeMemoryBucket(
      memoryKey,
      options.limit,
      windowStartMs,
      options.windowMs,
    );
  }

  try {
    const bucket = await prisma.apiRateLimit.upsert({
      where: {
        scope_keyHash_windowStart: {
          scope: options.scope,
          keyHash,
          windowStart: new Date(windowStartMs),
        },
      },
      create: {
        scope: options.scope,
        keyHash,
        windowStart: new Date(windowStartMs),
        expiresAt: new Date(expiresAtMs),
      },
      update: { count: { increment: 1 } },
      select: { count: true },
    });

    return createResult(bucket.count, options.limit, expiresAtMs);
  } catch (error: unknown) {
    console.error(`[rate-limit:${options.scope}] database fallback`, error);
    return consumeMemoryBucket(
      memoryKey,
      options.limit,
      windowStartMs,
      options.windowMs,
    );
  }
}

export async function purgeExpiredRateLimits() {
  const prisma = getPrismaClient();
  if (!prisma) return 0;

  const result = await prisma.apiRateLimit.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return result.count;
}
