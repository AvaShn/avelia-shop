import type { Metadata } from "next";

import { BrandStorySection } from "@/components/home/brand-story-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProductsSection } from "@/components/home/featured-products-section";
import { HeroSection } from "@/components/home/hero-section";
import { OffersSection } from "@/components/home/offers-section";
import { TrustSection } from "@/components/home/trust-section";

export const metadata: Metadata = {
  title: "فروشگاه آنلاین لوازم آرایشی، مراقبت پوست و عطر اصل",
  description:
    "AVELIA مجموعه‌ای گزیده از لوازم آرایشی، محصولات مراقبت پوست و عطرهای اصیل برای انتخابی دقیق و قابل اعتماد.",
};

export default function HomePage() {
  return (
    <main id="main-content" className="overflow-hidden">
      <HeroSection />
      <CategoriesSection />
      <FeaturedProductsSection />
      <OffersSection />
      <BrandStorySection />
      <TrustSection />
    </main>
  );
}
