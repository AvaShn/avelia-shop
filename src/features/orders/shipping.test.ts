import { describe, expect, it } from "vitest";

import {
  POST_SHIPPING_COST_RIAL,
  shippingCostRial,
  shippingMethodSchema,
} from "@/features/orders/shipping";

describe("order shipping", () => {
  it("adds the fixed post charge in Rials", () => {
    expect(shippingCostRial("POST")).toBe(POST_SHIPPING_COST_RIAL);
    expect(POST_SHIPPING_COST_RIAL).toBe(1_500_000);
  });

  it("keeps Tipax outside the prepaid order total", () => {
    expect(shippingCostRial("TIPAX")).toBe(0);
  });

  it("accepts only supported shipping methods", () => {
    expect(shippingMethodSchema.safeParse("POST").success).toBe(true);
    expect(shippingMethodSchema.safeParse("TIPAX").success).toBe(true);
    expect(shippingMethodSchema.safeParse("COURIER").success).toBe(false);
  });
});
