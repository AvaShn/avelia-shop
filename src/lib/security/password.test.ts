import { describe, expect, it } from "vitest";

import { createPasswordHash, verifyPassword } from "./password";

describe("admin password hashing", () => {
  it("uses a salted scrypt hash and verifies only the original password", async () => {
    const hash = await createPasswordHash("a-strong-admin-password");

    expect(hash).toMatch(/^scrypt:/);
    await expect(verifyPassword("a-strong-admin-password", hash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("accepts legacy dollar-delimited hashes outside dotenv expansion", async () => {
    const hash = await createPasswordHash("a-strong-admin-password");
    const legacyHash = hash.replaceAll(":", "$");

    await expect(
      verifyPassword("a-strong-admin-password", legacyHash),
    ).resolves.toBe(true);
  });

  it("rejects short administrative passwords", async () => {
    await expect(createPasswordHash("short")).rejects.toThrow();
  });

  it("allows a non-empty customer password when requested", async () => {
    const hash = await createPasswordHash("1", { minimumLength: 1 });

    await expect(verifyPassword("1", hash)).resolves.toBe(true);
  });
});
