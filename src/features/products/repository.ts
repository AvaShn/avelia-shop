import "server-only";

import { products as fallbackProducts } from "@/features/products/catalog";
import { databaseProductToDomain } from "@/features/products/database-mapper";
import {
  getDiscountedProductsFromCollection,
  getFeaturedProductsFromCollection,
  getRelatedProductsFromCollection,
  queryProductCollection,
  type CatalogQuery,
} from "@/features/products/queries";
import type { Product } from "@/features/products/types";
import { getPrismaClient } from "@/lib/prisma/client";

async function readProductCollection(): Promise<readonly Product[]> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return fallbackProducts;
  }

  const records = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return records.map(databaseProductToDomain);
}

export async function listStorefrontProducts(query: CatalogQuery = {}) {
  const collection = await readProductCollection();
  return queryProductCollection(collection, query);
}

export async function findStorefrontProductBySlug(slug: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return fallbackProducts.find((product) => product.slug === slug);
  }

  const record = await prisma.product.findUnique({ where: { slug } });
  return record ? databaseProductToDomain(record) : undefined;
}

export async function listFeaturedStorefrontProducts(limit = 4) {
  const collection = await readProductCollection();
  return getFeaturedProductsFromCollection(collection, limit);
}

export async function listDiscountedStorefrontProducts(limit = 4) {
  const collection = await readProductCollection();
  return getDiscountedProductsFromCollection(collection, limit);
}

export async function listRelatedStorefrontProducts(
  product: Product,
  limit = 4,
) {
  const collection = await readProductCollection();
  return getRelatedProductsFromCollection(collection, product, limit);
}
