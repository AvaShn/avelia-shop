import "server-only";

import type { Prisma } from "@/generated/prisma/client";

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
import type { ProductsApiQuery } from "@/features/products/api-types";
import { decodeCursor, encodeCursor } from "@/lib/api/cursor";
import { getPrismaClient } from "@/lib/prisma/client";

async function readProductCollection(): Promise<readonly Product[]> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return fallbackProducts;
  }

  const records = await prisma.product.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return records.map(databaseProductToDomain);
}

export async function listStorefrontProducts(query: CatalogQuery = {}) {
  const collection = await readProductCollection();
  return queryProductCollection(collection, query);
}

export async function listStorefrontProductPage(query: ProductsApiQuery) {
  const cursorId = query.cursor ? decodeCursor(query.cursor) : null;

  if (query.cursor && !cursorId) {
    return { kind: "invalid-cursor" as const };
  }

  const prisma = getPrismaClient();
  if (prisma) {
    const where = {
      isPublished: true,
      ...(query.category ? { categoryId: query.category } : {}),
      ...(query.discount ? { compareAtPriceRial: { not: null } } : {}),
      ...(query.featured === undefined ? {} : { isFeatured: query.featured }),
      ...(query.availability === "in-stock"
        ? { stock: { gt: 0 } }
        : query.availability === "out-of-stock"
          ? { stock: 0 }
          : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" as const } },
              { brand: { contains: query.q, mode: "insensitive" as const } },
              {
                shortDescription: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
              {
                description: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
              { usage: { contains: query.q, mode: "insensitive" as const } },
              {
                category: {
                  name: { contains: query.q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
    } satisfies Prisma.ProductWhereInput;

    if (cursorId) {
      const cursorExists = await prisma.product.findFirst({
        where: { ...where, id: cursorId },
        select: { id: true },
      });
      if (!cursorExists) return { kind: "invalid-cursor" as const };
    }

    const orderBy =
      query.sort === "price-asc"
        ? [{ priceRial: "asc" as const }, { id: "asc" as const }]
        : query.sort === "price-desc"
          ? [{ priceRial: "desc" as const }, { id: "asc" as const }]
          : [{ sortOrder: "asc" as const }, { id: "asc" as const }];
    const [records, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        take: query.limit + 1,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      }),
      prisma.product.count({ where }),
    ]);
    const hasNextPage = records.length > query.limit;
    const page = (hasNextPage ? records.slice(0, query.limit) : records).map(
      databaseProductToDomain,
    );

    return {
      kind: "page" as const,
      products: page,
      total,
      nextCursor:
        hasNextPage && page.length > 0
          ? encodeCursor(page[page.length - 1]!.id)
          : null,
    };
  }

  const collection = await readProductCollection();
  const filtered = queryProductCollection(collection, query);

  const cursorIndex = cursorId
    ? filtered.findIndex((product) => product.id === cursorId)
    : -1;

  if (cursorId && cursorIndex < 0) {
    return { kind: "invalid-cursor" as const };
  }

  const startIndex = cursorIndex + 1;
  const page = filtered.slice(startIndex, startIndex + query.limit);
  const hasNextPage = startIndex + page.length < filtered.length;

  return {
    kind: "page" as const,
    products: page,
    total: filtered.length,
    nextCursor:
      hasNextPage && page.length > 0
        ? encodeCursor(page[page.length - 1]!.id)
        : null,
  };
}

export async function findStorefrontProductBySlug(slug: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return fallbackProducts.find((product) => product.slug === slug);
  }

  const record = await prisma.product.findFirst({
    where: { slug, isPublished: true },
  });
  return record ? databaseProductToDomain(record) : undefined;
}

export async function findStorefrontProductById(id: string) {
  const prisma = getPrismaClient();

  if (!prisma) {
    return fallbackProducts.find((product) => product.id === id);
  }

  const record = await prisma.product.findFirst({
    where: { id, isPublished: true },
  });
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
