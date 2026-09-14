import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("merges conditional and conflicting utility classes", () => {
    expect(cn("px-2", false, { block: true }, "px-6")).toBe("block px-6");
  });
});
