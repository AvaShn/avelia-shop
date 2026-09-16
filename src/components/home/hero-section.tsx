import Image from "next/image";
import Link from "next/link";
import { ArrowDownLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="border-border/70 relative isolate border-b lg:min-h-[calc(100svh-5rem)] lg:overflow-hidden">
      <div className="border-border/70 relative aspect-[4/3] overflow-hidden border-b sm:aspect-[16/8] lg:absolute lg:inset-0 lg:aspect-auto lg:border-0">
        <Image
          src="/images/home/avelia-beauty-hero-v2.webp"
          alt="مجموعه‌ای مینیمال از لوازم آرایشی، محصول مراقبت پوست و عطر در نور گرم"
          fill
          priority
          sizes="100vw"
          className="object-cover object-left"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent lg:hidden" />
      </div>

      <div
        aria-hidden="true"
        className="from-background via-background/90 absolute inset-0 hidden bg-gradient-to-l via-[42%] to-transparent lg:block"
      />

      <Container className="relative flex py-16 sm:py-20 lg:min-h-[calc(100svh-5rem)] lg:items-center lg:py-24">
        <Reveal className="max-w-2xl lg:w-[47%]">
          <p
            dir="ltr"
            className="text-accent mb-5 text-left text-sm font-medium tracking-[0.14em]"
          >
            AVELIA / CURATED WITH INTENTION
          </p>
          <h1 className="font-display text-4xl leading-[1.42] font-semibold tracking-[-0.045em] text-balance sm:text-6xl sm:leading-[1.3] lg:text-[4.35rem] lg:leading-[1.28]">
            انتخاب‌هایی برای کسانی که به جزئیات اهمیت می‌دهند.
          </h1>
          <p className="text-muted-foreground mt-7 max-w-xl text-base leading-8 sm:text-lg sm:leading-9">
            مجموعه‌ای سنجیده از لوازم آرایشی، مراقبت پوست و عطرهای اصیل؛ برای
            تجربه‌ای که زیبایی را با کیفیت و انتخاب آگاهانه معنا می‌کند.
          </p>
          <Button size="lg" asChild className="mt-9">
            <Link href="#featured-products">
              کشف مجموعه
              <ArrowDownLeft aria-hidden="true" />
            </Link>
          </Button>
        </Reveal>

        <div className="absolute bottom-8 left-12 hidden items-center gap-3 text-xs tracking-[0.16em] text-white/75 lg:flex">
          <span className="h-px w-10 bg-white/45" />
          <span dir="ltr">01 / AVELIA EDIT</span>
        </div>
      </Container>
    </section>
  );
}
