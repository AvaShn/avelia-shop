import { z } from "zod";

import { productCategoryIds, productSortIds } from "@/features/products/types";
import { cursorSchema } from "@/lib/api/cursor";

const booleanQueryValueSchema = z
  .enum(["0", "1", "true", "false"])
  .transform((value) => value === "1" || value === "true");

export const productsApiQuerySchema = z.object({
  category: z.enum(productCategoryIds).optional(),
  sort: z.enum(productSortIds).default("curated"),
  q: z.string().trim().max(80).default(""),
  discount: booleanQueryValueSchema.default(false),
  featured: booleanQueryValueSchema.optional(),
  availability: z.enum(["all", "in-stock", "out-of-stock"]).default("all"),
  cursor: cursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(48).default(24),
});

export type ProductsApiQuery = z.infer<typeof productsApiQuerySchema>;

export const productImageApiSchema = z.object({
  src: z.string().trim().min(1),
  alt: z.string().trim().min(1),
});

export const productApiSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  brand: z.string(),
  categoryId: z.enum(productCategoryIds),
  shortDescription: z.string(),
  description: z.string(),
  keyFeatures: z.array(z.string()),
  usage: z.string(),
  priceRial: z.number().int().nonnegative(),
  compareAtPriceRial: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative(),
  isOriginal: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int(),
  images: z.array(productImageApiSchema).min(1),
});

export const productsApiDataSchema = z.array(productApiSchema);

export const productDetailsApiDataSchema = z.object({
  product: productApiSchema,
  relatedProducts: z.array(productApiSchema),
});

export type ProductApiDto = z.infer<typeof productApiSchema>;
export type ProductsApiData = z.infer<typeof productsApiDataSchema>;
export type ProductDetailsApiData = z.infer<typeof productDetailsApiDataSchema>;

export type ProductsApiMeta = {
  count: number;
  total: number;
  nextCursor: string | null;
  query: Omit<ProductsApiQuery, "cursor">;
};
