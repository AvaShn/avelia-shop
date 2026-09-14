import { describe, expect, it } from "vitest";

import { formatPersianInteger } from "./format-number";

describe("formatPersianInteger", () => {
  it("uses Persian digits and optional zero padding", () => {
    expect(formatPersianInteger(1, 2)).toBe("۰۱");
    expect(formatPersianInteger(24)).toBe("۲۴");
  });
});
