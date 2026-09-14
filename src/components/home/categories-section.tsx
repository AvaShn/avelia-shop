import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SectionHeading } from "@/components/home/section-heading";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/motion/reveal";
import { homeCategories } from "@/features/home/content";
import { formatPersianInteger } from "@/lib/i18n/format-number";

export function CategoriesSection() {
  return (
    <section id="collections" className="py-20 sm:py-28 lg:py-36">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="مجموعه‌ها"
              title="هر انتخاب، بخشی از یک سبک زندگی"
              description="مجموعه‌هایی محدود و هدفمند؛ بدون شلوغی و بدون انتخاب‌های تصادفی."
            />
            <p className="text-muted-foreground max-w-sm text-sm leading-7 lg:text-end">
              هر دسته‌بندی با نگاه دقیق به کیفیت، کاربرد و تجربه‌ی واقعی انتخاب
              شده است.
            </p>
          </div>

          <div className="-mx-5 mt-12 grid snap-x snap-mandatory [scrollbar-width:none] auto-cols-[86%] grid-flow-col gap-4 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:auto-cols-[56%] sm:px-8 lg:mx-0 lg:grid-flow-row lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
            {homeCategories.map((category, index) => (
              <Link
                key={category.id}
                href={category.href}
                className="group bg-primary relative aspect-[4/5] snap-start overflow-hidden rounded-xl text-white focus-visible:outline-offset-4"
              >
                <Image
                  src={category.image}
                  alt={category.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 56vw, 86vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-avelia)] group-hover:scale-[1.035]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/5" />
                <span className="absolute top-5 left-5 text-xs tracking-[0.14em] text-white/65">
                  {formatPersianInteger(index + 1, 2)}
                </span>
                <div className="absolute right-0 bottom-0 left-0 p-6 sm:p-7">
                  <p className="text-accent-soft text-sm">{category.eyebrow}</p>
                  <div className="mt-2 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold">
                        {category.name}
                      </h3>
                      <p className="mt-3 max-w-xs text-sm leading-7 text-white/65">
                        {category.description}
                      </p>
                    </div>
                    <span className="group-hover:text-primary flex size-11 shrink-0 items-center justify-center rounded-full border border-white/25 transition-[background-color,color,transform] duration-500 group-hover:-translate-x-1 group-hover:bg-white">
                      <ArrowLeft aria-hidden="true" className="size-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
