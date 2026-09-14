import type { Metadata } from "next";

import { BrandStorySection } from "@/components/home/brand-story-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedProductsSection } from "@/components/home/featured-products-section";
import { HeroSection } from "@/components/home/hero-section";
import { TrustSection } from "@/components/home/trust-section";

export const metadata: Metadata = {
  title: "انتخاب‌هایی برای کسانی که به جزئیات اهمیت می‌دهند",
  description:
    "AVELIA مجموعه‌ای گزیده از محصولات اصیل برای تجربه‌ای آرام، دقیق و قابل اعتماد.",
};

export default function HomePage() {
  return (
    <main id="main-content" className="overflow-hidden">
      <HeroSection />
      <CategoriesSection />
      <FeaturedProductsSection />
      <BrandStorySection />
      <TrustSection />
    </main>
  );
}
