import Link from "next/link";

import { cn } from "@/lib/utils/cn";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <Link
      href="/"
      aria-label="AVELIA — صفحه اصلی"
      className={cn(
        "group inline-flex min-h-11 items-center gap-3 focus-visible:rounded-sm",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="border-accent/70 group-hover:bg-accent-soft flex size-8 items-center justify-center rounded-full border text-[0.7rem] font-semibold transition-colors duration-500"
      >
        A
      </span>
      <span
        dir="ltr"
        className="text-sm font-semibold tracking-[0.28em] sm:text-base"
      >
        AVELIA
      </span>
    </Link>
  );
}
