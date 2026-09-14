import type * as React from "react";

import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn(
        "avelia-skeleton bg-muted relative overflow-hidden rounded-md",
        "after:absolute after:inset-0 after:bg-gradient-to-l after:from-transparent after:via-white/55 after:to-transparent",
        className,
      )}
      {...props}
    />
  );
}
