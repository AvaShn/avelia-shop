"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, LoaderCircle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { TelegramHandoffButton } from "@/components/checkout/telegram-handoff-button";
import { useCart } from "@/features/cart/cart-provider";
import type {
  CreateOrderApiResponse,
  PublicOrder,
} from "@/features/orders/types";
import { formatPriceRial } from "@/lib/pricing/format-price";

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
};

export function CheckoutPageClient() {
  const { cart, isLoading, refreshCart, clearCartAfterCheckout } = useCart();
  const [customer, setCustomer] = useState<CustomerForm>({
    name: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<PublicOrder | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  if (isLoading) {
    return (
      <main id="main-content">
        <Container className="py-12 sm:py-16">
          <LoadingState label="در حال آماده‌سازی ثبت سفارش" />
        </Container>
      </main>
    );
  }

  if (createdOrder) {
    const total = formatPriceRial(createdOrder.totalPriceRial);

    return (
      <main id="main-content">
        <Container className="py-16 sm:py-24">
          <section className="bg-surface border-border/70 mx-auto max-w-3xl rounded-xl border px-6 py-14 text-center shadow-sm sm:px-12">
            <span className="bg-accent-soft text-accent-foreground mx-auto flex size-16 items-center justify-center rounded-full">
              <CheckCircle2 className="size-7" aria-hidden="true" />
            </span>
            <p className="text-accent mt-7 text-sm font-medium">سفارش ثبت شد</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              انتخاب‌های شما با موفقیت ثبت شدند
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl leading-8">
              مبلغ سفارش {total.rial} است. پرداخت در تلگرام ادامه پیدا می‌کند و
              رسید شما پیش از تأیید نهایی به‌صورت دستی بررسی خواهد شد.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <TelegramHandoffButton orderToken={createdOrder.publicToken} />
              <Button size="lg" variant="outline" asChild>
                <Link href={`/order/${createdOrder.publicToken}`}>
                  مشاهده وضعیت سفارش
                </Link>
              </Button>
            </div>
          </section>
        </Container>
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main id="main-content">
        <Container className="py-16 sm:py-24">
          <section className="bg-surface border-border/70 mx-auto max-w-2xl rounded-xl border px-6 py-14 text-center">
            <h1 className="text-3xl font-semibold">سبد شما خالی است</h1>
            <p className="text-muted-foreground mt-4 leading-8">
              برای ادامه ثبت سفارش، ابتدا محصولی را به سبد اضافه کنید.
            </p>
            <Button className="mt-7" asChild>
              <Link href="/products">مشاهده محصولات</Link>
            </Button>
          </section>
        </Container>
      </main>
    );
  }

  const total = formatPriceRial(cart.totalPriceRial);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    idempotencyKey.current ??= crypto.randomUUID().replaceAll("-", "");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({ customer }),
      });
      const payload = (await response.json()) as CreateOrderApiResponse;

      if (!response.ok || payload.error || !payload.data) {
        const message = payload.error?.message ?? "ثبت سفارش انجام نشد.";
        setError(message);

        if (
          payload.error &&
          (payload.error.code === "STOCK_CHANGED" ||
            payload.error.code === "EMPTY_CART")
        ) {
          await refreshCart().catch(() => undefined);
        }
        return;
      }

      clearCartAfterCheckout();
      setCreatedOrder(payload.data);
    } catch {
      setError("ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main id="main-content">
      <Container className="py-10 sm:py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-accent text-sm font-medium">ثبت سفارش</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            چند قدم تا تکمیل انتخاب
          </h1>
          <p className="text-muted-foreground mt-5 leading-8">
            اطلاعات تماس را وارد کنید. پس از ثبت سفارش، ادامه پرداخت و ارسال
            رسید در تلگرام انجام می‌شود.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-16">
          <form
            onSubmit={(event) => void submitOrder(event)}
            className="bg-surface border-border/70 rounded-xl border p-5 shadow-sm sm:p-8"
          >
            <h2 className="text-xl font-semibold">اطلاعات مشتری</h2>
            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium">
                  نام و نام خانوادگی
                </span>
                <Input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={customer.name}
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium">
                  شماره موبایل
                </span>
                <Input
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  dir="ltr"
                  required
                  placeholder="09121234567"
                  value={customer.phone}
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium">
                  ایمیل <span className="text-muted-foreground">(اختیاری)</span>
                </span>
                <Input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  value={customer.email}
                  onChange={(event) =>
                    setCustomer((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="border-border/70 mt-8 border-t pt-6">
              <h3 className="font-semibold">ادامه پرداخت چگونه است؟</h3>
              <ol className="text-muted-foreground mt-4 space-y-3 text-sm leading-7">
                <li>۱. سفارش و موجودی محصولات برای شما ثبت می‌شود.</li>
                <li>۲. ربات تلگرام جزئیات مبلغ و کارت را نمایش می‌دهد.</li>
                <li>۳. رسید ارسال‌شده به‌صورت دستی بررسی می‌شود.</li>
              </ol>
            </div>

            {error ? (
              <p
                role="alert"
                className="border-danger/30 bg-danger/5 text-danger mt-6 rounded-lg border px-4 py-3 text-sm leading-7"
              >
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="mt-7 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  در حال ثبت امن سفارش
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                </>
              ) : (
                <>
                  ثبت سفارش و ادامه
                  <ArrowLeft aria-hidden="true" />
                </>
              )}
            </Button>
          </form>

          <aside className="bg-surface border-border/70 rounded-xl border p-6 shadow-sm lg:sticky lg:top-28">
            <h2 className="text-xl font-semibold">خلاصه نهایی</h2>
            <ul className="mt-6 space-y-4">
              {cart.items.map((item) => (
                <li
                  key={item.product.id}
                  className="flex items-start justify-between gap-4 text-sm"
                >
                  <span className="line-clamp-2 leading-6">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="shrink-0" dir="rtl">
                    {formatPriceRial(item.lineTotalRial).rial}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-border/70 mt-6 flex items-start justify-between gap-4 border-t pt-6">
              <span className="font-medium">مبلغ قابل پرداخت</span>
              <span className="font-semibold" dir="rtl">
                {total.rial}
              </span>
            </div>
            <p className="text-muted-foreground mt-3 text-xs leading-6">
              مبلغ نهایی در سمت سرور و براساس قیمت روز محصولات محاسبه می‌شود.
            </p>
          </aside>
        </div>
      </Container>
    </main>
  );
}
