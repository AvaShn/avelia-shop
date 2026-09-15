import { describe, expect, it } from "vitest";

import { getDiscountPercentage, hasDiscount } from "@/lib/pricing/discount";

describe("discount pricing", () => {
  it("calculates a rounded discount percentage", () => {
    expect(getDiscountPercentage(16_900_000, 18_900_000)).toBe(11);
    expect(hasDiscount(16_900_000, 18_900_000)).toBe(true);
  });

  it("does not expose invalid or non-discounted comparisons", () => {
    expect(getDiscountPercentage(18_900_000, 18_900_000)).toBe(0);
    expect(getDiscountPercentage(18_900_000, 17_000_000)).toBe(0);
    expect(getDiscountPercentage(18_900_000)).toBe(0);
  });
});
