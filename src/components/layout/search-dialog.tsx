"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function SearchDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="جست‌وجو">
          <Search aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>جست‌وجو در مجموعه</DialogTitle>
          <DialogDescription>
            نام محصول، برند یا دسته‌بندی موردنظر خود را وارد کنید.
          </DialogDescription>
        </DialogHeader>
        <label htmlFor="site-search" className="sr-only">
          عبارت جست‌وجو
        </label>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2"
          />
          <Input
            id="site-search"
            type="search"
            placeholder="برای مثال: عطر، مراقبت پوست..."
            className="ps-12"
            autoComplete="off"
          />
        </div>
        <p className="text-muted-foreground text-sm leading-7">
          جست‌وجوی محصولات در فاز فروشگاه فعال خواهد شد.
        </p>
      </DialogContent>
    </Dialog>
  );
}
