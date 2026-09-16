import { describe, expect, it } from "vitest";

import { formatPersianInteger, toPersianDigits } from "./format-number";

describe("formatPersianInteger", () => {
  it("uses Persian digits and optional zero padding", () => {
    expect(formatPersianInteger(1, 2)).toBe("۰۱");
    expect(formatPersianInteger(24)).toBe("۲۴");
  });

  it("keeps phone formatting while translating every digit", () => {
    expect(toPersianDigits("0912 858 6010")).toBe("۰۹۱۲ ۸۵۸ ۶۰۱۰");
  });
});
