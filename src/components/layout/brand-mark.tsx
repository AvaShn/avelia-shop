import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

type BrandMarkProps = {
  className?: string;
  tone?: "light" | "dark";
};

const logoSource = "/images/brand/avelia-final-mark-black-a-v12.png";

export function BrandMark({ className, tone = "light" }: BrandMarkProps) {
  return (
    <Link
      href="/"
      aria-label="AVELIA — صفحه اصلی"
      className={cn(
        "group inline-flex min-h-11 items-center gap-2 focus-visible:rounded-sm sm:gap-3",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative block size-12 shrink-0 transition-transform duration-500 group-hover:scale-[1.04]",
          tone === "dark" &&
            "bg-background ring-accent/30 rounded-xl shadow-sm ring-1",
        )}
      >
        <Image
          src={logoSource}
          alt=""
          fill
          sizes="48px"
          className="object-contain"
        />
      </span>
      <span
        dir="ltr"
        className="hidden text-sm font-semibold tracking-[0.28em] sm:inline sm:text-base"
      >
        AVELIA
      </span>
    </Link>
  );
}
