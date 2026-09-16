import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnvironment } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";
import { productCategories, products } from "../src/features/products/catalog";

loadEnvironment({ path: ".env.local" });
loadEnvironment();

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Set DIRECT_URL or DATABASE_URL before running the AVELIA database seed.",
  );
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const categoryImages = {
  makeup: "/images/home/category-makeup-v2.webp",
  skincare: "/images/home/category-skincare.webp",
  fragrance: "/images/home/category-fragrance.webp",
} as const;

async function seed() {
  for (const category of productCategories) {
    await prisma.category.upsert({
      where: { slug: category.id },
      create: {
        id: category.id,
        name: category.name,
        slug: category.id,
        image: categoryImages[category.id],
      },
      update: {
        name: category.name,
        image: categoryImages[category.id],
      },
    });
  }

  for (const product of products) {
    const data = {
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      brand: product.brand,
      priceRial: BigInt(product.priceRial),
      compareAtPriceRial:
        product.compareAtPriceRial === undefined
          ? null
          : BigInt(product.compareAtPriceRial),
      images: product.images.map((image) => ({ ...image })),
      keyFeatures: [...product.keyFeatures],
      usage: product.usage,
      stock: product.stock,
      isOriginal: product.isOriginal,
      isFeatured: product.isFeatured,
      isPublished: true,
      sortOrder: product.sortOrder,
      categoryId: product.categoryId,
    };

    await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        id: product.id,
        slug: product.slug,
        ...data,
      },
      update: data,
    });
  }

  console.info(
    `AVELIA database seeded with ${productCategories.length} categories and ${products.length} products.`,
  );
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
