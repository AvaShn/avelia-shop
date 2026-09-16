import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { serverEnvironment } from "@/lib/env/server";
import { verifyPassword } from "@/lib/security/password";

export const adminSessionCookieName = "avelia_admin_session";
const adminSessionLifetimeSeconds = 8 * 60 * 60;

const adminSessionPayloadSchema = z.object({
  email: z.email(),
  role: z.literal("admin"),
  expiresAt: z.number().int().positive(),
});

export type AdminSession = z.infer<typeof adminSessionPayloadSchema>;

export class AdminAuthError extends Error {
  constructor(
    public readonly code:
      "AUTH_NOT_CONFIGURED" | "INVALID_CREDENTIALS" | "UNAUTHORIZED",
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

function getAdminConfiguration() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH, AUTH_SECRET } = serverEnvironment;
  if (
    !ADMIN_EMAIL ||
    !ADMIN_PASSWORD_HASH ||
    !AUTH_SECRET ||
    AUTH_SECRET.length < 32
  ) {
    throw new AdminAuthError(
      "AUTH_NOT_CONFIGURED",
      "ورود مدیریت هنوز به‌صورت امن پیکربندی نشده است.",
      503,
    );
  }

  return {
    email: ADMIN_EMAIL.toLocaleLowerCase("en-US"),
    passwordHash: ADMIN_PASSWORD_HASH,
    secret: AUTH_SECRET,
  };
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionToken(email: string, secret: string) {
  const payload = Buffer.from(
    JSON.stringify({
      email,
      role: "admin",
      expiresAt: Math.floor(Date.now() / 1000) + adminSessionLifetimeSeconds,
    }),
  ).toString("base64url");

  return `${payload}.${signPayload(payload, secret)}`;
}

export async function authenticateAdmin(email: string, password: string) {
  const configuration = getAdminConfiguration();
  const emailMatches =
    email.trim().toLocaleLowerCase("en-US") === configuration.email;
  const passwordMatches = await verifyPassword(
    password,
    configuration.passwordHash,
  );

  if (!emailMatches || !passwordMatches) {
    throw new AdminAuthError(
      "INVALID_CREDENTIALS",
      "ایمیل یا رمز عبور مدیریت صحیح نیست.",
      401,
    );
  }

  return createSessionToken(configuration.email, configuration.secret);
}

export function readAdminSession(request: NextRequest): AdminSession {
  const token = request.cookies.get(adminSessionCookieName)?.value;
  if (!token) {
    throw new AdminAuthError(
      "UNAUTHORIZED",
      "برای مشاهده این بخش ابتدا وارد حساب مدیریت شوید.",
      401,
    );
  }

  const configuration = getAdminConfiguration();
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    throw new AdminAuthError("UNAUTHORIZED", "نشست مدیریت معتبر نیست.", 401);
  }

  const expectedSignature = signPayload(payload, configuration.secret);
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    throw new AdminAuthError("UNAUTHORIZED", "نشست مدیریت معتبر نیست.", 401);
  }

  try {
    const session = adminSessionPayloadSchema.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    if (
      session.expiresAt <= Math.floor(Date.now() / 1000) ||
      session.email.toLocaleLowerCase("en-US") !== configuration.email
    ) {
      throw new Error("EXPIRED_SESSION");
    }
    return session;
  } catch {
    throw new AdminAuthError(
      "UNAUTHORIZED",
      "نشست مدیریت منقضی شده است؛ دوباره وارد شوید.",
      401,
    );
  }
}

export function setAdminSessionCookie(
  response: NextResponse,
  sessionToken: string,
) {
  response.cookies.set({
    name: adminSessionCookieName,
    value: sessionToken,
    httpOnly: true,
    secure: serverEnvironment.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: adminSessionLifetimeSeconds,
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: adminSessionCookieName,
    value: "",
    httpOnly: true,
    secure: serverEnvironment.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
