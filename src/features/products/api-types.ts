import type { NormalizedCatalogQuery } from "@/features/products/queries";
import type { Product } from "@/features/products/types";

export type ProductsApiResponse = {
  data: readonly Product[];
  meta: {
    count: number;
    query: NormalizedCatalogQuery;
  };
};

export type ProductApiResponse = {
  data: Product;
};

export type ApiErrorResponse = {
  error: {
    code: "INVALID_REQUEST" | "NOT_FOUND" | "INTERNAL_ERROR";
    message: string;
  };
};
