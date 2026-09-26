import { describe, expect, it } from "vitest";

import {
  adminCreateProductSchema,
  adminProductEditorSchema,
} from "@/features/admin/schemas";

const validProduct = {
  name: "رژ لب مخملی رز",
  slug: "velvet-rose-lipstick",
  brand: "AVELIA SELECT",
  categoryId: "makeup",
  shortDescription: "رنگ رز متعادل با بافتی نرم و مخملی",
  description:
    "رژ لبی با پوشش یکنواخت و بافتی سبک که برای آرایش روزانه و ظاهرهای مینیمال انتخاب شده است.",
  keyFeatures: ["بافت سبک", "پوشش یکنواخت"],
  usage: "محصول را از مرکز لب به سمت گوشه‌ها پخش کنید.",
  priceRial: 18_900_000,
  compareAtPriceRial: 21_000_000,
  images: ["/images/products/velvet-rose.webp"],
  stock: 12,
  isOriginal: true,
  isFeatured: false,
  isPublished: true,
  sortOrder: 20,
};

describe("adminCreateProductSchema", () => {
  it("accepts complete product details used by the storefront", () => {
    expect(adminCreateProductSchema.parse(validProduct)).toEqual(validProduct);
  });

  it("accepts secure external product images", () => {
    expect(
      adminCreateProductSchema.safeParse({
        ...validProduct,
        images: ["https://images.example.com/velvet-rose.webp"],
      }).success,
    ).toBe(true);
  });

  it("rejects duplicate-looking slugs and invalid discount prices", () => {
    const result = adminCreateProductSchema.safeParse({
      ...validProduct,
      slug: "Velvet Rose",
      compareAtPriceRial: validProduct.priceRial,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.slug).toBeDefined();
      expect(errors.compareAtPriceRial).toBeDefined();
    }
  });

  it("rejects Rial prices that cannot be converted to whole tomans", () => {
    const result = adminCreateProductSchema.safeParse({
      ...validProduct,
      priceRial: 1_111,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.priceRial).toBeDefined();
    }
  });

  it("loads legacy records into the editor so an admin can repair them", () => {
    const result = adminProductEditorSchema.safeParse({
      id: "legacy-product",
      name: "محصول قدیمی",
      slug: "",
      brand: "AVELIA",
      category: { id: "makeup", name: "لوازم آرایشی" },
      priceRial: 1_111,
      price: { rial: "۱۱۱۱ ریال", tomanWords: "نیازمند اصلاح" },
      stock: 1,
      isOriginal: true,
      isFeatured: false,
      isPublished: false,
      image: "/images/products/legacy.webp",
      createdAt: new Date().toISOString(),
      shortDescription: "قدیمی",
      description: "قدیمی",
      keyFeatures: [],
      usage: "قدیمی",
      compareAtPriceRial: null,
      images: ["/images/products/legacy.webp"],
      sortOrder: 0,
    });

    expect(result.success).toBe(true);
  });
});
