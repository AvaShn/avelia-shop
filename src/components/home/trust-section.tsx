import { SectionHeading } from "@/components/home/section-heading";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { trustPillars } from "@/features/home/content";
import { formatPersianInteger } from "@/lib/i18n/format-number";

export function TrustSection() {
  return (
    <section id="trust" className="py-20 sm:py-28 lg:py-36">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="اعتماد در هر مرحله"
            title="جزئیاتی که خیال شما را آسوده می‌کنند"
            description="از لحظه‌ی انتخاب تا تأیید سفارش، هر مرحله روشن، قابل پیگیری و با همراهی انسانی طراحی شده است."
            align="center"
          />

          <div className="border-border/80 md:divide-border/80 mt-14 grid border-y md:grid-cols-3 md:divide-x md:divide-x-reverse">
            {trustPillars.map((pillar, index) => {
              const Icon = pillar.icon;

              return (
                <article
                  key={pillar.title}
                  className="border-border/80 py-9 md:border-b-0 md:px-8 md:py-12 [&:not(:last-child)]:border-b"
                >
                  <div className="flex items-center justify-between gap-5">
                    <span className="border-accent/45 text-accent flex size-12 items-center justify-center rounded-full border">
                      <Icon
                        aria-hidden="true"
                        className="size-5"
                        strokeWidth={1.5}
                      />
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatPersianInteger(index + 1, 2)}
                    </span>
                  </div>
                  <h3 className="mt-8 text-xl font-semibold">{pillar.title}</h3>
                  <p className="text-muted-foreground mt-4 text-sm leading-8">
                    {pillar.description}
                  </p>
                </article>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
