import { ArrowLeft, Check, Gem, ShieldCheck, Sparkles } from "lucide-react";

import { DesignSystemActions } from "@/components/design-system/design-system-actions";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";

const colors = [
  { name: "مشکی عمیق", value: "#121210", className: "bg-primary" },
  { name: "سفید گرم", value: "#F7F4EE", className: "bg-background" },
  { name: "شامپاینی", value: "#B99A61", className: "bg-accent" },
] as const;

export default function DesignSystemPage() {
  return (
    <main id="main-content">
      <section className="border-border/80 border-b py-20 sm:py-28 lg:py-36">
        <Container>
          <Reveal className="max-w-3xl">
            <p className="text-accent mb-5 text-sm font-medium tracking-[0.16em]">
              AVELIA / DESIGN SYSTEM
            </p>
            <h1 className="font-display text-4xl leading-[1.35] font-semibold tracking-[-0.035em] sm:text-6xl sm:leading-[1.25]">
              جزئیات، زبان مشترک تجربه‌ی AVELIA است.
            </h1>
            <p className="text-muted-foreground mt-7 max-w-2xl text-base leading-8 sm:text-lg sm:leading-9">
              این صفحه، ویترین موقت سیستم طراحی است؛ صفحه‌ی اصلی فروشگاه در فاز
              بعد با محتوای کامل برند ساخته می‌شود.
            </p>
          </Reveal>
        </Container>
      </section>

      <section id="colors" className="py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="هویت بصری"
              title="سه رنگ، با حضوری حساب‌شده"
              description="پالت محدود، فضای تنفس و کنتراست دقیق، حس آرام و ممتاز برند را حفظ می‌کند."
            />
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {colors.map((color) => (
                <article
                  key={color.value}
                  className="bg-surface border-border/80 overflow-hidden rounded-xl border"
                >
                  <div
                    className={`h-40 ${color.className}`}
                    aria-hidden="true"
                  />
                  <div className="flex items-center justify-between gap-4 p-5">
                    <span className="font-medium">{color.name}</span>
                    <span dir="ltr" className="text-muted-foreground text-sm">
                      {color.value}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      <section
        id="components"
        className="bg-surface border-border/80 border-y py-20 sm:py-28"
      >
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="اجزای رابط"
              title="ساده، لمسی و قابل اعتماد"
              description="هر کنترل با فاصله‌ی کافی، تمرکز واضح و حرکت نرم برای تجربه‌ی موبایل طراحی شده است."
            />

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="border-border/80 rounded-xl border p-6 sm:p-8">
                <h3 className="text-lg font-semibold">دکمه‌ها و بازخورد</h3>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button>
                    کشف مجموعه
                    <ArrowLeft aria-hidden="true" />
                  </Button>
                  <Button variant="outline">مشاهده جزئیات</Button>
                  <Button variant="ghost">انتخاب بعدی</Button>
                  <Button size="icon" aria-label="تأیید انتخاب">
                    <Check aria-hidden="true" />
                  </Button>
                </div>
                <DesignSystemActions />
              </article>

              <article className="border-border/80 rounded-xl border p-6 sm:p-8">
                <h3 className="text-lg font-semibold">ورودی‌ها</h3>
                <div className="mt-7 space-y-5">
                  <label className="block space-y-2" htmlFor="preview-name">
                    <span className="text-sm font-medium">
                      نام و نام خانوادگی
                    </span>
                    <Input
                      id="preview-name"
                      placeholder="نام خود را وارد کنید"
                    />
                  </label>
                  <label className="block space-y-2" htmlFor="preview-phone">
                    <span className="text-sm font-medium">شماره همراه</span>
                    <Input
                      id="preview-phone"
                      type="tel"
                      inputMode="tel"
                      dir="ltr"
                      placeholder="09•• ••• ••••"
                    />
                  </label>
                </div>
              </article>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="ریتم تجربه"
              title="اعتماد در حالت‌های مختلف"
              description="بارگذاری، تأیید و پیام‌های سیستم بدون شلوغی یا حرکت اضافی نمایش داده می‌شوند."
            />
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <article className="bg-primary text-primary-foreground rounded-xl p-7 sm:p-9">
                <div className="text-accent flex size-12 items-center justify-center rounded-full border border-white/15">
                  <ShieldCheck aria-hidden="true" />
                </div>
                <h3 className="mt-8 text-2xl font-semibold">
                  اصالت، اصل نخست انتخاب
                </h3>
                <p className="mt-4 max-w-md leading-8 text-white/65">
                  نشانه‌ها و پیام‌های اعتماد با زبان آرام و روشن در تمام مسیر
                  خرید تکرار می‌شوند.
                </p>
                <div
                  className="mt-8 flex gap-5 text-white/55"
                  aria-hidden="true"
                >
                  <Gem />
                  <Sparkles />
                </div>
              </article>
              <LoadingState label="در حال آماده‌سازی انتخاب‌ها" />
            </div>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-accent text-sm font-medium">{eyebrow}</p>
      <h2 className="mt-3 text-3xl leading-[1.4] font-semibold tracking-[-0.025em] sm:text-4xl">
        {title}
      </h2>
      <p className="text-muted-foreground mt-5 leading-8">{description}</p>
    </div>
  );
}
