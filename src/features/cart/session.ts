import "server-only";

import type { NextRequest, NextResponse } from "next/server";

import { storedCartItemsSchema } from "@/features/cart/schemas";
import type { StoredCartItem } from "@/features/cart/types";
import { createOpaqueToken, isValidOpaqueToken } from "@/lib/security/tokens";

const cartTokenCookie = "avelia_cart";
const fallbackCartCookie = "avelia_cart_preview";
const cartCookieMaxAge = 60 * 60 * 24 * 30;

export type CartRequestSession = {
  token: string;
  storedItems: StoredCartItem[];
};

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") === true,
    path: "/",
    maxAge: cartCookieMaxAge,
  };
}

function decodeFallbackItems(value: string | undefined): StoredCartItem[] {
  if (!value) return [];

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed: unknown = JSON.parse(decoded);
    const result = storedCartItemsSchema.safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

function encodeFallbackItems(items: readonly StoredCartItem[]) {
  return Buffer.from(JSON.stringify(items), "utf8").toString("base64url");
}

export function readCartRequestSession(
  request: NextRequest,
): CartRequestSession {
  const candidate = request.cookies.get(cartTokenCookie)?.value;

  return {
    token:
      candidate && isValidOpaqueToken(candidate)
        ? candidate
        : createOpaqueToken(),
    storedItems: decodeFallbackItems(
      request.cookies.get(fallbackCartCookie)?.value,
    ),
  };
}

export function commitCartSession(
  response: NextResponse,
  token: string,
  storedItems?: readonly StoredCartItem[],
) {
  response.cookies.set(cartTokenCookie, token, cookieOptions());

  if (storedItems) {
    response.cookies.set(
      fallbackCartCookie,
      encodeFallbackItems(storedItems),
      cookieOptions(),
    );
  } else {
    response.cookies.delete(fallbackCartCookie);
  }
}

export function clearCartSession(response: NextResponse) {
  response.cookies.delete(cartTokenCookie);
  response.cookies.delete(fallbackCartCookie);
}
