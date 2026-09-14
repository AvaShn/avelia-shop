"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DesignSystemActions() {
  return (
    <div className="border-border/70 mt-8 flex flex-wrap gap-3 border-t pt-7">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">نمایش پنجره</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>انتخاب شما با دقت ثبت می‌شود</DialogTitle>
            <DialogDescription>
              ساختار پنجره‌ها برای پیام‌های کوتاه، روشن و قابل اعتماد طراحی شده
              است؛ بدون شلوغی یا تصمیم‌های اضافی.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <Button
        variant="ghost"
        onClick={() =>
          toast.success("انتخاب شما ثبت شد", {
            description: "می‌توانید با آرامش به مرور مجموعه ادامه دهید.",
          })
        }
      >
        نمایش پیام
      </Button>
    </div>
  );
}
