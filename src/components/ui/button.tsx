import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium transition-[color,background-color,border-color,transform,box-shadow] duration-500 ease-[var(--ease-avelia)] outline-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-neutral-800 hover:shadow-soft",
        secondary:
          "bg-accent-soft text-accent-foreground hover:bg-accent hover:text-primary",
        outline:
          "border-border bg-transparent text-foreground border hover:border-primary hover:bg-primary hover:text-primary-foreground",
        ghost: "text-foreground hover:bg-muted",
        destructive: "bg-danger text-white hover:brightness-90",
      },
      size: {
        default: "h-12",
        sm: "h-11 px-4",
        lg: "h-14 px-7 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { buttonVariants };
