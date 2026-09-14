import type * as React from "react";

import { cn } from "@/lib/utils/cn";

export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-12 xl:px-16",
        className,
      )}
      {...props}
    />
  );
}
