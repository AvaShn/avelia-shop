import * as React from "react";

import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-border bg-surface text-foreground placeholder:text-muted-foreground h-12 w-full rounded-md border px-4 text-base shadow-none transition-[border-color,box-shadow,background-color] duration-300 outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
        "focus-visible:border-accent focus-visible:ring-accent/20 focus-visible:ring-4",
        "aria-invalid:border-danger aria-invalid:ring-danger/15",
        className,
      )}
      {...props}
    />
  );
}
