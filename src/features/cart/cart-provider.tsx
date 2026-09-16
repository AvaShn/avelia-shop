"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  CartApiErrorResponse,
  CartApiResponse,
  CartView,
} from "@/features/cart/types";
import { emptyCart } from "@/features/cart/types";

type CartContextValue = {
  cart: CartView;
  isLoading: boolean;
  pendingProductId: string | null;
  error: string | null;
  addItem: (productId: string, quantity?: number) => Promise<CartView>;
  updateQuantity: (productId: string, quantity: number) => Promise<CartView>;
  removeItem: (productId: string) => Promise<CartView>;
  refreshCart: () => Promise<CartView>;
  clearCartAfterCheckout: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

async function readResponse(response: Response) {
  const payload = (await response.json()) as
    CartApiResponse | CartApiErrorResponse;

  if (!response.ok || payload.error || !payload.data) {
    throw new Error(
      payload.error
        ? payload.error.message
        : "سبد خرید در حال حاضر در دسترس نیست.",
    );
  }

  return payload.data;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartView>(emptyCart);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    setError(null);
    const response = await fetch("/api/cart", {
      method: "GET",
      cache: "no-store",
    });
    const nextCart = await readResponse(response);
    setCart(nextCart);
    return nextCart;
  }, []);

  useEffect(() => {
    let isActive = true;

    void refreshCart()
      .catch((reason: unknown) => {
        if (isActive) {
          setError(
            reason instanceof Error
              ? reason.message
              : "سبد خرید در حال حاضر در دسترس نیست.",
          );
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [refreshCart]);

  const mutateCart = useCallback(
    async (
      productId: string,
      url: string,
      init: RequestInit,
    ): Promise<CartView> => {
      setPendingProductId(productId);
      setError(null);

      try {
        const response = await fetch(url, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...init.headers,
          },
        });
        const nextCart = await readResponse(response);
        setCart(nextCart);
        return nextCart;
      } catch (reason: unknown) {
        const message =
          reason instanceof Error
            ? reason.message
            : "تغییر سبد خرید انجام نشد.";
        setError(message);
        throw reason;
      } finally {
        setPendingProductId(null);
      }
    },
    [],
  );

  const addItem = useCallback(
    (productId: string, quantity = 1) =>
      mutateCart(productId, "/api/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      }),
    [mutateCart],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) =>
      mutateCart(productId, `/api/cart/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      }),
    [mutateCart],
  );

  const removeItem = useCallback(
    (productId: string) =>
      mutateCart(productId, `/api/cart/${encodeURIComponent(productId)}`, {
        method: "DELETE",
      }),
    [mutateCart],
  );

  const clearCartAfterCheckout = useCallback(() => {
    setCart(emptyCart);
    setError(null);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isLoading,
      pendingProductId,
      error,
      addItem,
      updateQuantity,
      removeItem,
      refreshCart,
      clearCartAfterCheckout,
    }),
    [
      addItem,
      cart,
      clearCartAfterCheckout,
      error,
      isLoading,
      pendingProductId,
      refreshCart,
      removeItem,
      updateQuantity,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return context;
}
