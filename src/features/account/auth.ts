import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import type { AccountUser } from "@/features/account/schemas";
import { normalizeIranianMobile } from "@/features/orders/customer";
import { getPrismaClient } from "@/lib/prisma/client";
import { createPasswordHash, verifyPassword } from "@/lib/security/password";
import {
  createOpaqueToken,
  hashToken,
  isValidOpaqueToken,
} from "@/lib/security/tokens";

export const customerSessionCookieName = "avelia_customer_session";
const customerSessionLifetimeSeconds = 30 * 24 * 60 * 60;

export class AccountAuthError extends Error {
  constructor(
    public readonly code:
      | "DATABASE_UNAVAILABLE"
      | "ACCOUNT_EXISTS"
      | "INVALID_CREDENTIALS"
      | "UNAUTHORIZED",
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AccountAuthError";
  }
}

function requiredPrisma() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AccountAuthError(
      "DATABASE_UNAVAILABLE",
      "ورود کاربران پس از اتصال پایگاه داده فعال می‌شود.",
      503,
    );
  }
  return prisma;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function mapAccountUser(user: {
  name: string;
  phoneNormalized: string;
  email: string | null;
  defaultCity: string | null;
  defaultAddressLine: string | null;
  defaultPostalCode: string | null;
  defaultPlaque: string | null;
  defaultUnit: string | null;
}): AccountUser {
  if (!user.email) {
    throw new AccountAuthError(
      "UNAUTHORIZED",
      "این حساب قدیمی هنوز برای ورود فعال نشده است.",
      401,
    );
  }
  return {
    name: user.name,
    phone: user.phoneNormalized,
    email: user.email,
    defaultAddress: {
      city: user.defaultCity,
      addressLine: user.defaultAddressLine,
      postalCode: user.defaultPostalCode,
      plaque: user.defaultPlaque,
      unit: user.defaultUnit,
    },
  };
}

function sessionExpiry() {
  return new Date(Date.now() + customerSessionLifetimeSeconds * 1_000);
}

export async function registerCustomer(input: {
  name: string;
  phone: string;
  email: string;
  password: string;
}) {
  const prisma = requiredPrisma();
  const token = createOpaqueToken();
  const expiresAt = sessionExpiry();
  const passwordHash = await createPasswordHash(input.password, {
    minimumLength: 1,
  });

  try {
    const user = await prisma.$transaction(async (transaction) => {
      const created = await transaction.user.create({
        data: {
          name: input.name,
          phoneNormalized: input.phone,
          email: input.email,
          passwordHash,
        },
      });
      await transaction.userSession.create({
        data: {
          userId: created.id,
          tokenHash: hashToken(token),
          expiresAt,
        },
      });
      return created;
    });
    return { user: mapAccountUser(user), token, expiresAt };
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      throw new AccountAuthError(
        "ACCOUNT_EXISTS",
        "برای این ایمیل یا شماره موبایل قبلاً حسابی ثبت شده است.",
        409,
      );
    }
    throw error;
  }
}

export async function loginCustomer(input: {
  identifier: string;
  password: string;
}) {
  const prisma = requiredPrisma();
  const identifier = input.identifier.trim();
  let lookup: { email: string } | { phoneNormalized: string };

  if (identifier.includes("@")) {
    lookup = { email: identifier.toLocaleLowerCase("en-US") };
  } else {
    try {
      lookup = { phoneNormalized: normalizeIranianMobile(identifier) };
    } catch {
      throw new AccountAuthError(
        "INVALID_CREDENTIALS",
        "ایمیل، شماره موبایل یا رمز عبور صحیح نیست.",
        401,
      );
    }
  }

  const user = await prisma.user.findUnique({ where: lookup });
  const passwordMatches =
    user?.passwordHash &&
    (await verifyPassword(input.password, user.passwordHash));
  if (!user || !passwordMatches) {
    throw new AccountAuthError(
      "INVALID_CREDENTIALS",
      "ایمیل، شماره موبایل یا رمز عبور صحیح نیست.",
      401,
    );
  }

  const token = createOpaqueToken();
  const expiresAt = sessionExpiry();
  await prisma.$transaction([
    prisma.userSession.deleteMany({
      where: { userId: user.id, expiresAt: { lte: new Date() } },
    }),
    prisma.userSession.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt },
    }),
  ]);
  return { user: mapAccountUser(user), token, expiresAt };
}

export async function readCustomerSession(request: NextRequest) {
  const token = request.cookies.get(customerSessionCookieName)?.value;
  if (!token || !isValidOpaqueToken(token)) {
    throw new AccountAuthError(
      "UNAUTHORIZED",
      "برای ادامه ابتدا وارد حساب کاربری شوید.",
      401,
    );
  }

  const prisma = requiredPrisma();
  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.userSession.delete({ where: { id: session.id } });
    }
    throw new AccountAuthError(
      "UNAUTHORIZED",
      "نشست شما منقضی شده است؛ دوباره وارد شوید.",
      401,
    );
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    user: mapAccountUser(session.user),
  };
}

export async function deleteCustomerSession(request: NextRequest) {
  const token = request.cookies.get(customerSessionCookieName)?.value;
  if (!token || !isValidOpaqueToken(token)) return;
  const prisma = requiredPrisma();
  await prisma.userSession.deleteMany({
    where: { tokenHash: hashToken(token) },
  });
}

export function setCustomerSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date,
) {
  response.cookies.set({
    name: customerSessionCookieName,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearCustomerSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: customerSessionCookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
