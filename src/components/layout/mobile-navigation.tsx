"use client";

import Link from "next/link";
import { ArrowLeft, Menu } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const mobileNavigation = [
  { label: "صفحه اصلی", href: "/" },
  { label: "مجموعه محصولات", href: "/products" },
  { label: "داستان AVELIA", href: "/#brand-story" },
  { label: "ارتباط با ما", href: "/contact" },
] as const;

export function MobileNavigation() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="باز کردن منوی اصلی"
          className="lg:hidden"
        >
          <Menu aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent
        aria-describedby="mobile-menu-description"
        className="avelia-sheet-content top-0 right-0 bottom-0 left-auto h-dvh w-[min(88vw,26rem)] max-w-none translate-x-0 translate-y-0 content-start rounded-none border-y-0 border-e-0 p-6 sm:p-9"
      >
        <DialogHeader className="border-border/70 border-b pb-6">
          <DialogTitle className="sr-only">منوی اصلی</DialogTitle>
          <DialogDescription id="mobile-menu-description" className="sr-only">
            دسترسی به بخش‌های اصلی فروشگاه
          </DialogDescription>
          <BrandMark />
        </DialogHeader>
        <nav aria-label="پیمایش موبایل" className="mt-8">
          <ul className="divide-border/70 divide-y">
            {mobileNavigation.map((item) => (
              <li key={item.href}>
                <DialogClose asChild>
                  <Link
                    href={item.href}
                    className="group flex min-h-16 items-center justify-between gap-4 py-4 text-lg font-medium"
                  >
                    {item.label}
                    <ArrowLeft
                      aria-hidden="true"
                      className="text-accent size-4 transition-transform duration-500 group-hover:-translate-x-1"
                    />
                  </Link>
                </DialogClose>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-muted-foreground mt-auto pt-10 text-sm leading-7">
          انتخابی آرام، دقیق و قابل اعتماد.
        </p>
      </DialogContent>
    </Dialog>
  );
}
