import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SectionHeading } from "@/components/home/section-heading";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import { featuredProducts } from "@/features/home/content";

export function FeaturedProductsSection() {
  return (
    <section
      id="featured-products"
      className="bg-surface border-border/70 border-y py-20 sm:py-28 lg:py-36"
    >
      <Container>
        <Reveal>
          <div className="flex items-end justify-between gap-8">
            <SectionHeading
              eyebrow="انتخاب‌های این فصل"
              title="محصولاتی که ارزش ماندن دارند"
              description="هر محصول با توجه به کیفیت، اصالت و تجربه‌ای که می‌سازد وارد این مجموعه شده است."
            />
            <Link
              href="/products"
              className="text-muted-foreground hover:text-foreground hidden min-h-11 shrink-0 items-center gap-2 text-sm font-medium transition-colors duration-500 sm:flex"
            >
              مشاهده همه
              <ArrowLeft aria-hidden="true" className="size-4" />
            </Link>
          </div>

          <div className="-mx-5 mt-12 grid snap-x snap-mandatory [scrollbar-width:none] auto-cols-[84%] grid-flow-col gap-4 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:auto-cols-[45%] sm:px-8 lg:mx-0 lg:grid-flow-row lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index === 0}
              />
            ))}
          </div>

          <Link
            href="/products"
            className="border-border mt-8 flex min-h-12 items-center justify-center gap-2 border-y text-sm font-medium sm:hidden"
          >
            مشاهده همه محصولات
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
