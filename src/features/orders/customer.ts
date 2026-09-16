import { z } from "zod";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function toLatinDigits(value: string) {
  return [...value]
    .map((character) => {
      const persianIndex = persianDigits.indexOf(character);
      if (persianIndex >= 0) return String(persianIndex);

      const arabicIndex = arabicDigits.indexOf(character);
      if (arabicIndex >= 0) return String(arabicIndex);

      return character;
    })
    .join("");
}

export function normalizeIranianMobile(value: string) {
  const digits = toLatinDigits(value).replace(/[^+\d]/g, "");
  const withoutInternationalPrefix = digits.startsWith("0098")
    ? `+98${digits.slice(4)}`
    : digits;
  const normalized = withoutInternationalPrefix.startsWith("09")
    ? `+98${withoutInternationalPrefix.slice(1)}`
    : withoutInternationalPrefix.startsWith("989")
      ? `+${withoutInternationalPrefix}`
      : withoutInternationalPrefix;

  if (!/^\+989\d{9}$/.test(normalized)) {
    throw new Error("INVALID_IRANIAN_MOBILE");
  }

  return normalized;
}

const optionalEmailSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.email("ایمیل واردشده معتبر نیست.").optional(),
);

export const checkoutCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "نام و نام خانوادگی را کامل وارد کنید.")
    .max(100, "نام واردشده بیش از حد طولانی است."),
  phone: z
    .string()
    .trim()
    .transform((value, context) => {
      try {
        return normalizeIranianMobile(value);
      } catch {
        context.addIssue({
          code: "custom",
          message: "شماره موبایل را با قالب معتبر ایران وارد کنید.",
        });
        return z.NEVER;
      }
    }),
  email: optionalEmailSchema,
});

export type CheckoutCustomer = z.infer<typeof checkoutCustomerSchema>;
