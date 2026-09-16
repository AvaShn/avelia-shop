import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PreviewAddToSelection } from "@/components/product/preview-add-to-selection";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductGrid } from "@/components/product/product-grid";
import { products } from "@/features/products/catalog";
import { getProductCategory } from "@/features/products/queries";
import {
  findStorefrontProductBySlug,
  listRelatedStorefrontProducts,
} from "@/features/products/repository";
import { formatPersianInteger } from "@/lib/i18n/format-number";
import { getDiscountPercentage } from "@/lib/pricing/discount";
import { formatPriceRial } from "@/lib/pricing/format-price";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await findStorefrontProductBySlug(slug);

  if (!product) {
    return { title: "محصول پیدا نشد" };
  }

  return {
    title: product.name,
    description: product.shortDescription,
    alternates: {
      canonical: `/products/${product.slug}`,
    },
    openGraph: {
      type: "website",
      title: `${product.name} | AVELIA`,
      description: product.shortDescription,
      images: product.images.slice(0, 1).map((image) => ({
        url: image.src,
        alt: image.alt,
      })),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await findStorefrontProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const category = getProductCategory(product.categoryId);
  const price = formatPriceRial(product.priceRial);
  const discountPercentage = getDiscountPercentage(
    product.priceRial,
    product.compareAtPriceRial,
  );
  const compareAtPrice =
    discountPercentage > 0 && product.compareAtPriceRial
      ? formatPriceRial(product.compareAtPriceRial)
      : null;
  const relatedProducts = await listRelatedStorefrontProducts(product, 3);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((image) => new URL(image.src, appUrl).toString()),
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: new URL(`/products/${product.slug}`, appUrl).toString(),
      priceCurrency: "IRR",
      price: product.priceRial,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />

      <Container className="py-10 sm:py-14 lg:py-20">
        <nav aria-label="مسیر صفحه" className="text-muted-foreground text-xs">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                صفحه اصلی
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/products"
                className="hover:text-foreground transition-colors"
              >
                محصولات
              </Link>
            </li>
            {category ? (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/products?category=${category.id}`}
                    className="hover:text-foreground transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              {product.name}
            </li>
          </ol>
        </nav>

        <section className="mt-9 grid gap-12 lg:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.82fr)] lg:items-start lg:gap-16 xl:gap-24">
          <ProductGallery images={product.images} productName={product.name} />

          <div className="lg:sticky lg:top-28">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {category ? (
                <Link
                  href={`/products?category=${category.id}`}
                  className="text-accent font-medium"
                >
                  {category.name}
                </Link>
              ) : null}
              <span className="text-muted-foreground" dir="ltr">
                {product.brand}
              </span>
            </div>

            <h1 className="mt-5 text-4xl leading-[1.45] font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
              {product.name}
            </h1>
            <p className="text-muted-foreground mt-5 text-base leading-8">
              {product.shortDescription}
            </p>

            {product.isOriginal ? (
              <div className="border-border/70 mt-7 flex items-center gap-3 border-y py-4 text-sm">
                <ShieldCheck
                  aria-hidden="true"
                  className="text-accent size-5"
                  strokeWidth={1.5}
                />
                <span>
                  اصالت این محصول پیش از ورود به مجموعه بررسی شده است.
                </span>
              </div>
            ) : null}

            <div className="mt-8">
              {compareAtPrice ? (
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <p
                    className="text-muted-foreground text-sm line-through"
                    dir="rtl"
                  >
                    {compareAtPrice.rial}
                  </p>
                  <span className="rounded-full bg-[#7a3045] px-3 py-1 text-xs font-medium text-white">
                    ٪{formatPersianInteger(discountPercentage)} تخفیف
                  </span>
                </div>
              ) : null}
              <p className="text-2xl font-semibold" dir="rtl">
                {price.rial}
              </p>
              <p className="text-muted-foreground mt-2 text-sm leading-7">
                {price.tomanWords}
              </p>
            </div>

            <p className="text-muted-foreground mt-6 text-sm">
              {product.stock > 0 ? "موجود و آماده‌ی انتخاب" : "موقتاً ناموجود"}
            </p>
            <PreviewAddToSelection
              productName={product.name}
              isAvailable={product.stock > 0}
              className="mt-5 min-h-14 w-full"
            />
            <p className="text-muted-foreground mt-4 text-center text-xs leading-6">
              ثبت نهایی سفارش و ادامه‌ی پرداخت در فاز خرید فعال می‌شود.
            </p>
          </div>
        </section>

        <section className="border-border/70 mt-20 grid gap-12 border-t pt-14 sm:mt-28 sm:pt-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="text-accent text-sm font-medium">درباره محصول</p>
            <h2 className="mt-4 text-3xl leading-[1.5] font-semibold">
              تجربه‌ای که با جزئیات ساخته شده
            </h2>
          </div>
          <div>
            <p className="text-muted-foreground text-base leading-9">
              {product.description}
            </p>

            <h3 className="mt-10 text-lg font-semibold">ویژگی‌های کلیدی</h3>
            <ul className="mt-5 space-y-4">
              {product.keyFeatures.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 text-sm leading-7"
                >
                  <Check
                    aria-hidden="true"
                    className="text-accent mt-1 size-4 shrink-0"
                  />
                  {feature}
                </li>
              ))}
            </ul>

            <h3 className="mt-10 text-lg font-semibold">روش استفاده</h3>
            <p className="text-muted-foreground mt-4 text-sm leading-8">
              {product.usage}
            </p>
          </div>
        </section>
      </Container>

      <section className="bg-surface border-border/70 border-t py-20 sm:py-28">
        <Container>
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="text-accent text-sm font-medium">ادامه‌ی انتخاب</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                محصولات مرتبط
              </h2>
            </div>
            <Link
              href="/products"
              className="text-muted-foreground hover:text-foreground hidden min-h-11 items-center text-sm transition-colors sm:flex"
            >
              مشاهده همه محصولات
            </Link>
          </div>
          <ProductGrid products={relatedProducts} />
        </Container>
      </section>
    </main>
  );
}
