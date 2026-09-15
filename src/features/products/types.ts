export const productCategoryIds = ["makeup", "skincare", "fragrance"] as const;

export type ProductCategoryId = (typeof productCategoryIds)[number];

export type ProductCategory = {
  id: ProductCategoryId;
  name: string;
  description: string;
};

export type ProductImage = {
  src: string;
  alt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: ProductCategoryId;
  shortDescription: string;
  description: string;
  keyFeatures: readonly string[];
  usage: string;
  priceRial: number;
  compareAtPriceRial?: number | undefined;
  stock: number;
  isOriginal: boolean;
  isFeatured: boolean;
  sortOrder: number;
  images: readonly ProductImage[];
};

export type ProductCardData = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "brand"
  | "shortDescription"
  | "priceRial"
  | "compareAtPriceRial"
  | "stock"
  | "isOriginal"
> & {
  image: string;
  imageAlt: string;
};

export const productSortIds = ["curated", "price-asc", "price-desc"] as const;

export type ProductSortId = (typeof productSortIds)[number];
