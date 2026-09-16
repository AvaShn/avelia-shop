import { describe, expect, it } from "vitest";

import {
  createOpaqueToken,
  createPaymentSessionToken,
  hashToken,
  isValidOpaqueToken,
} from "@/lib/security/tokens";

describe("secure lookup tokens", () => {
  it("creates opaque URL-safe tokens and stores stable hashes", () => {
    const token = createOpaqueToken();

    expect(isValidOpaqueToken(token)).toBe(true);
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("derives a deterministic payment-session token without exposing the secret", () => {
    const token = createPaymentSessionToken("public-order-token", "secret-key");

    expect(token).toBe(
      createPaymentSessionToken("public-order-token", "secret-key"),
    );
    expect(token).not.toContain("secret-key");
  });
});
