import { describe, expect, it } from "vitest";

import {
  CheckoutPricingError,
  createCheckoutPricingSnapshot,
} from "@/features/orders/checkout-pricing";

describe("server-side checkout pricing", () => {
  it("creates immutable unit-price snapshots only from server products", () => {
    const snapshot = createCheckoutPricingSnapshot(
      [{ productId: "product-1", quantity: 2 }],
      [
        {
          id: "product-1",
          priceRial: 18_900_000n,
          stock: 4,
          isPublished: true,
        },
      ],
    );

    expect(snapshot.totalPriceRial).toBe(37_800_000n);
    expect(snapshot.lines[0]?.unitPriceRial).toBe(18_900_000n);
  });

  it("rejects unavailable and insufficient-stock products", () => {
    expect(() =>
      createCheckoutPricingSnapshot(
        [{ productId: "product-1", quantity: 2 }],
        [
          {
            id: "product-1",
            priceRial: 10n,
            stock: 1,
            isPublished: true,
          },
        ],
      ),
    ).toThrowError(new CheckoutPricingError("OUT_OF_STOCK"));

    expect(() =>
      createCheckoutPricingSnapshot(
        [{ productId: "product-1", quantity: 1 }],
        [
          {
            id: "product-1",
            priceRial: 10n,
            stock: 1,
            isPublished: false,
          },
        ],
      ),
    ).toThrowError(new CheckoutPricingError("PRODUCT_UNAVAILABLE"));
  });
});
