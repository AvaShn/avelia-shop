"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  LoaderCircle,
  LogOut,
  MapPin,
  PackageSearch,
  UserRound,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import type {
  AccountOrderSummary,
  AccountUser,
} from "@/features/account/schemas";
import type { ApiEnvelope } from "@/lib/api/contracts";
import { formatPersianInteger } from "@/lib/i18n/format-number";
import { shippingMethodLabels } from "@/features/orders/shipping";

const orderLabels = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  WAITING_REVIEW: "در حال بررسی رسید",
  PAID: "پرداخت تأیید شده",
  REJECTED: "تأیید نشده",
} as const;

type OrdersMeta = { count: number; total: number; nextCursor: string | null };

export function AccountPageClient() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [orders, setOrders] = useState<AccountOrderSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "signed-out" | "ready">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const loadOrders = useCallback(async (cursor?: string) => {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const response = await fetch(`/api/account/orders${query}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as ApiEnvelope<
      AccountOrderSummary[],
      OrdersMeta
    >;
    if (!response.ok || !payload.data)
      throw new Error(payload.error?.message ?? "دریافت سفارش‌ها انجام نشد.");
    setOrders((current) =>
      cursor ? [...current, ...payload.data] : payload.data,
    );
    setNextCursor(payload.meta.nextCursor ?? null);
    setTotal(payload.meta.total ?? payload.data.length);
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as ApiEnvelope<AccountUser>;
        if (!active) return;
        if (!response.ok || !payload.data) {
          setState("signed-out");
          return;
        }
        setUser(payload.data);
        await loadOrders();
        if (active) setState("ready");
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "دریافت حساب انجام نشد.",
          );
          setState("signed-out");
        }
      });
    return () => {
      active = false;
    };
  }, [loadOrders]);

  async function logout() {
    setIsBusy(true);
    await fetch("/api/auth/session", { method: "DELETE" }).catch(
      () => undefined,
    );
    window.location.assign("/");
  }

  if (state === "loading") {
    return (
      <main
        id="main-content"
        className="flex min-h-[60svh] items-center justify-center"
      >
        <LoaderCircle
          className="text-accent size-7 animate-spin"
          aria-label="در حال دریافت حساب"
        />
      </main>
    );
  }

  if (state === "signed-out" || !user) {
    return (
      <main id="main-content">
        <Container className="py-16 sm:py-24">
          <section className="bg-surface border-border/70 mx-auto max-w-2xl rounded-xl border p-8 text-center sm:p-12">
            <UserRound
              className="text-accent mx-auto size-10"
              aria-hidden="true"
            />
            <h1 className="mt-6 text-3xl font-semibold">حساب کاربری شما</h1>
            <p className="text-muted-foreground mt-4 leading-8">
              برای مشاهده سفارش‌ها و نشانی‌های ذخیره‌شده وارد شوید.
            </p>
            {error ? <p className="text-danger mt-4 text-sm">{error}</p> : null}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/login?returnTo=/account">ورود</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/register?returnTo=/account">ساخت حساب</Link>
              </Button>
            </div>
          </section>
        </Container>
      </main>
    );
  }

  const address = user.defaultAddress;
  const hasAddress = Boolean(address.city && address.addressLine);

  return (
    <main id="main-content">
      <Container className="py-10 sm:py-16">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-accent text-sm font-medium">فضای شخصی</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              سلام، {user.name}
            </h1>
            <p className="text-muted-foreground mt-3">
              {formatPersianInteger(total)} سفارش در حساب شما
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => void logout()}
          >
            <LogOut aria-hidden="true" />
            خروج
          </Button>
        </div>

        <div className="mt-9 grid gap-6 lg:grid-cols-2">
          <section className="bg-surface border-border/70 rounded-xl border p-6">
            <h2 className="flex items-center gap-3 font-semibold">
              <UserRound className="text-accent size-5" aria-hidden="true" />
              اطلاعات حساب
            </h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">موبایل</dt>
                <dd dir="ltr">{user.phone}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">ایمیل</dt>
                <dd className="truncate" dir="ltr">
                  {user.email}
                </dd>
              </div>
            </dl>
          </section>
          <section className="bg-surface border-border/70 rounded-xl border p-6">
            <h2 className="flex items-center gap-3 font-semibold">
              <MapPin className="text-accent size-5" aria-hidden="true" />
              آخرین نشانی تحویل
            </h2>
            {hasAddress ? (
              <p className="text-muted-foreground mt-5 text-sm leading-7">
                {address.city}، {address.addressLine}، پلاک {address.plaque}
                {address.unit ? `، واحد ${address.unit}` : ""}
                <br />
                کد پستی: <span dir="ltr">{address.postalCode}</span>
              </p>
            ) : (
              <p className="text-muted-foreground mt-5 text-sm leading-7">
                پس از اولین سفارش، نشانی شما اینجا نمایش داده می‌شود.
              </p>
            )}
          </section>
        </div>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-accent text-sm font-medium">
                تاریخچه انتخاب‌ها
              </p>
              <h2 className="mt-2 text-2xl font-semibold">سفارش‌های من</h2>
            </div>
          </div>
          {orders.length === 0 ? (
            <div className="bg-surface border-border/70 mt-6 rounded-xl border py-14 text-center">
              <PackageSearch
                className="text-accent mx-auto size-9"
                aria-hidden="true"
              />
              <p className="mt-4 font-medium">هنوز سفارشی ثبت نکرده‌اید.</p>
              <Button className="mt-6" asChild>
                <Link href="/products">کشف محصولات</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {orders.map((order) => (
                <article
                  key={order.publicToken}
                  className="bg-surface border-border/70 rounded-xl border p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{order.totalPrice.rial}</p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        {new Intl.DateTimeFormat("fa-IR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(order.createdAt))}
                      </p>
                    </div>
                    <span className="bg-accent-soft text-accent-foreground rounded-full px-3 py-1 text-xs">
                      {orderLabels[order.status]}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-5 flex justify-between text-sm">
                    <span>{formatPersianInteger(order.itemCount)} محصول</span>
                    <span>ارسال به {order.deliveryCity}</span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {shippingMethodLabels[order.shippingMethod]}
                  </p>
                  <Button variant="ghost" size="sm" className="mt-4" asChild>
                    <Link href={`/order/${order.publicToken}`}>
                      مشاهده سفارش
                      <ArrowLeft aria-hidden="true" />
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          )}
          {nextCursor ? (
            <Button
              variant="outline"
              className="mt-6 w-full"
              disabled={isBusy}
              onClick={() => {
                setIsBusy(true);
                void loadOrders(nextCursor)
                  .catch((reason: unknown) =>
                    setError(
                      reason instanceof Error
                        ? reason.message
                        : "دریافت سفارش‌ها انجام نشد.",
                    ),
                  )
                  .finally(() => setIsBusy(false));
              }}
            >
              نمایش سفارش‌های بیشتر
            </Button>
          ) : null}
        </section>
      </Container>
    </main>
  );
}
