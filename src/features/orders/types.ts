export type PublicOrderStatus =
  "PENDING_PAYMENT" | "WAITING_REVIEW" | "PAID" | "REJECTED";

export type PublicPaymentStatus =
  "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export type PublicOrderItem = {
  product: {
    slug: string;
    name: string;
    image: string;
    imageAlt: string;
  };
  quantity: number;
  unitPriceRial: number;
  lineTotalRial: number;
};

export type PublicOrder = {
  publicToken: string;
  status: PublicOrderStatus;
  paymentStatus: PublicPaymentStatus;
  totalPriceRial: number;
  items: PublicOrderItem[];
  inventoryReservationExpiresAt: string;
  createdAt: string;
};

export type CreateOrderApiResponse = {
  data: PublicOrder & {
    telegramUrl?: string;
  };
};

export type OrderApiResponse = {
  data: PublicOrder;
};

export type OrderApiErrorCode =
  | "INVALID_REQUEST"
  | "EMPTY_CART"
  | "STOCK_CHANGED"
  | "ORDER_NOT_FOUND"
  | "DATABASE_UNAVAILABLE"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR";

export type OrderApiErrorResponse = {
  error: {
    code: OrderApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};
