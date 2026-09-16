import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SectionHeading } from "@/components/home/section-heading";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { toProductCardData } from "@/features/products/queries";
import { listDiscountedStorefrontProducts } from "@/features/products/repository";

export async function OffersSection() {
  const discountedProducts = (await listDiscountedStorefrontProducts()).map(
    toProductCardData,
  );

  return (
    <section
      id="offers"
      className="border-border/70 border-b bg-[#f2ebe0] py-20 sm:py-28 lg:py-36"
    >
      <Container>
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <SectionHeading
                eyebrow="فرصت‌های منتخب"
                title="انتخاب‌های ویژه، برای زمانی محدود"
                description="تخفیف در AVELIA به معنای انتخاب بیشتر نیست؛ مجموعه‌ای محدود از محصولات اصیل است که اکنون با قیمت ویژه در دسترس‌اند."
              />
            </div>
            <Button asChild className="hidden lg:inline-flex">
              <Link href="/products?discount=1">
                مشاهده همه تخفیف‌ها
                <ArrowLeft aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="-mx-5 mt-12 grid snap-x snap-mandatory [scrollbar-width:none] auto-cols-[78%] grid-flow-col items-stretch gap-4 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:auto-cols-[42%] sm:px-8 lg:mx-0 lg:grid-flow-row lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
            {discountedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <Button asChild className="mt-8 w-full lg:hidden">
            <Link href="/products?discount=1">
              مشاهده همه تخفیف‌ها
              <ArrowLeft aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
