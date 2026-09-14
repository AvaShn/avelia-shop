import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";

export function BrandStorySection() {
  return (
    <section id="brand-story" className="bg-primary text-primary-foreground">
      <Container className="grid gap-14 py-20 sm:py-28 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-24 lg:py-40">
        <Reveal>
          <p className="text-accent text-sm font-medium tracking-[0.08em]">
            داستان AVELIA
          </p>
          <div className="mt-8 flex items-center gap-3 text-xs tracking-[0.14em] text-white/40">
            <span className="h-px w-12 bg-white/25" />
            <span dir="ltr">QUALITY OVER QUANTITY</span>
          </div>
        </Reveal>

        <Reveal>
          <h2 className="max-w-4xl text-3xl leading-[1.55] font-semibold tracking-[-0.035em] text-balance sm:text-5xl sm:leading-[1.45] lg:text-6xl">
            کمتر، اما بهتر انتخاب‌شده.
          </h2>
          <div className="mt-10 grid gap-7 text-base leading-9 text-white/62 sm:grid-cols-2 sm:gap-10">
            <p>
              AVELIA از یک باور ساده شکل گرفته است: تجربه‌ی خوب خرید، با
              گزینه‌های بیشتر ساخته نمی‌شود؛ با انتخاب‌های دقیق‌تر ساخته می‌شود.
            </p>
            <p>
              ما به‌جای تکرار بازار، محصولاتی را کنار هم قرار می‌دهیم که کیفیت،
              اصالت و توجه به جزئیات را در زندگی روزمره معنا می‌کنند.
            </p>
          </div>
          <a
            href="#trust"
            className="group hover:border-accent hover:text-accent mt-10 inline-flex min-h-12 items-center gap-3 border-b border-white/20 text-sm font-medium transition-colors duration-500"
          >
            ارزش‌های AVELIA
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform duration-500 group-hover:-translate-x-1"
            />
          </a>
        </Reveal>
      </Container>
    </section>
  );
}
