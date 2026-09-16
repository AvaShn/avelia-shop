import { describe, expect, it } from "vitest";

import { decodeCursor, encodeCursor } from "./cursor";

describe("API cursors", () => {
  it("round-trips an identifier without exposing it as plain text", () => {
    const cursor = encodeCursor("product-sensitive-id");

    expect(cursor).not.toContain("product-sensitive-id");
    expect(decodeCursor(cursor)).toBe("product-sensitive-id");
  });

  it("rejects malformed cursor payloads", () => {
    expect(decodeCursor("not-a-valid-cursor")).toBeNull();
  });
});
