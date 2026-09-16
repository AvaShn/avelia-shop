import type { Metadata } from "next";
import Link from "next/link";

import { CatalogControls } from "@/components/product/catalog-controls";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { normalizeCatalogQuery } from "@/features/products/queries";
import { listStorefrontProducts } from "@/features/products/repository";
import { formatPersianInteger } from "@/lib/i18n/format-number";

export const metadata: Metadata = {
  title: "محصولات آرایشی، مراقبت پوست و عطر",
  description:
    "کاتالوگ منتخب AVELIA؛ مجموعه‌ای از لوازم آرایشی، محصولات مراقبت پوست و عطرهای اصیل.",
  alternates: {
    canonical: "/products",
  },
};

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const parameters = await searchParams;
  const query = normalizeCatalogQuery({
    category: firstValue(parameters.category),
    sort: firstValue(parameters.sort),
    q: firstValue(parameters.q),
    discount: firstValue(parameters.discount),
  });
  const catalogProducts = await listStorefrontProducts(query);

  return (
    <main id="main-content">
      <section className="border-border/70 border-b pt-12 pb-14 sm:pt-18 sm:pb-20 lg:pt-24 lg:pb-24">
        <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <nav aria-label="مسیر صفحه" className="text-muted-foreground text-xs">
            <ol className="flex items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  صفحه اصلی
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground">
                محصولات
              </li>
            </ol>
          </nav>

          <div className="mt-10 grid gap-7 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <p className="text-accent text-sm font-medium tracking-[0.08em]">
                کاتالوگ AVELIA
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl leading-[1.45] font-semibold tracking-[-0.04em] text-balance sm:text-6xl sm:leading-[1.35]">
                انتخابی روشن‌تر در دنیای زیبایی
              </h1>
            </div>
            <p className="text-muted-foreground max-w-xl text-base leading-8 lg:justify-self-end">
              مجموعه‌ای محدود و هدفمند از آرایش، مراقبت پوست و رایحه؛ هر محصول
              با توجه به اصالت، کیفیت و تجربه‌ی استفاده انتخاب شده است.
            </p>
          </div>

          <CatalogControls query={query} />
        </div>
      </section>

      <section className="py-14 sm:py-20 lg:py-28">
        <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <p className="text-muted-foreground mb-9 text-sm" aria-live="polite">
            {formatPersianInteger(catalogProducts.length)} محصول برای نمایش
          </p>

          {catalogProducts.length > 0 ? (
            <ProductGrid products={catalogProducts} />
          ) : (
            <div className="border-border/70 bg-surface mx-auto max-w-2xl rounded-xl border px-6 py-16 text-center sm:px-12">
              <h2 className="text-2xl font-semibold">محصولی پیدا نشد</h2>
              <p className="text-muted-foreground mt-4 leading-8">
                عبارت یا دسته‌بندی دیگری را امتحان کنید؛ شاید انتخاب مناسب شما
                در بخش دیگری از مجموعه باشد.
              </p>
              <Button asChild variant="outline" className="mt-7">
                <Link href="/products">مشاهده همه محصولات</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
