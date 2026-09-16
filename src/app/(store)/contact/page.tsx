import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpLeft,
  Bot,
  Camera,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  contactDetails,
  telegramBotUrl,
} from "@/features/support/contact-details";
import { serverEnvironment } from "@/lib/env/server";

export const metadata: Metadata = {
  title: "ارتباط با ما",
  description:
    "راه‌های رسمی ارتباط با AVELIA برای پیگیری سفارش، راهنمایی محصولات و پشتیبانی خرید.",
  alternates: { canonical: "/contact" },
};

const directChannels = [
  {
    title: "تلگرام مستقیم",
    value: contactDetails.telegram.handle,
    description: "برای گفت‌وگو با پشتیبانی و پرسش‌های مربوط به محصولات",
    href: contactDetails.telegram.href,
    icon: Send,
  },
  {
    title: "واتساپ",
    value: contactDetails.whatsapp.display,
    description: "برای راهنمایی انتخاب محصول و هماهنگی درباره سفارش",
    href: contactDetails.whatsapp.href,
    icon: MessageCircle,
  },
  {
    title: "بله",
    value: contactDetails.bale.handle,
    description: "مسیر جایگزین برای ارتباط متنی با پشتیبانی",
    href: contactDetails.bale.href,
    icon: MessageCircle,
  },
  {
    title: "ایمیل",
    value: contactDetails.email.address,
    description: "برای پیام‌های کامل‌تر و مکاتباتی که نیاز به جزئیات دارند",
    href: contactDetails.email.href,
    icon: Mail,
  },
] as const;

