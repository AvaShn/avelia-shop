"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  LogIn,
  MapPin,
  PackageCheck,
  Truck,
} from "lucide-react";

import { TelegramHandoffButton } from "@/components/checkout/telegram-handoff-button";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import type { AccountUser } from "@/features/account/schemas";
import { useCart } from "@/features/cart/cart-provider";
import type {
  CreateOrderApiResponse,
  PublicOrder,
} from "@/features/orders/types";
import {
  shippingCostRial,
  shippingMethodLabels,
  type ShippingMethod,
} from "@/features/orders/shipping";
import type { ApiEnvelope } from "@/lib/api/contracts";
import { formatPriceRial } from "@/lib/pricing/format-price";

type CustomerForm = { name: string; phone: string; email: string };
type ShippingAddressForm = {
  city: string;
  addressLine: string;
  postalCode: string;
  plaque: string;
  unit: string;
};

const emptyCustomer: CustomerForm = { name: "", phone: "", email: "" };
const emptyAddress: ShippingAddressForm = {
  city: "",
  addressLine: "",
  postalCode: "",
  plaque: "",
  unit: "",
};

export function CheckoutPageClient() {
  const { cart, isLoading, refreshCart, clearCartAfterCheckout } = useCart();
  const [authState, setAuthState] = useState<
    "checking" | "signed-out" | "signed-in"
  >("checking");
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [shippingAddress, setShippingAddress] =
    useState<ShippingAddressForm>(emptyAddress);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>("POST");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<PublicOrder | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as ApiEnvelope<AccountUser>;
        if (!active) return;
        if (!response.ok || !payload.data) {
          setAuthState("signed-out");
          if (response.status !== 401) {
            setError(payload.error?.message ?? "بررسی حساب انجام نشد.");
          }
          return;
        }
        const user = payload.data;
        setCustomer({
          name: user.name,
          phone: user.phone,
          email: user.email,
        });
        setShippingAddress({
          city: user.defaultAddress.city ?? "",
          addressLine: user.defaultAddress.addressLine ?? "",
          postalCode: user.defaultAddress.postalCode ?? "",
          plaque: user.defaultAddress.plaque ?? "",
          unit: user.defaultAddress.unit ?? "",
        });
        setAuthState("signed-in");
      })
      .catch(() => {
        if (active) {
          setAuthState("signed-out");
          setError("ارتباط با حساب کاربری برقرار نشد.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading || authState === "checking") {
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
            <p className="text-muted-foreground mt-3 text-sm leading-7">
              روش ارسال: {shippingMethodLabels[createdOrder.shippingMethod]}
              {createdOrder.shippingMethod === "TIPAX"
                ? "؛ کرایه تیپاکس هنگام تحویل جداگانه پرداخت می‌شود."
                : "؛ هزینه ارسال در مبلغ سفارش محاسبه شده است."}
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
              برای ادامه ثبت سفارش، ابتدا محصولی به سبد اضافه کنید.
            </p>
            <Button className="mt-7" asChild>
              <Link href="/products">مشاهده محصولات</Link>
            </Button>
          </section>
        </Container>
      </main>
    );
  }

  if (authState === "signed-out") {
    return (
      <main id="main-content">
        <Container className="py-16 sm:py-24">
          <section className="bg-surface border-border/70 mx-auto max-w-2xl rounded-xl border px-6 py-14 text-center shadow-sm sm:px-12">
            <span className="bg-accent-soft text-accent-foreground mx-auto flex size-14 items-center justify-center rounded-full">
              <LogIn aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-3xl font-semibold">
              برای ثبت سفارش وارد حساب شوید
            </h1>
            <p className="text-muted-foreground mt-4 leading-8">
              سبد شما حفظ شده است. وارد حساب شوید یا یک حساب تازه بسازید تا
              نشانی تحویل و سفارش‌ها به‌صورت امن در پروفایل شما ثبت شوند.
            </p>
            {error ? (
              <p className="text-danger mt-4 text-sm" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/login?returnTo=/checkout">ورود به حساب</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register?returnTo=/checkout">ساخت حساب</Link>
              </Button>
            </div>
          </section>
        </Container>
      </main>
    );
  }

  const itemsSubtotal = formatPriceRial(cart.totalPriceRial);
  const selectedShippingCostRial = shippingCostRial(shippingMethod);
  const selectedShippingCost = formatPriceRial(selectedShippingCostRial);
  const payableTotal = formatPriceRial(
    cart.totalPriceRial + selectedShippingCostRial,
  );

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
        body: JSON.stringify({ customer, shippingAddress, shippingMethod }),
      });
      const payload = (await response.json()) as CreateOrderApiResponse;
      if (!response.ok || payload.error || !payload.data) {
        setError(payload.error?.message ?? "ثبت سفارش انجام نشد.");
        if (response.status === 401) setAuthState("signed-out");
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
            اطلاعات گیرنده و نشانی دقیق تحویل را بررسی کنید. این اطلاعات روی
            سفارش ثبت می‌شوند و پرداخت در تلگرام ادامه پیدا می‌کند.
          </p>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-16">
          <form
            onSubmit={(event) => void submitOrder(event)}
            className="bg-surface border-border/70 rounded-xl border p-5 shadow-sm sm:p-8"
          >
            <h2 className="text-xl font-semibold">اطلاعات گیرنده</h2>
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
                <span className="mb-2 block text-sm font-medium">ایمیل</span>
                <Input
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  required
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

            <div className="border-border/70 mt-9 border-t pt-8">
              <div className="flex items-center gap-3">
                <MapPin className="text-accent size-5" aria-hidden="true" />
                <h2 className="text-xl font-semibold">نشانی تحویل</h2>
              </div>
              <div className="mt-7 grid gap-6 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-medium">شهر</span>
                  <Input
                    name="city"
                    autoComplete="address-level2"
                    required
                    minLength={2}
                    maxLength={80}
                    value={shippingAddress.city}
                    onChange={(event) =>
                      setShippingAddress((current) => ({
                        ...current,
                        city: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium">
                    کد پستی
                  </span>
                  <Input
                    name="postalCode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    dir="ltr"
                    required
                    minLength={10}
                    maxLength={12}
                    placeholder="1234567890"
                    value={shippingAddress.postalCode}
                    onChange={(event) =>
                      setShippingAddress((current) => ({
                        ...current,
                        postalCode: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">
                    نشانی کامل
                  </span>
                  <textarea
                    name="addressLine"
                    autoComplete="street-address"
                    required
                    minLength={8}
                    maxLength={500}
                    rows={4}
                    value={shippingAddress.addressLine}
                    onChange={(event) =>
                      setShippingAddress((current) => ({
                        ...current,
                        addressLine: event.target.value,
                      }))
                    }
                    className="border-border bg-surface focus-visible:border-accent focus-visible:ring-accent/20 w-full resize-y rounded-md border px-4 py-3 text-sm leading-7 outline-none focus-visible:ring-4"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium">پلاک</span>
                  <Input
                    name="plaque"
                    inputMode="numeric"
                    required
                    maxLength={20}
                    value={shippingAddress.plaque}
                    onChange={(event) =>
                      setShippingAddress((current) => ({
                        ...current,
                        plaque: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium">
                    واحد{" "}
                    <span className="text-muted-foreground">(اختیاری)</span>
                  </span>
                  <Input
                    name="unit"
                    inputMode="numeric"
                    maxLength={20}
                    value={shippingAddress.unit}
                    onChange={(event) =>
                      setShippingAddress((current) => ({
                        ...current,
                        unit: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="border-border/70 mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold">روش ارسال</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    shippingMethod === "POST"
                      ? "border-accent bg-accent-soft"
                      : "border-border/70 bg-surface hover:border-accent/50"
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="POST"
                      checked={shippingMethod === "POST"}
                      onChange={() => setShippingMethod("POST")}
                      className="accent-accent mt-1 size-4"
                    />
                    <span>
                      <span className="flex items-center gap-2 font-medium">
                        <PackageCheck
                          className="text-accent size-5"
                          aria-hidden="true"
                        />
                        پست پیشتاز
                      </span>
                      <span className="text-muted-foreground mt-2 block text-sm leading-6">
                        ۱۵۰ هزار تومان به مبلغ سفارش اضافه می‌شود.
                      </span>
                    </span>
                  </span>
                </label>
                <label
                  className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                    shippingMethod === "TIPAX"
                      ? "border-accent bg-accent-soft"
                      : "border-border/70 bg-surface hover:border-accent/50"
                  }`}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="TIPAX"
                      checked={shippingMethod === "TIPAX"}
                      onChange={() => setShippingMethod("TIPAX")}
                      className="accent-accent mt-1 size-4"
                    />
                    <span>
                      <span className="flex items-center gap-2 font-medium">
                        <Truck
                          className="text-accent size-5"
                          aria-hidden="true"
                        />
                        تیپاکس
                      </span>
                      <span className="text-muted-foreground mt-2 block text-sm leading-6">
                        کرایه براساس مقصد، هنگام تحویل درب منزل پرداخت می‌شود.
                      </span>
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="border-border/70 mt-8 border-t pt-6">
              <h3 className="font-semibold">ادامه پرداخت چگونه است؟</h3>
              <ol className="text-muted-foreground mt-4 space-y-3 text-sm leading-7">
                <li>۱. سفارش، نشانی و موجودی محصولات ثبت می‌شود.</li>
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
                  <span>در حال ثبت امن سفارش</span>
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                </>
              ) : (
                <>
                  <span>ثبت سفارش و ادامه</span>
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
            <dl className="border-border/70 mt-6 space-y-3 border-t pt-6 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">جمع محصولات</dt>
                <dd dir="rtl">{itemsSubtotal.rial}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">هزینه ارسال</dt>
                <dd className="text-left" dir="rtl">
                  {shippingMethod === "POST"
                    ? selectedShippingCost.rial
                    : "پرداخت درب منزل"}
                </dd>
              </div>
              <div className="border-border/70 flex items-start justify-between gap-4 border-t pt-4 text-base">
                <dt className="font-medium">مبلغ قابل پرداخت</dt>
                <dd className="font-semibold" dir="rtl">
                  {payableTotal.rial}
                </dd>
              </div>
            </dl>
            <p className="text-muted-foreground mt-3 text-xs leading-6">
              مبلغ نهایی محصولات و هزینه ارسال در سمت سرور دوباره محاسبه می‌شود.
            </p>
          </aside>
        </div>
      </Container>
    </main>
  );
}
