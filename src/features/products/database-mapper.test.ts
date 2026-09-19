import { describe, expect, it } from "vitest";

import {
  databaseProductToDomain,
  type DatabaseProductRecord,
} from "@/features/products/database-mapper";

const databaseProduct: DatabaseProductRecord = {
  id: "product-1",
  slug: "product-1",
  name: "محصول تست",
  brand: "AVELIA",
  categoryId: "makeup",
  shortDescription: "توضیح کوتاه",
  description: "توضیح کامل",
  keyFeatures: ["ویژگی اول"],
  usage: "روش استفاده",
  priceRial: 12_000_000n,
  compareAtPriceRial: 15_000_000n,
  stock: 4,
  isOriginal: true,
  isFeatured: false,
  sortOrder: 1,
  images: ["/product.webp"],
};

describe("database product mapper", () => {
  it("maps PostgreSQL bigint and image paths to the storefront model", () => {
    const product = databaseProductToDomain(databaseProduct);

    expect(product.priceRial).toBe(12_000_000);
    expect(product.compareAtPriceRial).toBe(15_000_000);
    expect(product.images[0]?.src).toBe("/product.webp");
    expect(product.images[0]?.alt).toBe("تصویر محصول تست");
  });

  it("rejects unknown categories and malformed image data", () => {
    expect(() =>
      databaseProductToDomain({
        ...databaseProduct,
        categoryId: "unknown",
      }),
    ).toThrow();

    expect(() =>
      databaseProductToDomain({
        ...databaseProduct,
        images: [],
      }),
    ).toThrow();
  });
});
