export function getDiscountPercentage(
  priceRial: number,
  compareAtPriceRial?: number,
) {
  if (
    !Number.isFinite(priceRial) ||
    !Number.isFinite(compareAtPriceRial) ||
    priceRial < 0 ||
    !compareAtPriceRial ||
    compareAtPriceRial <= priceRial
  ) {
    return 0;
  }

  return Math.round((1 - priceRial / compareAtPriceRial) * 100);
}

export function hasDiscount(priceRial: number, compareAtPriceRial?: number) {
  return getDiscountPercentage(priceRial, compareAtPriceRial) > 0;
}
