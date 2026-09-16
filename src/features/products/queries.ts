import { productCategories, products } from "@/features/products/catalog";
import {
  productCategoryIds,
  productSortIds,
  type Product,
  type ProductCardData,
  type ProductCategoryId,
  type ProductSortId,
} from "@/features/products/types";
import { hasDiscount } from "@/lib/pricing/discount";

export type CatalogQuery = {
  category?: string | undefined;
  sort?: string | undefined;
  q?: string | undefined;
  discount?: string | boolean | undefined;
};

export type NormalizedCatalogQuery = {
  category: ProductCategoryId | undefined;
  sort: ProductSortId;
  q: string;
  discount: boolean;
};

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFKC")
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک")
    .trim()
    .toLocaleLowerCase("fa-IR");
}

export function normalizeCatalogQuery(
  query: CatalogQuery,
): NormalizedCatalogQuery {
  const category = productCategoryIds.includes(
    query.category as ProductCategoryId,
  )
    ? (query.category as ProductCategoryId)
    : undefined;
  const sort = productSortIds.includes(query.sort as ProductSortId)
    ? (query.sort as ProductSortId)
    : "curated";

  return {
    category,
    sort,
    q: normalizeSearchText(query.q ?? "").slice(0, 80),
    discount: query.discount === true || query.discount === "1",
  };
}

export function toProductCardData(product: Product): ProductCardData {
  const primaryImage = product.images[0];

  if (!primaryImage) {
    throw new Error(`Product ${product.slug} does not have a primary image.`);
  }

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    shortDescription: product.shortDescription,
    priceRial: product.priceRial,
    compareAtPriceRial: product.compareAtPriceRial,
    stock: product.stock,
    isOriginal: product.isOriginal,
    image: primaryImage.src,
    imageAlt: primaryImage.alt,
  };
}

export function queryProductCollection(
  collection: readonly Product[],
  query: CatalogQuery = {},
) {
  const normalized = normalizeCatalogQuery(query);
  const search = normalized.q;

  const filtered = collection.filter((product) => {
    if (normalized.category && product.categoryId !== normalized.category) {
      return false;
    }

    if (
      normalized.discount &&
      !hasDiscount(product.priceRial, product.compareAtPriceRial)
    ) {
      return false;
    }

    if (!search) {
      return true;
    }

    const category = getProductCategory(product.categoryId);
    const searchableContent = normalizeSearchText(
      [
        product.name,
        product.brand,
        product.shortDescription,
        product.description,
        category?.name ?? "",
        ...product.keyFeatures,
      ].join(" "),
    );

    return searchableContent.includes(search);
  });

  return [...filtered].sort((first, second) => {
    if (normalized.sort === "price-asc") {
      return first.priceRial - second.priceRial;
    }

    if (normalized.sort === "price-desc") {
      return second.priceRial - first.priceRial;
    }

    return first.sortOrder - second.sortOrder;
  });
}

export function getCatalogProducts(query: CatalogQuery = {}) {
  return queryProductCollection(products, query);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductCategory(categoryId: ProductCategoryId) {
  return productCategories.find((category) => category.id === categoryId);
}

export function getFeaturedProducts(limit = 4) {
  return getFeaturedProductsFromCollection(products, limit);
}

export function getFeaturedProductsFromCollection(
  collection: readonly Product[],
  limit = 4,
) {
  return collection
    .filter((product) => product.isFeatured && product.stock > 0)
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .slice(0, limit);
}

export function getDiscountedProducts(limit = 4) {
  return getDiscountedProductsFromCollection(products, limit);
}

export function getDiscountedProductsFromCollection(
  collection: readonly Product[],
  limit = 4,
) {
  return collection
    .filter(
      (product) =>
        product.stock > 0 &&
        hasDiscount(product.priceRial, product.compareAtPriceRial),
    )
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .slice(0, limit);
}

export function getRelatedProducts(product: Product, limit = 4) {
  return getRelatedProductsFromCollection(products, product, limit);
}

export function getRelatedProductsFromCollection(
  collection: readonly Product[],
  product: Product,
  limit = 4,
) {
  const byCuratedOrder = (first: Product, second: Product) =>
    first.sortOrder - second.sortOrder;
  const sameCategory = collection
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.categoryId === product.categoryId,
    )
    .sort(byCuratedOrder);
  const otherCategories = collection
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.categoryId !== product.categoryId,
    )
    .sort(byCuratedOrder);

  return [...sameCategory, ...otherCategories].slice(0, limit);
}
