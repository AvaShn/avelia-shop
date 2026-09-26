import { z } from "zod";

export const POST_SHIPPING_COST_RIAL = 1_500_000;

export const shippingMethodSchema = z.enum(["POST", "TIPAX"], {
  error: "روش ارسال معتبر نیست.",
});

export type ShippingMethod = z.infer<typeof shippingMethodSchema>;

export const shippingMethodLabels: Record<ShippingMethod, string> = {
  POST: "پست پیشتاز",
  TIPAX: "تیپاکس؛ پرداخت کرایه درب منزل",
};

export function shippingCostRial(method: ShippingMethod) {
  return method === "POST" ? POST_SHIPPING_COST_RIAL : 0;
}
