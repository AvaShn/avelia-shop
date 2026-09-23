import { describe, expect, it } from "vitest";

import {
  loginAccountSchema,
  registerAccountSchema,
} from "@/features/account/schemas";

describe("customer account validation", () => {
  it("normalizes a valid Iranian registration identity", () => {
    const result = registerAccountSchema.parse({
      name: "آوا شهابی",
      phone: "۰۹۱۲۱۲۳۴۵۶۷",
      email: "AVA@EXAMPLE.COM",
      password: "a-secure-password",
      passwordConfirmation: "a-secure-password",
    });

    expect(result.phone).toBe("+989121234567");
    expect(result.email).toBe("ava@example.com");
  });

  it("rejects a mismatched password confirmation", () => {
    const result = registerAccountSchema.safeParse({
      name: "آوا شهابی",
      phone: "09121234567",
      email: "ava@example.com",
      password: "a-secure-password",
      passwordConfirmation: "another-password",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["passwordConfirmation"]);
  });

  it("accepts a customer password of any non-empty length", () => {
    expect(
      registerAccountSchema.safeParse({
        name: "آوا شهابی",
        phone: "09121234567",
        email: "ava@example.com",
        password: "1",
        passwordConfirmation: "1",
      }).success,
    ).toBe(true);
  });

  it("accepts email or phone as a login identifier", () => {
    expect(
      loginAccountSchema.safeParse({
        identifier: "ava@example.com",
        password: "secret",
      }).success,
    ).toBe(true);
  });
});
