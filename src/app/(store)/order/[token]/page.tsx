import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, Send, ShieldCheck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { publicOrderTokenSchema } from "@/features/orders/schemas";
import {
  OrderServiceError,
  findPublicOrder,
  telegramPaymentUrlForOrder,
} from "@/features/orders/service";
import type { PublicOrderStatus } from "@/features/orders/types";
import { formatPriceRial } from "@/lib/pricing/format-price";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "وضعیت سفارش",
  robots: { index: false, follow: false },
};

type OrderPageProps = {
  params: Promise<{ token: string }>;
};

const statusContent: Record<
  PublicOrderStatus,
  { title: string; description: string }
> = {
  PENDING_PAYMENT: {
    title: "در انتظار ارسال رسید",
    description: "برای ادامه، وارد تلگرام شوید و رسید پرداخت را ارسال کنید.",
  },
  WAITING_REVIEW: {
    title: "رسید در حال بررسی است",
    description: "رسید شما دریافت شده و نتیجه پس از بررسی اعلام می‌شود.",
  },
  PAID: {
    title: "پرداخت تأیید شده است",
    description: "سفارش شما تأیید شده و برای مراحل بعدی آماده می‌شود.",
  },
  REJECTED: {
    title: "سفارش تأیید نشد",
    description: "برای بررسی بیشتر، لطفاً با پشتیبانی آولیا در تماس باشید.",
  },
};

export default async function OrderPage({ params }: OrderPageProps) {
  const parsedToken = publicOrderTokenSchema.safeParse((await params).token);
  if (!parsedToken.success) notFound();

  let order;
  try {
    order = await findPublicOrder(parsedToken.data);
  } catch (error: unknown) {
    if (error instanceof OrderServiceError && error.status === 404) notFound();
    throw error;
  }

  const content = statusContent[order.status];
  const total = formatPriceRial(order.totalPriceRial);
  const telegramUrl = telegramPaymentUrlForOrder(order.publicToken);

  return (
    <main id="main-content">
      <Container className="py-12 sm:py-20">
        <section className="bg-surface border-border/70 mx-auto max-w-4xl rounded-xl border p-5 shadow-sm sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-accent text-sm font-medium">پیگیری سفارش</p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
                {content.title}
              </h1>
              <p className="text-muted-foreground mt-4 leading-8">
                {content.description}
              </p>
            </div>
            <span className="bg-accent-soft text-accent-foreground flex size-14 shrink-0 items-center justify-center rounded-full">
              {order.status === "PAID" ? (
                <ShieldCheck aria-hidden="true" />
              ) : (
                <Clock3 aria-hidden="true" />
              )}
            </span>
          </div>

          <div className="border-border/70 mt-8 border-t pt-8">
            <h2 className="text-lg font-semibold">محصولات سفارش</h2>
            <ul className="mt-5 space-y-4">
              {order.items.map((item) => (
                <li
                  key={item.product.slug}
                  className="grid grid-cols-[4rem_minmax(0,1fr)] gap-4"
                >
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="bg-background relative aspect-square overflow-hidden rounded-md"
                  >
                    <Image
                      src={item.product.image}
                      alt={item.product.imageAlt}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="line-clamp-2 text-sm leading-6 font-medium"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-muted-foreground mt-1 text-xs">
                        تعداد {item.quantity}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm" dir="rtl">
                      {formatPriceRial(item.lineTotalRial).rial}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-border/70 mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-7">
            <span className="font-medium">مبلغ سفارش</span>
            <span className="text-lg font-semibold" dir="rtl">
              {total.rial}
            </span>
          </div>

          {order.status === "PENDING_PAYMENT" && telegramUrl ? (
            <Button className="mt-8 w-full sm:w-auto" size="lg" asChild>
              <a href={telegramUrl} target="_blank" rel="noreferrer">
                ادامه در تلگرام
                <Send aria-hidden="true" />
              </a>
            </Button>
          ) : null}
        </section>
      </Container>
    </main>
  );
}
