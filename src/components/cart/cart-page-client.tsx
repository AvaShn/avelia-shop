"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { useCart } from "@/features/cart/cart-provider";
import { maximumCartItemQuantity } from "@/features/cart/schemas";
import { formatPriceRial } from "@/lib/pricing/format-price";

export function CartPageClient() {
  const {
    cart,
    isLoading,
    pendingProductId,
    error,
    updateQuantity,
    removeItem,
  } = useCart();

  if (isLoading) {
    return (
      <main id="main-content">
        <Container className="py-12 sm:py-16">
          <LoadingState label="در حال آماده‌سازی سبد خرید" />
        </Container>
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main id="main-content">
        <Container className="py-16 sm:py-24">
          <section className="bg-surface border-border/70 mx-auto max-w-3xl rounded-xl border px-6 py-16 text-center shadow-sm sm:px-12">
            <span className="bg-accent-soft text-accent-foreground mx-auto flex size-14 items-center justify-center rounded-full">
              <ShoppingBag aria-hidden="true" />
            </span>
            <p className="text-accent mt-7 text-sm font-medium">
              سبد انتخاب‌ها
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
              هنوز محصولی انتخاب نکرده‌اید
            </h1>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl leading-8">
              مجموعه را با آرامش ببینید و محصولاتی را که با نیاز شما هماهنگ‌اند
              به سبد اضافه کنید.
            </p>
            <Button className="mt-8" asChild>
              <Link href="/products">
                مشاهده مجموعه
                <ArrowLeft aria-hidden="true" />
              </Link>
            </Button>
          </section>
        </Container>
      </main>
    );
  }

  const total = formatPriceRial(cart.totalPriceRial);

  return (
    <main id="main-content">
      <Container className="py-10 sm:py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-accent text-sm font-medium">سبد انتخاب‌ها</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            مرور انتخاب‌های شما
          </h1>
          <p className="text-muted-foreground mt-5 leading-8">
            پیش از ادامه، تعداد و جزئیات محصولات را بررسی کنید. قیمت و موجودی
            هنگام ثبت سفارش دوباره از سرور خوانده می‌شود.
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="border-danger/30 bg-danger/5 text-danger mt-8 rounded-lg border px-4 py-3 text-sm"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-16">
          <section aria-label="محصولات سبد" className="space-y-5">
            {cart.items.map((item) => {
              const itemPrice = formatPriceRial(item.lineTotalRial);
              const isPending = pendingProductId === item.product.id;

              return (
                <article
                  key={item.product.id}
                  className="bg-surface border-border/70 grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 rounded-xl border p-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-6 sm:p-5"
                >
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="bg-background relative aspect-square overflow-hidden rounded-lg"
                  >
                    <Image
                      src={item.product.image}
                      alt={item.product.imageAlt}
                      fill
                      unoptimized={item.product.image.startsWith("https://")}
                      sizes="128px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-col">
                    <p
                      dir="ltr"
                      className="text-accent truncate text-xs font-medium tracking-[0.1em]"
                    >
                      {item.product.brand}
                    </p>
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="mt-2 line-clamp-2 leading-7 font-semibold"
                    >
                      {item.product.name}
                    </Link>
                    <p className="mt-3 text-sm font-medium" dir="rtl">
                      {itemPrice.rial}
                    </p>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                      <div
                        className="border-border flex items-center rounded-md border"
                        aria-label={`تعداد ${item.product.name}`}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-10"
                          disabled={isPending || item.quantity <= 1}
                          aria-label={`کاهش تعداد ${item.product.name}`}
                          onClick={() => {
                            void updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                            ).catch(() => undefined);
                          }}
                        >
                          <Minus aria-hidden="true" />
                        </Button>
                        <span className="min-w-10 text-center text-sm font-medium">
                          {new Intl.NumberFormat("fa-IR").format(item.quantity)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-10"
                          disabled={
                            isPending ||
                            item.quantity >= item.product.stock ||
                            item.quantity >= maximumCartItemQuantity
                          }
                          aria-label={`افزایش تعداد ${item.product.name}`}
                          onClick={() => {
                            void updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                            ).catch(() => undefined);
                          }}
                        >
                          <Plus aria-hidden="true" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        className="text-danger hover:text-danger"
                        onClick={() => {
                          void removeItem(item.product.id)
                            .then(() => toast("محصول از سبد حذف شد"))
                            .catch(() => undefined);
                        }}
                      >
                        حذف
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="bg-surface border-border/70 rounded-xl border p-6 shadow-sm lg:sticky lg:top-28">
            <h2 className="text-xl font-semibold">خلاصه سفارش</h2>
            <dl className="border-border/70 mt-6 space-y-4 border-b pb-6 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">تعداد محصولات</dt>
                <dd>{new Intl.NumberFormat("fa-IR").format(cart.itemCount)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">جمع سبد</dt>
                <dd className="font-medium" dir="rtl">
                  {total.rial}
                </dd>
              </div>
            </dl>
            <p className="text-muted-foreground mt-5 text-xs leading-6">
              هزینه ارسال و جزئیات نهایی پیش از ادامه به تلگرام نمایش داده
              می‌شود.
            </p>
            <Button className="mt-6 w-full" size="lg" asChild>
              <Link href="/checkout">
                ادامه ثبت سفارش
                <ArrowLeft aria-hidden="true" />
              </Link>
            </Button>
            <Button className="mt-3 w-full" variant="ghost" asChild>
              <Link href="/products">ادامه مشاهده محصولات</Link>
            </Button>
          </aside>
        </div>
      </Container>
    </main>
  );
}