export default function ContactPage() {
  const botUrl = telegramBotUrl(serverEnvironment.TELEGRAM_BOT_USERNAME);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AVELIA",
    url: appUrl,
    email: contactDetails.email.address,
    telephone: "+989128586010",
    sameAs: [
      contactDetails.instagram.href,
      contactDetails.telegram.href,
      contactDetails.bale.href,
    ],
  };

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />

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
                ارتباط با ما
              </li>
            </ol>
          </nav>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.62fr] lg:items-end">
            <div className="max-w-4xl">
              <p className="text-accent text-sm font-medium">همراهی AVELIA</p>
              <h1 className="mt-4 text-4xl leading-[1.45] font-semibold tracking-[-0.04em] sm:text-6xl">
                برای یک پاسخ روشن، کنار شما هستیم.
              </h1>
            </div>
            <p className="text-muted-foreground max-w-xl leading-9 lg:justify-self-end">
              برای پیگیری خرید، ابتدا از ربات رسمی سفارش استفاده کنید. برای
              راهنمایی محصول یا گفت‌وگوی مستقیم، یکی از مسیرهای ارتباطی زیر را
              انتخاب کنید.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-14 sm:py-20 lg:py-24">
        <section className="bg-primary text-primary-foreground relative overflow-hidden rounded-xl px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
          <div
            aria-hidden="true"
            className="absolute -top-32 -left-24 size-72 rounded-full bg-[radial-gradient(circle,rgba(185,154,97,0.22),transparent_68%)]"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <span className="flex size-12 items-center justify-center rounded-full border border-white/15 bg-white/5">
                <Bot aria-hidden="true" strokeWidth={1.5} />
              </span>
              <p className="mt-6 text-sm font-medium text-[#d7bd8c]">
                مسیر اصلی پیگیری خرید
              </p>
              <h2 className="mt-3 text-3xl leading-[1.5] font-semibold sm:text-4xl">
                ربات تلگرام سفارش‌های AVELIA
              </h2>
              <p className="mt-4 max-w-xl leading-8 text-white/65">
                سفارش‌های ثبت‌شده، ادامه پرداخت، ارسال رسید و مشاهده وضعیت بررسی
                از این مسیر انجام می‌شود.
              </p>
            </div>

            {botUrl ? (
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="w-full lg:w-auto"
              >
                <a href={botUrl} target="_blank" rel="noreferrer">
                  ورود به ربات پیگیری
                  <ArrowUpLeft aria-hidden="true" />
                </a>
              </Button>
            ) : (
              <div className="max-w-sm rounded-lg border border-white/15 bg-white/5 px-5 py-4 text-sm leading-7 text-white/65">
                آدرس ربات پس از تنظیم متغیر{" "}
                <span dir="ltr" className="text-white/90">
                  TELEGRAM_BOT_USERNAME
                </span>{" "}
                در زمان انتشار نمایش داده می‌شود.
              </div>
            )}
          </div>
        </section>

        <section
          aria-labelledby="direct-contact-title"
          className="mt-16 sm:mt-24"
        >
          <div className="max-w-2xl">
            <p className="text-accent text-sm font-medium">گفت‌وگوی مستقیم</p>
            <h2
              id="direct-contact-title"
              className="mt-3 text-3xl font-semibold sm:text-4xl"
            >
              راه‌های رسمی ارتباط
            </h2>
            <p className="text-muted-foreground mt-4 leading-8">
              کانالی را انتخاب کنید که برای شما راحت‌تر است. همراه داشتن نام
              محصول یا لینک پیگیری سفارش، پاسخ‌گویی را دقیق‌تر می‌کند.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {directChannels.map((channel) => {
              const Icon = channel.icon;
              const isEmail = channel.title === "ایمیل";

              return (
                <a
                  key={channel.title}
                  href={channel.href}
                  target={isEmail ? undefined : "_blank"}
                  rel={isEmail ? undefined : "noreferrer"}
                  className="bg-surface border-border/70 hover:border-accent group hover:shadow-soft rounded-xl border p-6 transition-[border-color,transform,box-shadow] duration-500 hover:-translate-y-0.5 sm:p-7"
                  aria-label={channel.title + ": " + channel.value}
                >
                  <div className="flex items-start justify-between gap-5">
                    <span className="bg-accent-soft text-accent-foreground flex size-11 items-center justify-center rounded-full">
                      <Icon
                        aria-hidden="true"
                        className="size-5"
                        strokeWidth={1.5}
                      />
                    </span>
                    <ArrowUpLeft
                      aria-hidden="true"
                      className="text-muted-foreground group-hover:text-foreground size-5 transition-colors"
                    />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">
                    {channel.title}
                  </h3>
                  <p
                    className="text-foreground mt-2 font-medium"
                    dir={isEmail ? "ltr" : undefined}
                  >
                    {channel.value}
                  </p>
                  <p className="text-muted-foreground mt-3 text-sm leading-7">
                    {channel.description}
                  </p>
                </a>
              );
            })}
          </div>
        </section>

        <section className="border-border/70 bg-accent-soft/50 mt-16 grid gap-6 rounded-xl border p-6 sm:mt-24 sm:p-9 lg:grid-cols-[auto_1fr] lg:items-start">
          <span className="bg-surface text-accent-foreground flex size-12 items-center justify-center rounded-full shadow-sm">
            <ShieldCheck aria-hidden="true" strokeWidth={1.5} />
          </span>
          <div>
            <h2 className="text-xl font-semibold">ارتباط امن</h2>
            <p className="text-muted-foreground mt-3 max-w-3xl leading-8">
              تصویر رسید را فقط در ربات رسمی سفارش ارسال کنید. AVELIA در
              گفت‌وگوهای مستقیم رمز عبور، کد تأیید یا اطلاعات محرمانه کارت بانکی
              شما را درخواست نمی‌کند.
            </p>
          </div>
        </section>

        <section
          id="social"
          className="border-border/70 mt-16 flex flex-col gap-7 border-t pt-14 sm:mt-24 sm:flex-row sm:items-center sm:justify-between sm:pt-20"
        >
          <div>
            <div className="flex items-center gap-3">
              <Camera aria-hidden="true" className="text-accent size-5" />
              <p className="text-accent text-sm font-medium">
                شبکه‌های اجتماعی
              </p>
            </div>
            <h2 className="mt-3 text-3xl font-semibold">
              AVELIA در اینستاگرام
            </h2>
            <p className="text-muted-foreground mt-3 leading-8">
              تازه‌ترین انتخاب‌ها و محتوای زیبایی را در صفحه رسمی دنبال کنید.
            </p>
          </div>
          <Button asChild variant="outline" size="lg">
            <Link href="/social">مشاهده صفحه رسمی</Link>
          </Button>
        </section>
      </Container>
    </main>
  );
}
