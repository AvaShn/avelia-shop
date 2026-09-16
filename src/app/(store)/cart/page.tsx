import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart/cart-page-client";

export const metadata: Metadata = {
  title: "سبد خرید",
  description: "مرور محصولات انتخاب‌شده و ادامه ثبت سفارش در آولیا",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageClient />;
}
