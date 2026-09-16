"use client";

import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/cart-provider";

type AddToCartButtonProps = {
  productId: string;
  productName: string;
  isAvailable?: boolean;
  className?: string;
};

export function AddToCartButton({
  productId,
  productName,
  isAvailable = true,
  className,
}: AddToCartButtonProps) {
  const { addItem, isLoading, pendingProductId } = useCart();
  const isPending = pendingProductId === productId;

  return (
    <Button
      variant="outline"
      className={className ?? "mt-5 w-full"}
      disabled={!isAvailable || isPending || isLoading}
      onClick={() => {
        void addItem(productId)
          .then(() => {
            toast("به سبد انتخاب‌ها اضافه شد", {
              description: `${productName} در سبد شماست.`,
              action: {
                label: "مشاهده سبد",
                onClick: () => window.location.assign("/cart"),
              },
            });
          })
          .catch((reason: unknown) => {
            toast.error("افزودن محصول انجام نشد", {
              description:
                reason instanceof Error
                  ? reason.message
                  : "لطفاً دوباره تلاش کنید.",
            });
          });
      }}
    >
      {isPending ? (
        <>
          در حال افزودن
          <LoaderCircle className="animate-spin" aria-hidden="true" />
        </>
      ) : isAvailable ? (
        <>
          افزودن به انتخاب‌ها
          <Plus aria-hidden="true" />
        </>
      ) : (
        "موقتاً ناموجود"
      )}
    </Button>
  );
}
