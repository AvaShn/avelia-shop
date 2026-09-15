import Image from "next/image";
import Link from "next/link";

import { PreviewAddToSelection } from "@/components/product/preview-add-to-selection";
import type { ProductCardData } from "@/features/products/types";
import { formatPersianInteger } from "@/lib/i18n/format-number";
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
    <article className="group min-w-0 snap-start">
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
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 84vw"
          className="object-cover transition-transform duration-700 ease-[var(--ease-avelia)] group-hover:scale-[1.035]"
        />
        {product.isOriginal ? (
          <span className="bg-surface/90 text-foreground absolute top-4 right-4 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md">
            تضمین اصالت
          </span>
        ) : null}
        {discountPercentage > 0 ? (
          <span className="absolute top-4 left-4 rounded-full bg-[#7a3045] px-3 py-1.5 text-xs font-medium text-white shadow-sm">
            ٪{formatPersianInteger(discountPercentage)} تخفیف
          </span>
        ) : null}
      </Link>

      <div className="pt-5">
        <p
          dir="ltr"
          className="text-accent text-xs font-medium tracking-[0.12em]"
        >
          {product.brand}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="hover:text-accent mt-2 block text-lg font-semibold transition-colors duration-500"
        >
          {product.name}
        </Link>
        <p className="text-muted-foreground mt-2 min-h-14 text-sm leading-7">
          {product.shortDescription}
        </p>

        <div className="border-border/70 mt-4 border-t pt-4">
          {compareAtPrice ? (
            <p
              className="text-muted-foreground mb-1 text-xs line-through decoration-1"
              dir="rtl"
            >
              {compareAtPrice.rial}
            </p>
          ) : null}
          <p className="font-medium" dir="rtl">
            {price.rial}
          </p>
          <p className="text-muted-foreground mt-1 min-h-6 text-xs leading-6">
            {price.tomanWords}
          </p>
        </div>

        <PreviewAddToSelection
          productName={product.name}
          isAvailable={product.stock > 0}
        />
        {product.stock === 0 ? (
          <p className="text-muted-foreground mt-3 text-center text-xs">
            این محصول موقتاً ناموجود است.
          </p>
        ) : null}
      </div>
    </article>
  );
}
