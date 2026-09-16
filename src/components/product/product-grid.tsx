import { ProductCard } from "@/components/product/product-card";
import { toProductCardData } from "@/features/products/queries";
import type { Product } from "@/features/products/types";

type ProductGridProps = {
  products: readonly Product[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid items-stretch gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-16">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={toProductCardData(product)}
          priority={index < 3}
        />
      ))}
    </div>
  );
}
