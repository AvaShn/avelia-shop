export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  imageAlt: string;
  priceRial: number;
  stock: number;
};

export type CartItemView = {
  product: CartProduct;
  quantity: number;
  lineTotalRial: number;
};

export type CartView = {
  items: CartItemView[];
  itemCount: number;
  totalPriceRial: number;
};

export type CartApiResponse = {
  data: CartView;
};

export type CartApiErrorCode =
  | "INVALID_REQUEST"
  | "PRODUCT_NOT_FOUND"
  | "OUT_OF_STOCK"
  | "CART_NOT_FOUND"
  | "INTERNAL_ERROR";

export type CartApiErrorResponse = {
  error: {
    code: CartApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

export type StoredCartItem = {
  productId: string;
  quantity: number;
};

export const emptyCart: CartView = {
  items: [],
  itemCount: 0,
  totalPriceRial: 0,
};
