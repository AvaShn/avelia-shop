import type { Metadata } from "next";

import { CheckoutPageClient } from "@/components/checkout/checkout-page-client";

export const metadata: Metadata = {
  title: "ثبت سفارش",
  description: "ثبت اطلاعات مشتری و ادامه پرداخت امن سفارش آولیا در تلگرام",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
