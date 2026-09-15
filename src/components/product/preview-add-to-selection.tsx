"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type PreviewAddToSelectionProps = {
  productName: string;
  isAvailable?: boolean;
  className?: string;
};

export function PreviewAddToSelection({
  productName,
  isAvailable = true,
  className,
}: PreviewAddToSelectionProps) {
  return (
    <Button
      variant="outline"
      className={className ?? "mt-5 w-full"}
      disabled={!isAvailable}
      onClick={() =>
        toast("سبد خرید در فاز ۶ فعال می‌شود", {
          description: `${productName} اکنون در کاتالوگ قابل مشاهده است.`,
        })
      }
    >
      {isAvailable ? "افزودن به انتخاب‌ها" : "موقتاً ناموجود"}
      {isAvailable ? <Plus aria-hidden="true" /> : null}
    </Button>
  );
}
