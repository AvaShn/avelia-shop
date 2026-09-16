import type { ReactNode } from "react";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { formatPersianInteger } from "@/lib/i18n/format-number";

export type PolicySection = {
  id: string;
  title: string;
  content: ReactNode;
};

type PolicyPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: readonly PolicySection[];
};

export function PolicyPage({
  eyebrow,
  title,
  description,
  sections,
}: PolicyPageProps) {
  return (
    <main id="main-content">
      <section className="border-border/70 border-b py-12 sm:py-18 lg:py-24">
        <Container>
          <nav aria-label="مسیر صفحه" className="text-muted-foreground text-xs">
            <ol className="flex flex-wrap items-center gap-2">
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
                {title}
              </li>
            </ol>
          </nav>

          <div className="mt-10 max-w-4xl">
            <p className="text-accent text-sm font-medium">{eyebrow}</p>
            <h1 className="mt-4 text-4xl leading-[1.45] font-semibold tracking-[-0.04em] sm:text-6xl">
              {title}
            </h1>
            <p className="text-muted-foreground mt-6 max-w-3xl text-base leading-9 sm:text-lg">
              {description}
            </p>
            <p className="text-muted-foreground mt-5 text-xs">
              نسخه ۱.۰ · آخرین بازبینی: شهریور ۱۴۰۵
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-14 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-20">
          <aside className="bg-surface border-border/70 rounded-xl border p-5 lg:sticky lg:top-28">
            <h2 className="text-sm font-semibold">در این صفحه</h2>
            <nav aria-label={`فهرست ${title}`} className="mt-4">
              <ol className="space-y-1">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-muted-foreground hover:text-foreground flex min-h-10 items-center gap-3 text-sm transition-colors"
                    >
                      <span className="text-accent text-xs" aria-hidden="true">
                        {formatPersianInteger(index + 1, 2)}
                      </span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="max-w-3xl">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className={
                  index === 0
                    ? "scroll-mt-28"
                    : "border-border/70 mt-12 scroll-mt-28 border-t pt-12 sm:mt-16 sm:pt-16"
                }
              >
                <h2 className="text-2xl leading-[1.6] font-semibold sm:text-3xl">
                  {section.title}
                </h2>
                <div className="text-muted-foreground [&_a]:text-foreground mt-5 space-y-5 leading-9 [&_a]:underline [&_a]:decoration-[var(--avelia-accent)] [&_a]:underline-offset-4 [&_li]:pr-1 [&_ul]:list-disc [&_ul]:space-y-3 [&_ul]:pr-5">
                  {section.content}
                </div>
              </section>
            ))}
          </article>
        </div>
      </Container>
    </main>
  );
}
