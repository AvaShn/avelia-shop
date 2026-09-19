import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, Camera, MessageCircle, ShieldCheck } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { contactDetails } from "@/features/support/contact-details";

export const metadata: Metadata = {
  title: "شبکه‌های اجتماعی",
  description: "صفحه رسمی اینستاگرام AVELIA و مسیرهای معتبر ارتباط با فروشگاه.",
  alternates: { canonical: "/social" },
};

export default function SocialPage() {
  return (
    <main id="main-content">
      <section className="border-border/70 border-b py-12 sm:py-18 lg:py-24">
        <Container>
          <nav aria-label="مسیر صفحه" className="text-muted-foreground text-xs">
            <ol className="flex items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground transition-colors"
                >
                  صفحه اصلی
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground">
                شبکه‌های اجتماعی
              </li>
            </ol>
          </nav>

          <div className="mt-10 max-w-4xl">
            <p className="text-accent text-sm font-medium">صفحه رسمی AVELIA</p>
            <h1 className="mt-4 text-4xl leading-[1.45] font-semibold tracking-[-0.04em] sm:text-6xl">
              زیبایی، انتخاب و جزئیات؛ در یک قاب آرام.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-2xl text-base leading-9 sm:text-lg">
              معرفی محصولات منتخب، جزئیات بافت و رنگ و روایت‌های کوتاه AVELIA را
              در صفحه رسمی اینستاگرام دنبال کنید.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-14 sm:py-20 lg:py-24">
        <section className="bg-primary text-primary-foreground relative overflow-hidden rounded-xl px-6 py-14 text-center sm:px-10 sm:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(185,154,97,0.24),transparent_48%)]"
          />
          <div className="relative mx-auto max-w-2xl">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-white/15 bg-white/5">
              <Camera aria-hidden="true" className="size-7" strokeWidth={1.4} />
            </span>
            <p className="mt-7 text-sm font-medium text-[#d7bd8c]">
              اینستاگرام رسمی
            </p>
            <h2
              dir="ltr"
              className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl"
            >
              {contactDetails.instagram.handle}
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-8 text-white/65">
              برای جلوگیری از صفحات مشابه، فقط از همین شناسه و لینک رسمی وارد
              صفحه AVELIA شوید.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-8">
              <a
                href={contactDetails.instagram.href}
                target="_blank"
                rel="noreferrer"
              >
                مشاهده در اینستاگرام
                <ArrowUpLeft aria-hidden="true" />
              </a>
            </Button>
          </div>
        </section>

        <section className="border-border/70 mt-14 grid gap-6 rounded-xl border p-6 sm:mt-20 sm:p-9 lg:grid-cols-[auto_1fr_auto] lg:items-center">
          <span className="bg-accent-soft text-accent-foreground flex size-12 items-center justify-center rounded-full">
            <ShieldCheck aria-hidden="true" strokeWidth={1.5} />
          </span>
          <div>
            <h2 className="text-xl font-semibold">
              پیگیری سفارش در شبکه اجتماعی انجام نمی‌شود
            </h2>
            <p className="text-muted-foreground mt-2 leading-8">
              برای امنیت بیشتر، وضعیت خرید و رسید پرداخت را فقط از ربات رسمی یا
              صفحه ارتباط با ما پیگیری کنید.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/contact">
              راه‌های ارتباطی
              <MessageCircle aria-hidden="true" />
            </Link>
          </Button>
        </section>
      </Container>
    </main>
  );
}
