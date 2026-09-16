import { describe, expect, it } from "vitest";

import { createPasswordHash, verifyPassword } from "./password";

describe("admin password hashing", () => {
  it("uses a salted scrypt hash and verifies only the original password", async () => {
    const hash = await createPasswordHash("a-strong-admin-password");

    expect(hash).toMatch(/^scrypt\$/);
    await expect(verifyPassword("a-strong-admin-password", hash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("rejects short administrative passwords", async () => {
    await expect(createPasswordHash("short")).rejects.toThrow();
  });
});
