import { describe, expect, it } from "vitest";

import {
  getCatalogProducts,
  getProductBySlug,
  getRelatedProducts,
  normalizeCatalogQuery,
} from "@/features/products/queries";

describe("product catalog queries", () => {
  it("filters products by a valid category and normalizes invalid values", () => {
    expect(getCatalogProducts({ category: "makeup" })).toHaveLength(14);
    expect(
      normalizeCatalogQuery({ category: "unknown", sort: "unknown" }),
    ).toEqual({
      category: undefined,
      sort: "curated",
      q: "",
      discount: false,
    });
  });

  it("filters the catalog to genuine discounted products", () => {
    const discountedProducts = getCatalogProducts({ discount: "1" });

    expect(discountedProducts).toHaveLength(10);
    expect(
      discountedProducts.every(
        (product) =>
          product.compareAtPriceRial !== undefined &&
          product.compareAtPriceRial > product.priceRial,
      ),
    ).toBe(true);
  });

  it("searches Persian content and sorts by price", () => {
    const searchResults = getCatalogProducts({ q: "رژ لب" });
    const sortedResults = getCatalogProducts({ sort: "price-desc" });

    expect(searchResults.map((product) => product.slug)).toContain(
      "satin-lipstick-muted-rose",
    );
    expect(sortedResults[0]?.priceRial).toBeGreaterThanOrEqual(
      sortedResults[1]?.priceRial ?? 0,
    );
  });

  it("returns related products without returning the active product", () => {
    const product = getProductBySlug("daily-rich-cream");
    expect(product).toBeDefined();

    const related = getRelatedProducts(product!);
    expect(related).not.toContainEqual(product);
    expect(related[0]?.categoryId).toBe("skincare");
  });
});
