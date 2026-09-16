export type CheckoutCartLine = {
  productId: string;
  quantity: number;
};

export type CheckoutProductPrice = {
  id: string;
  priceRial: bigint;
  stock: number;
  isPublished: boolean;
};

export class CheckoutPricingError extends Error {
  constructor(public readonly code: "PRODUCT_UNAVAILABLE" | "OUT_OF_STOCK") {
    super(code);
    this.name = "CheckoutPricingError";
  }
}

export function createCheckoutPricingSnapshot(
  cartLines: readonly CheckoutCartLine[],
  products: readonly CheckoutProductPrice[],
) {
  const productsById = new Map(
    products.map((product) => [product.id, product]),
  );
  const lines = cartLines.map((cartLine) => {
    const product = productsById.get(cartLine.productId);

    if (!product?.isPublished) {
      throw new CheckoutPricingError("PRODUCT_UNAVAILABLE");
    }
    if (cartLine.quantity > product.stock) {
      throw new CheckoutPricingError("OUT_OF_STOCK");
    }

    return {
      productId: product.id,
      quantity: cartLine.quantity,
      unitPriceRial: product.priceRial,
      lineTotalRial: product.priceRial * BigInt(cartLine.quantity),
    };
  });

  return {
    lines,
    totalPriceRial: lines.reduce(
      (total, line) => total + line.lineTotalRial,
      0n,
    ),
  };
}
