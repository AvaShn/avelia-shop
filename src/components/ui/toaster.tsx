"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      dir="rtl"
      position="top-center"
      closeButton
      toastOptions={{
        duration: 4500,
        classNames: {
          toast:
            "!border-border !bg-surface !text-foreground !rounded-lg !shadow-lifted !font-sans",
          description: "!text-muted-foreground",
          closeButton: "!border-border !bg-surface !text-foreground",
        },
      }}
    />
  );
}
