import { z } from "zod";

import { productCategoryIds } from "@/features/products/types";
import { shippingMethodSchema } from "@/features/orders/shipping";
import { cursorSchema } from "@/lib/api/cursor";

export const adminLoginSchema = z.object({
  email: z.email("ایمیل مدیریت معتبر نیست."),
  password: z
    .string()
    .min(12, "رمز عبور مدیریت باید دست‌کم ۱۲ نویسه داشته باشد.")
    .max(200),
});

export const adminOrdersQuerySchema = z.object({
  status: z
    .enum(["PENDING_PAYMENT", "WAITING_REVIEW", "PAID", "REJECTED"])
    .optional(),
  paymentStatus: z
    .enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"])
    .optional(),
  q: z.string().trim().max(100).default(""),
  cursor: cursorSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const adminPaymentReviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(500).optional(),
});

const productImagePathSchema = z
  .string()
  .trim()
  .min(1, "حداقل یک آدرس تصویر وارد کنید.")
  .max(2_048, "آدرس تصویر بیش از حد طولانی است.")
  .refine(
    (value) =>
      /^\/(?!\/)[^\s]+$/.test(value) ||
      (() => {
        try {
          const url = new URL(value);
          return url.protocol === "https:";
        } catch {
          return false;
        }
      })(),
    "آدرس تصویر باید با / شروع شود یا یک آدرس امن https باشد.",
  );

export const adminCreateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "نام محصول را وارد کنید.")
      .max(160, "نام محصول بیش از حد طولانی است."),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "اسلاگ باید دست‌کم ۳ نویسه داشته باشد.")
      .max(120, "اسلاگ بیش از حد طولانی است.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "اسلاگ فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و خط تیره باشد.",
      ),
    brand: z.string().trim().min(2, "نام برند را وارد کنید.").max(120),
    categoryId: z.enum(productCategoryIds, {
      error: "دسته‌بندی محصول معتبر نیست.",
    }),
    shortDescription: z
      .string()
      .trim()
      .min(10, "توضیح کوتاه باید دست‌کم ۱۰ نویسه داشته باشد.")
      .max(300, "توضیح کوتاه بیش از حد طولانی است."),
    description: z
      .string()
      .trim()
      .min(30, "توضیحات کامل باید دست‌کم ۳۰ نویسه داشته باشد.")
      .max(5_000, "توضیحات کامل بیش از حد طولانی است."),
    keyFeatures: z
      .array(z.string().trim().min(2).max(200))
      .min(1, "حداقل یک ویژگی کلیدی وارد کنید.")
      .max(12, "حداکثر ۱۲ ویژگی کلیدی قابل ثبت است."),
    usage: z
      .string()
      .trim()
      .min(10, "روش استفاده باید دست‌کم ۱۰ نویسه داشته باشد.")
      .max(2_000, "روش استفاده بیش از حد طولانی است."),
    priceRial: z
      .number()
      .int("قیمت باید عدد صحیح باشد.")
      .positive("قیمت محصول باید بیشتر از صفر باشد.")
      .safe("قیمت محصول بیش از محدوده مجاز است.")
      .multipleOf(10, "قیمت ریالی باید بر ۱۰ بخش‌پذیر باشد."),
    compareAtPriceRial: z
      .number()
      .int("قیمت قبل از تخفیف باید عدد صحیح باشد.")
      .positive("قیمت قبل از تخفیف باید بیشتر از صفر باشد.")
      .safe("قیمت قبل از تخفیف بیش از محدوده مجاز است.")
      .multipleOf(10, "قیمت قبل از تخفیف باید بر ۱۰ بخش‌پذیر باشد.")
      .nullable(),
    images: z
      .array(productImagePathSchema)
      .min(1, "حداقل یک تصویر وارد کنید.")
      .max(8, "حداکثر ۸ تصویر برای هر محصول قابل ثبت است."),
    stock: z
      .number()
      .int("موجودی باید عدد صحیح باشد.")
      .min(0, "موجودی نمی‌تواند منفی باشد.")
      .max(1_000_000),
    isOriginal: z.boolean(),
    isFeatured: z.boolean(),
    isPublished: z.boolean(),
    sortOrder: z.number().int().min(-10_000).max(10_000),
  })
  .superRefine((product, context) => {
    if (
      product.compareAtPriceRial !== null &&
      product.compareAtPriceRial <= product.priceRial
    ) {
      context.addIssue({
        code: "custom",
        path: ["compareAtPriceRial"],
        message: "قیمت قبل از تخفیف باید بیشتر از قیمت فروش باشد.",
      });
    }
  });

