import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import type { ProductCardData } from "@/features/products/types";
import { getDiscountPercentage } from "@/lib/pricing/discount";
import { formatPriceRial } from "@/lib/pricing/format-price";

type ProductCardProps = {
  product: ProductCardData;
  priority?: boolean;
};

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const price = formatPriceRial(product.priceRial);
  const discountPercentage = getDiscountPercentage(
    product.priceRial,
    product.compareAtPriceRial,
  );
  const compareAtPrice =
    discountPercentage > 0 && product.compareAtPriceRial
      ? formatPriceRial(product.compareAtPriceRial)
      : null;

  return (
    <article className="group flex h-full min-w-0 snap-start flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="bg-background relative block aspect-square overflow-hidden rounded-lg focus-visible:outline-offset-4"
        aria-label={`مشاهده ${product.name}`}
      >
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 23vw, (min-width: 640px) 42vw, 78vw"
          className="object-cover transition-transform duration-700 ease-[var(--ease-avelia)] group-hover:scale-[1.035]"
        />
        {product.isOriginal ? (
          <span className="bg-surface/90 text-foreground absolute top-4 right-4 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md">
            تضمین اصالت
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        <p
          dir="ltr"
          className="text-accent line-clamp-1 min-h-5 text-xs font-medium tracking-[0.12em]"
        >
          {product.brand}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="hover:text-accent mt-1.5 line-clamp-2 min-h-14 text-base leading-7 font-semibold transition-colors duration-500"
        >
          {product.name}
        </Link>
        <p className="text-muted-foreground mt-1.5 line-clamp-2 min-h-14 text-sm leading-7">
          {product.shortDescription}
        </p>

        <div className="border-border/70 mt-auto border-t pt-3">
          <div className="mb-1 min-h-5">
            {compareAtPrice ? (
              <p
                className="text-muted-foreground text-xs leading-5 line-through decoration-1"
                dir="rtl"
              >
                {compareAtPrice.rial}
              </p>
            ) : null}
          </div>
          <p className="font-medium" dir="rtl">
            {price.rial}
          </p>
          <p className="text-muted-foreground mt-1 line-clamp-2 min-h-12 text-xs leading-6">
            {price.tomanWords}
          </p>
        </div>

        <AddToCartButton
          productId={product.id}
          productName={product.name}
          isAvailable={product.stock > 0}
        />
        <p
          className={`text-muted-foreground mt-2 min-h-5 text-center text-xs ${
            product.stock > 0 ? "invisible" : ""
          }`}
          aria-hidden={product.stock > 0 ? "true" : undefined}
        >
          این محصول موقتاً ناموجود است.
        </p>
      </div>
    </article>
  );
}
