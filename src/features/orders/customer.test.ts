import { describe, expect, it } from "vitest";

import {
  checkoutCustomerSchema,
  normalizeIranianMobile,
} from "@/features/orders/customer";

describe("checkout customer validation", () => {
  it.each([
    ["0912 123 4567", "+989121234567"],
    ["۰۹۱۲۱۲۳۴۵۶۷", "+989121234567"],
    ["0098-912-123-4567", "+989121234567"],
    ["989121234567", "+989121234567"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeIranianMobile(input)).toBe(expected);
  });

  it("rejects invalid customer information with a human message", () => {
    const result = checkoutCustomerSchema.safeParse({
      name: "ا",
      phone: "123",
      email: "invalid",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "نام و نام خانوادگی را کامل وارد کنید.",
        "شماره موبایل را با قالب معتبر ایران وارد کنید.",
        "ایمیل واردشده معتبر نیست.",
      ]),
    );
  });
});
