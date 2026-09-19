import { z } from "zod";

import { productCategoryIds, type Product } from "@/features/products/types";

const productImagePathsSchema = z.array(z.string().trim().min(1)).min(1);

const productCategorySchema = z.enum(productCategoryIds);

export type DatabaseProductRecord = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  keyFeatures: readonly string[];
  usage: string;
  priceRial: bigint;
  compareAtPriceRial: bigint | null;
  stock: number;
  isOriginal: boolean;
  isFeatured: boolean;
  sortOrder: number;
  images: unknown;
};

function bigintToSafeNumber(value: bigint, fieldName: string) {
  const numberValue = Number(value);

  if (!Number.isSafeInteger(numberValue)) {
    throw new RangeError(
      `${fieldName} exceeds JavaScript's safe integer range.`,
    );
  }

  return numberValue;
}

export function databaseProductToDomain(
  record: DatabaseProductRecord,
): Product {
  const imagePaths = productImagePathsSchema.parse(record.images);

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    brand: record.brand,
    categoryId: productCategorySchema.parse(record.categoryId),
    shortDescription: record.shortDescription,
    description: record.description,
    keyFeatures: [...record.keyFeatures],
    usage: record.usage,
    priceRial: bigintToSafeNumber(record.priceRial, "priceRial"),
    compareAtPriceRial:
      record.compareAtPriceRial === null
        ? undefined
        : bigintToSafeNumber(record.compareAtPriceRial, "compareAtPriceRial"),
    stock: record.stock,
    isOriginal: record.isOriginal,
    isFeatured: record.isFeatured,
    sortOrder: record.sortOrder,
    images: imagePaths.map((src, index) => ({
      src,
      alt:
        index === 0
          ? `تصویر ${record.name}`
          : `تصویر ${index + 1} از ${record.name}`,
    })),
  };
}
