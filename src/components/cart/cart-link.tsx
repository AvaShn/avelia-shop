"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/cart-provider";
import { formatPersianInteger } from "@/lib/i18n/format-number";

export function CartLink() {
  const { cart, isLoading } = useCart();
  const label = isLoading
    ? "سبد خرید"
    : `سبد خرید، ${formatPersianInteger(cart.itemCount)} محصول`;

  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/cart" aria-label={label} className="relative">
        <ShoppingBag aria-hidden="true" />
        {cart.itemCount > 0 ? (
          <span className="bg-accent text-accent-foreground absolute -top-0.5 -left-0.5 flex size-5 items-center justify-center rounded-full text-[0.65rem] font-semibold">
            {formatPersianInteger(cart.itemCount)}
          </span>
        ) : null}
        <span className="sr-only">{label}</span>
      </Link>
    </Button>
  );
}
