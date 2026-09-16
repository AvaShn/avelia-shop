import { describe, expect, it } from "vitest";

import {
  assertOrderTransition,
  assertPaymentTransition,
  canTransitionOrder,
  canTransitionPayment,
} from "@/features/orders/status-transitions";

describe("order and payment status transitions", () => {
  it("allows only the documented order transitions", () => {
    expect(canTransitionOrder("PENDING_PAYMENT", "WAITING_REVIEW")).toBe(true);
    expect(canTransitionOrder("WAITING_REVIEW", "PAID")).toBe(true);
    expect(canTransitionOrder("PAID", "REJECTED")).toBe(false);
    expect(() => assertOrderTransition("PAID", "REJECTED")).toThrow(
      "INVALID_ORDER_TRANSITION",
    );
  });

  it("allows only the documented payment transitions", () => {
    expect(canTransitionPayment("PENDING", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionPayment("UNDER_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionPayment("APPROVED", "REJECTED")).toBe(false);
    expect(() => assertPaymentTransition("APPROVED", "REJECTED")).toThrow(
      "INVALID_PAYMENT_TRANSITION",
    );
  });
});
