import { describe, expect, it } from "vitest";

import { formatPriceRial } from "./format-price";

describe("formatPriceRial", () => {
  it("formats rial as the primary value and toman in Persian words", () => {
    expect(formatPriceRial(10_000_000)).toEqual({
      rial: "۱۰٬۰۰۰٬۰۰۰ ریال",
      tomanWords: "یک میلیون تومان",
    });
  });

  it("rejects negative or non-convertible rial values", () => {
    expect(() => formatPriceRial(-10)).toThrow(RangeError);
    expect(() => formatPriceRial(101)).toThrow(RangeError);
  });
});