export const adminProductCategorySchema = z.object({
  id: z.enum(productCategoryIds),
  name: z.string(),
});

export const adminProductSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  brand: z.string(),
  category: adminProductCategorySchema,
  priceRial: z.number().int().positive(),
  price: z.object({ rial: z.string(), tomanWords: z.string() }),
  stock: z.number().int().nonnegative(),
  isOriginal: z.boolean(),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  image: z.string(),
  createdAt: z.string().datetime(),
});

export const adminProductWorkspaceSchema = z.object({
  categories: z.array(adminProductCategorySchema),
  products: z.array(adminProductSummarySchema),
});

export const adminProductEditorSchema = adminProductSummarySchema.extend({
  shortDescription: z.string(),
  description: z.string(),
  keyFeatures: z.array(z.string()),
  usage: z.string(),
  compareAtPriceRial: z.number().int().positive().nullable(),
  images: z.array(z.string()),
  sortOrder: z.number().int(),
});

export const adminProductIdSchema = z
  .string()
  .trim()
  .min(1, "شناسهٔ محصول معتبر نیست.")
  .max(200, "شناسهٔ محصول معتبر نیست.");

const formattedPriceSchema = z.object({
  rial: z.string(),
  tomanWords: z.string(),
});

const adminOrderCustomerSchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  telegramConnected: z.boolean(),
});

export const adminOrderSummarySchema = z.object({
  publicToken: z.string(),
  status: z.enum(["PENDING_PAYMENT", "WAITING_REVIEW", "PAID", "REJECTED"]),
  paymentStatus: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"]),
  customer: adminOrderCustomerSchema,
  totalPriceRial: z.number().int().nonnegative(),
  totalPrice: formattedPriceSchema,
  shippingMethod: shippingMethodSchema,
  shippingCostRial: z.number().int().nonnegative(),
  shippingCost: formattedPriceSchema,
  itemCount: z.number().int().nonnegative(),
  receiptAvailable: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const adminOrderDetailSchema = adminOrderSummarySchema.extend({
  items: z.array(
    z.object({
      product: z.object({ slug: z.string(), name: z.string() }),
      quantity: z.number().int().positive(),
      unitPriceRial: z.number().int().nonnegative(),
      unitPrice: formattedPriceSchema,
      lineTotalRial: z.number().int().nonnegative(),
      lineTotal: formattedPriceSchema,
    }),
  ),
  inventoryReservationExpiresAt: z.string().datetime(),
  inventoryCommittedAt: z.string().datetime().nullable(),
  inventoryReleasedAt: z.string().datetime().nullable(),
  rejectionReason: z.string().nullable(),
  delivery: z.object({
    city: z.string(),
    addressLine: z.string(),
    postalCode: z.string(),
    plaque: z.string(),
    unit: z.string().nullable(),
  }),
  receiptPath: z.string().nullable(),
  review: z.object({
    reviewedAt: z.string().datetime().nullable(),
    reviewedBy: z.string().nullable(),
    note: z.string().nullable(),
  }),
});

export type AdminOrderSummary = z.infer<typeof adminOrderSummarySchema>;
export type AdminOrderDetail = z.infer<typeof adminOrderDetailSchema>;
export type AdminCreateProductInput = z.infer<typeof adminCreateProductSchema>;
export type AdminProductCategory = z.infer<typeof adminProductCategorySchema>;
export type AdminProductSummary = z.infer<typeof adminProductSummarySchema>;
export type AdminProductWorkspace = z.infer<typeof adminProductWorkspaceSchema>;
export type AdminProductEditor = z.infer<typeof adminProductEditorSchema>;
