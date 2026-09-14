"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type PreviewAddToSelectionProps = {
  productName: string;
};

export function PreviewAddToSelection({
  productName,
}: PreviewAddToSelectionProps) {
  return (
    <Button
      variant="outline"
      className="mt-5 w-full"
      onClick={() =>
        toast("انتخاب محصول در مرحله‌ی بعد فعال می‌شود", {
          description: `${productName} پس از اتصال کاتالوگ قابل انتخاب خواهد بود.`,
        })
      }
    >
      افزودن به انتخاب‌ها
      <Plus aria-hidden="true" />
    </Button>
  );
}
