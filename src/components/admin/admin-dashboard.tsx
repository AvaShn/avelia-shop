"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  LoaderCircle,
  LogOut,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AdminOrderDetail,
  AdminOrderSummary,
} from "@/features/admin/schemas";
import type { ApiEnvelope } from "@/lib/api/contracts";
import { formatPersianInteger } from "@/lib/i18n/format-number";
import { cn } from "@/lib/utils/cn";

type AuthState = "checking" | "signed-out" | "signed-in";
type OrderStatus = AdminOrderSummary["status"];
type PaymentStatus = AdminOrderSummary["paymentStatus"];

type OrdersMeta = {
  count: number;
  total: number;
  nextCursor: string | null;
};

const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  WAITING_REVIEW: "در انتظار بررسی",
  PAID: "پرداخت‌شده",
  REJECTED: "ردشده",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "رسید دریافت نشده",
  UNDER_REVIEW: "در حال بررسی",
  APPROVED: "تأییدشده",
  REJECTED: "ردشده",
};

class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function readEnvelope<
  Data,
  Meta extends Record<string, unknown> = Record<string, never>,
>(response: Response) {
  const payload = (await response.json()) as ApiEnvelope<Data, Meta>;
  if (!response.ok || payload.error || !payload.data) {
    throw new AdminApiError(
      payload.error?.message ?? "درخواست مدیریت انجام نشد.",
      response.status,
    );
  }
  return payload;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "neutral" | "warning" | "success" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full border px-3 text-xs font-medium",
        tone === "success" &&
          "border-emerald-700/20 bg-emerald-700/8 text-emerald-800",
        tone === "danger" && "border-danger/20 bg-danger/8 text-danger",
        tone === "warning" &&
          "border-accent/30 bg-accent-soft text-accent-foreground",
        tone === "neutral" &&
          "border-border bg-surface-strong text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

function orderTone(status: OrderStatus) {
  if (status === "PAID") return "success" as const;
  if (status === "REJECTED") return "danger" as const;
  if (status === "WAITING_REVIEW") return "warning" as const;
  return "neutral" as const;
}

function paymentTone(status: PaymentStatus) {
  if (status === "APPROVED") return "success" as const;
  if (status === "REJECTED") return "danger" as const;
  if (status === "UNDER_REVIEW") return "warning" as const;
  return "neutral" as const;
}

export function AdminDashboard() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(
    null,
  );
  const [reviewNote, setReviewNote] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [isDetailBusy, setIsDetailBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const returnToLogin = useCallback((message?: string) => {
    setAuthState("signed-out");
    setOrders([]);
    setSelectedOrder(null);
    if (message) setError(message);
  }, []);

  const loadOrders = useCallback(
    async (options?: { cursor?: string; append?: boolean }) => {
      setIsBusy(true);
      setError(null);
      try {
        const parameters = new URLSearchParams({ limit: "25" });
        if (query.trim()) parameters.set("q", query.trim());
        if (status) parameters.set("status", status);
        if (paymentStatus) parameters.set("paymentStatus", paymentStatus);
        if (options?.cursor) parameters.set("cursor", options.cursor);

        const payload = await readEnvelope<AdminOrderSummary[], OrdersMeta>(
          await fetch(`/api/admin/orders?${parameters}`, { cache: "no-store" }),
        );
        setOrders((current) =>
          options?.append ? [...current, ...payload.data] : payload.data,
        );
        setTotal(payload.meta.total);
        setNextCursor(payload.meta.nextCursor);
      } catch (reason: unknown) {
        if (reason instanceof AdminApiError && reason.status === 401) {
          returnToLogin(reason.message);
        } else {
          setError(
            reason instanceof Error
              ? reason.message
              : "دریافت سفارش‌ها انجام نشد.",
          );
        }
      } finally {
        setIsBusy(false);
      }
    },
    [paymentStatus, query, returnToLogin, status],
  );

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/session", { cache: "no-store" })
      .then(async (response) => {
        if (!active) return;
        if (response.ok) {
          setAuthState("signed-in");
          return;
        }
        const payload = (await response.json()) as ApiEnvelope<unknown>;
        setAuthState("signed-out");
        if (response.status === 503) {
          setError(payload.error?.message ?? "ورود مدیریت پیکربندی نشده است.");
        }
      })
      .catch(() => {
        if (active) {
          setAuthState("signed-out");
          setError("ارتباط با سرور مدیریت برقرار نشد.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authState === "signed-in") void loadOrders();
  }, [authState, loadOrders]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);
    try {
      await readEnvelope<{ authenticated: true }>(
        await fetch("/api/admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }),
      );
      setPassword("");
      setAuthState("signed-in");
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "ورود مدیریت انجام نشد.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function logout() {
    setIsBusy(true);
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } finally {
      setIsBusy(false);
      returnToLogin();
    }
  }

  async function openOrder(token: string) {
    setIsDetailBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload = await readEnvelope<AdminOrderDetail>(
        await fetch(`/api/admin/orders/${encodeURIComponent(token)}`, {
          cache: "no-store",
        }),
      );
      setSelectedOrder(payload.data);
      setReviewNote(payload.data.review.note ?? "");
    } catch (reason: unknown) {
      if (reason instanceof AdminApiError && reason.status === 401) {
        returnToLogin(reason.message);
      } else {
        setError(
          reason instanceof Error ? reason.message : "دریافت سفارش انجام نشد.",
        );
      }
    } finally {
      setIsDetailBusy(false);
    }
  }

  async function reviewPayment(action: "APPROVE" | "REJECT") {
    if (!selectedOrder) return;
    if (
      action === "REJECT" &&
      !window.confirm("پرداخت این سفارش رد و موجودی آن آزاد شود؟")
    ) {
      return;
    }

    setIsDetailBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload = await readEnvelope<AdminOrderDetail>(
        await fetch(
          `/api/admin/orders/${encodeURIComponent(selectedOrder.publicToken)}/payment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action,
              ...(reviewNote.trim() ? { note: reviewNote.trim() } : {}),
            }),
          },
        ),
      );
      setSelectedOrder(payload.data);
      setNotice(
        action === "APPROVE"
          ? "پرداخت تأیید و سفارش نهایی شد."
          : "پرداخت رد و موجودی سفارش آزاد شد.",
      );
      await loadOrders();
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "بررسی پرداخت انجام نشد.",
      );
    } finally {
      setIsDetailBusy(false);
    }
  }

  if (authState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <p className="text-muted-foreground flex items-center gap-3">
          <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          در حال بررسی نشست مدیریت
        </p>
      </main>
    );
  }

  if (authState === "signed-out") {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-12">
        <section className="bg-surface border-border/70 shadow-soft w-full max-w-md rounded-xl border p-6 sm:p-9">
          <div className="flex items-center justify-between gap-4">
            <BrandMark />
            <ShieldCheck className="text-accent size-6" aria-hidden="true" />
          </div>
          <p className="text-accent mt-10 text-sm font-medium">فضای خصوصی</p>
          <h1 className="mt-3 text-3xl font-semibold">ورود مدیریت AVELIA</h1>
          <p className="text-muted-foreground mt-4 text-sm leading-7">
            برای مشاهده سفارش‌ها و بررسی رسیدهای پرداخت وارد شوید.
          </p>

          <form
            className="mt-8 space-y-5"
            onSubmit={(event) => void login(event)}
          >
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                ایمیل مدیریت
              </span>
              <Input
                type="email"
                dir="ltr"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">رمز عبور</span>
              <Input
                type="password"
                dir="ltr"
                minLength={12}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? (
              <p
                className="border-danger/20 bg-danger/5 text-danger rounded-lg border px-4 py-3 text-sm leading-7"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isBusy}
            >
              {isBusy ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : null}
              ورود امن
            </Button>
          </form>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground mt-7 flex min-h-11 items-center justify-center gap-2 text-sm transition-colors"
          >
            بازگشت به فروشگاه
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Link>
        </section>
      </main>
    );
  }

  const canReview =
    selectedOrder?.status === "WAITING_REVIEW" &&
    selectedOrder.paymentStatus === "UNDER_REVIEW";

  return (
    <main className="min-h-screen">
      <header className="bg-background/95 border-border/70 sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex min-h-18 max-w-[96rem] items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <BrandMark />
            <span className="text-muted-foreground border-border hidden border-r pr-4 text-sm sm:inline">
              مدیریت سفارش‌ها
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() => void logout()}
          >
            خروج
            <LogOut aria-hidden="true" />
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[96rem] px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-accent text-sm font-medium">مرکز بررسی</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
              سفارش‌های AVELIA
            </h1>
            <p className="text-muted-foreground mt-3 text-sm">
              {formatPersianInteger(total)} سفارش مطابق فیلتر فعلی
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => void loadOrders()}
          >
            <RefreshCw
              className={cn(isBusy && "animate-spin")}
              aria-hidden="true"
            />
            تازه‌سازی
          </Button>
        </div>

        <form
          className="bg-surface border-border/70 mt-8 grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1fr)_13rem_13rem_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void loadOrders();
          }}
        >
          <Input
            aria-label="جست‌وجوی سفارش"
            placeholder="نام، موبایل، ایمیل یا شناسه سفارش"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            aria-label="وضعیت سفارش"
            className="border-border bg-surface focus-visible:border-accent focus-visible:ring-accent/20 h-12 rounded-md border px-4 text-sm outline-none focus-visible:ring-4"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">همه وضعیت‌های سفارش</option>
            {Object.entries(orderStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="وضعیت پرداخت"
            className="border-border bg-surface focus-visible:border-accent focus-visible:ring-accent/20 h-12 rounded-md border px-4 text-sm outline-none focus-visible:ring-4"
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
          >
            <option value="">همه وضعیت‌های پرداخت</option>
            {Object.entries(paymentStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={isBusy}>
            اعمال فیلتر
          </Button>
        </form>

        {error ? (
          <p
            className="border-danger/20 bg-danger/5 text-danger mt-6 rounded-lg border px-4 py-3 text-sm"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {notice ? (
          <p
            className="mt-6 rounded-lg border border-emerald-700/20 bg-emerald-700/8 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            {notice}
          </p>
        ) : null}

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_30rem] xl:items-start">
          <section aria-label="فهرست سفارش‌ها" className="space-y-4">
            {!isBusy && orders.length === 0 ? (
              <div className="bg-surface border-border/70 rounded-xl border px-6 py-16 text-center">
                <PackageSearch
                  className="text-accent mx-auto size-9"
                  aria-hidden="true"
                />
                <h2 className="mt-5 text-xl font-semibold">سفارشی پیدا نشد</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  فیلترها را تغییر دهید یا پس از ثبت سفارش دوباره بررسی کنید.
                </p>
              </div>
            ) : null}

            {orders.map((order) => (
              <article
                key={order.publicToken}
                className="bg-surface border-border/70 rounded-xl border p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{order.customer.name}</p>
                    <p className="text-muted-foreground mt-1 text-sm" dir="ltr">
                      {order.customer.phone}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={orderTone(order.status)}>
                      {orderStatusLabels[order.status]}
                    </StatusBadge>
                    <StatusBadge tone={paymentTone(order.paymentStatus)}>
                      {paymentStatusLabels[order.paymentStatus]}
                    </StatusBadge>
                  </div>
                </div>
                <dl className="border-border/70 mt-5 grid gap-4 border-t pt-5 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">مبلغ</dt>
                    <dd className="mt-1 font-medium">
                      {order.totalPrice.rial}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">اقلام</dt>
                    <dd className="mt-1">
                      {formatPersianInteger(order.itemCount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">ثبت</dt>
                    <dd className="mt-1">{formatDateTime(order.createdAt)}</dd>
                  </div>
                </dl>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  disabled={isDetailBusy}
                  onClick={() => void openOrder(order.publicToken)}
                >
                  مشاهده جزئیات
                  <ChevronLeft aria-hidden="true" />
                </Button>
              </article>
            ))}

            {nextCursor ? (
              <Button
                variant="outline"
                className="w-full"
                disabled={isBusy}
                onClick={() =>
                  void loadOrders({ cursor: nextCursor, append: true })
                }
              >
                نمایش سفارش‌های بیشتر
              </Button>
            ) : null}
          </section>

          <aside className="bg-surface border-border/70 rounded-xl border p-5 shadow-sm sm:p-7 xl:sticky xl:top-24">
            {isDetailBusy && !selectedOrder ? (
              <p className="text-muted-foreground flex items-center gap-3 text-sm">
                <LoaderCircle
                  className="size-5 animate-spin"
                  aria-hidden="true"
                />
                در حال دریافت جزئیات
              </p>
            ) : selectedOrder ? (
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-accent text-sm font-medium">
                      جزئیات سفارش
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      {selectedOrder.customer.name}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="بستن جزئیات"
                    onClick={() => setSelectedOrder(null)}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge tone={orderTone(selectedOrder.status)}>
                    {orderStatusLabels[selectedOrder.status]}
                  </StatusBadge>
                  <StatusBadge tone={paymentTone(selectedOrder.paymentStatus)}>
                    {paymentStatusLabels[selectedOrder.paymentStatus]}
                  </StatusBadge>
                </div>
                <dl className="border-border/70 mt-6 space-y-3 border-y py-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">موبایل</dt>
                    <dd dir="ltr">{selectedOrder.customer.phone}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">ایمیل</dt>
                    <dd className="max-w-[16rem] truncate" dir="ltr">
                      {selectedOrder.customer.email ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">تلگرام</dt>
                    <dd>
                      {selectedOrder.customer.telegramConnected
                        ? "متصل"
                        : "متصل نشده"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">مبلغ کل</dt>
                    <dd className="font-semibold">
                      {selectedOrder.totalPrice.rial}
                    </dd>
                  </div>
                </dl>

                <div className="border-border/70 mt-6 rounded-lg border p-4 text-sm">
                  <h3 className="font-semibold">نشانی تحویل</h3>
                  <p className="text-muted-foreground mt-3 leading-7">
                    {selectedOrder.delivery.city}،{" "}
                    {selectedOrder.delivery.addressLine}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-muted-foreground">پلاک</dt>
                      <dd className="mt-1">{selectedOrder.delivery.plaque}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">واحد</dt>
                      <dd className="mt-1">
                        {selectedOrder.delivery.unit ?? "—"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">کد پستی</dt>
                      <dd className="mt-1" dir="ltr">
                        {selectedOrder.delivery.postalCode}
                      </dd>
                    </div>
                  </dl>
                </div>

                <h3 className="mt-6 font-semibold">اقلام سفارش</h3>
                <ul className="mt-4 space-y-4">
                  {selectedOrder.items.map((item) => (
                    <li
                      key={item.product.slug}
                      className="border-border/70 border-b pb-4 text-sm last:border-0"
                    >
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="hover:text-accent font-medium transition-colors"
                      >
                        {item.product.name}
                      </Link>
                      <div className="text-muted-foreground mt-2 flex justify-between gap-4">
                        <span>تعداد {formatPersianInteger(item.quantity)}</span>
                        <span>{item.lineTotal.rial}</span>
                      </div>
                    </li>
                  ))}
                </ul>

                {selectedOrder.receiptPath ? (
                  <div className="mt-6">
                    <h3 className="font-semibold">رسید پرداخت</h3>
                    {/* Authenticated same-origin image proxy; never exposes the private object key. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedOrder.receiptPath}
                      alt={`رسید پرداخت ${selectedOrder.customer.name}`}
                      className="border-border mt-4 max-h-96 w-full rounded-lg border object-contain"
                    />
                  </div>
                ) : (
                  <p className="bg-surface-strong text-muted-foreground mt-6 rounded-lg px-4 py-3 text-sm">
                    هنوز رسیدی برای این سفارش دریافت نشده است.
                  </p>
                )}

                <label className="mt-6 block">
                  <span className="mb-2 block text-sm font-medium">
                    یادداشت بررسی (اختیاری)
                  </span>
                  <textarea
                    value={reviewNote}
                    maxLength={500}
                    rows={3}
                    onChange={(event) => setReviewNote(event.target.value)}
                    className="border-border bg-surface focus-visible:border-accent focus-visible:ring-accent/20 w-full resize-y rounded-md border px-4 py-3 text-sm outline-none focus-visible:ring-4"
                  />
                </label>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Button
                    disabled={!canReview || isDetailBusy}
                    onClick={() => void reviewPayment("APPROVE")}
                  >
                    <Check aria-hidden="true" />
                    تأیید پرداخت
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={!canReview || isDetailBusy}
                    onClick={() => void reviewPayment("REJECT")}
                  >
                    <X aria-hidden="true" />
                    رد پرداخت
                  </Button>
                </div>
                {!canReview ? (
                  <p className="text-muted-foreground mt-3 text-xs leading-6">
                    عملیات بررسی فقط پس از دریافت رسید و قرارگرفتن پرداخت در
                    وضعیت «در حال بررسی» فعال می‌شود.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="py-14 text-center">
                <PackageSearch
                  className="text-accent mx-auto size-9"
                  aria-hidden="true"
                />
                <h2 className="mt-5 text-xl font-semibold">
                  یک سفارش را انتخاب کنید
                </h2>
                <p className="text-muted-foreground mt-2 text-sm leading-7">
                  اطلاعات مشتری، اقلام و رسید در این بخش نمایش داده می‌شود.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
