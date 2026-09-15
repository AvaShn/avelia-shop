import Link from "next/link";
import { BadgePercent, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { productCategories } from "@/features/products/catalog";
import type { NormalizedCatalogQuery } from "@/features/products/queries";
import type { ProductCategoryId } from "@/features/products/types";
import { cn } from "@/lib/utils/cn";

type CatalogControlsProps = {
  query: NormalizedCatalogQuery;
};

function buildCategoryHref(
  category: ProductCategoryId | undefined,
  discount: boolean,
  query: NormalizedCatalogQuery,
) {
  const parameters = new URLSearchParams();

  if (category) parameters.set("category", category);
  if (query.q) parameters.set("q", query.q);
  if (query.sort !== "curated") parameters.set("sort", query.sort);
  if (discount) parameters.set("discount", "1");

  const search = parameters.toString();
  return search ? `/products?${search}` : "/products";
}

export function CatalogControls({ query }: CatalogControlsProps) {
  const hasFilters = Boolean(
    query.category || query.q || query.sort !== "curated" || query.discount,
  );

  return (
    <div className="border-border/70 border-y py-6 sm:py-8">
      <div className="-mx-5 flex snap-x [scrollbar-width:none] gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        <Link
          href={buildCategoryHref(undefined, false, query)}
          aria-current={!query.category && !query.discount ? "page" : undefined}
          className={cn(
            "border-border flex min-h-11 shrink-0 snap-start items-center rounded-full border px-5 text-sm transition-colors duration-500",
            !query.category && !query.discount
              ? "bg-primary text-primary-foreground border-primary"
              : "hover:border-primary",
          )}
        >
          همه محصولات
        </Link>
        <Link
          href={buildCategoryHref(query.category, true, query)}
          aria-current={query.discount ? "page" : undefined}
          className={cn(
            "border-accent/40 flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border px-5 text-sm transition-colors duration-500",
            query.discount
              ? "border-[#8a6a36] bg-[#8a6a36] text-white"
              : "text-accent hover:border-accent",
          )}
        >
          <BadgePercent aria-hidden="true" className="size-4" />
          تخفیف‌های منتخب
        </Link>
        {productCategories.map((category) => (
          <Link
            key={category.id}
            href={buildCategoryHref(category.id, query.discount, query)}
            aria-current={query.category === category.id ? "page" : undefined}
            className={cn(
              "border-border flex min-h-11 shrink-0 snap-start items-center rounded-full border px-5 text-sm transition-colors duration-500",
              query.category === category.id
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:border-primary",
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>

      <form
        action="/products"
        method="get"
        className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto]"
        aria-label="جست‌وجو و مرتب‌سازی محصولات"
      >
        {query.category ? (
          <input type="hidden" name="category" value={query.category} />
        ) : null}
        {query.discount ? (
          <input type="hidden" name="discount" value="1" />
        ) : null}
        <label className="relative block">
          <span className="sr-only">جست‌وجوی محصول</span>
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2"
          />
          <Input
            type="search"
            name="q"
            defaultValue={query.q}
            placeholder="نام محصول، برند یا دسته‌بندی"
            className="ps-12"
            maxLength={80}
          />
        </label>

        <label className="relative block">
          <span className="sr-only">مرتب‌سازی محصولات</span>
          <SlidersHorizontal
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute start-4 top-1/2 z-10 size-4 -translate-y-1/2"
          />
          <select
            name="sort"
            defaultValue={query.sort}
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/35 min-h-12 w-full appearance-none rounded-md border py-2 ps-11 pe-10 text-sm outline-none focus-visible:ring-2"
          >
            <option value="curated">ترتیب منتخب AVELIA</option>
            <option value="price-asc">کمترین قیمت</option>
            <option value="price-desc">بیشترین قیمت</option>
          </select>
        </label>

        <Button type="submit">اعمال</Button>
      </form>

      {hasFilters ? (
        <Link
          href="/products"
          className="text-muted-foreground hover:text-foreground mt-4 inline-flex min-h-11 items-center gap-2 text-sm transition-colors"
        >
          <X aria-hidden="true" className="size-4" />
          پاک‌کردن فیلترها
        </Link>
      ) : null}
    </div>
  );
}
