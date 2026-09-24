import type { MetadataRoute } from "next";

import { listStorefrontProducts } from "@/features/products/repository";

// Product URLs come from PostgreSQL and can change without a deployment.
// Generate the sitemap on demand instead of requiring database access during
// the Vercel build.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = new Date();
  const products = await listStorefrontProducts();

  const staticPages: MetadataRoute.Sitemap = [
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
    {
      url: new URL("/contact", appUrl).toString(),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: new URL("/social", appUrl).toString(),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: new URL("/policies/privacy", appUrl).toString(),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: new URL("/policies/terms", appUrl).toString(),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  return [
    ...staticPages,
    ...products.map((product) => ({
      url: new URL(`/products/${product.slug}`, appUrl).toString(),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
