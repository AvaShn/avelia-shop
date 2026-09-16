import type { MetadataRoute } from "next";

import { listStorefrontProducts } from "@/features/products/repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();
  const products = await listStorefrontProducts();

  return [
    {
      url: new URL("/", appUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: new URL("/products", appUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...products.map((product) => ({
      url: new URL(`/products/${product.slug}`, appUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
