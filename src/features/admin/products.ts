import "server-only";

import {
  adminProductEditorSchema,
  adminProductSummarySchema,
  adminProductWorkspaceSchema,
} from "@/features/admin/schemas";
import type { AdminCreateProductInput } from "@/features/admin/schemas";
import { productCategoryIds } from "@/features/products/types";
import { formatPersianInteger } from "@/lib/i18n/format-number";
import { formatPriceRial } from "@/lib/pricing/format-price";
import { getPrismaClient } from "@/lib/prisma/client";

type ProductCategoryId = (typeof productCategoryIds)[number];

export class AdminProductError extends Error {
  constructor(
    public readonly code:
      | "DATABASE_UNAVAILABLE"
      | "CATEGORY_NOT_FOUND"
      | "DUPLICATE_SLUG"
      | "PRODUCT_NOT_FOUND"
      | "PRODUCT_HAS_ORDERS",
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminProductError";
  }
}

function requiredPrisma() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AdminProductError(
      "DATABASE_UNAVAILABLE",
      "پایگاه داده مدیریت هنوز متصل نشده است.",
      503,
    );
  }
  return prisma;
}

function safeMoney(value: bigint) {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new Error("UNSAFE_MONEY_VALUE");
  return result;
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function isForeignKeyConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2003"
  );
}

function formatAdminPrice(priceRial: number) {
  if (priceRial % 10 === 0) return formatPriceRial(priceRial);

  return {
    rial: `${formatPersianInteger(priceRial)} ریال`,
    tomanWords: "این قیمت قدیمی برای نمایش تومان نیازمند اصلاح است.",
  };
}

function mapProductSummary(product: {
  id: string;
  name: string;
  slug: string;
  brand: string;
  priceRial: bigint;
  stock: number;
  isOriginal: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  images: string[];
  createdAt: Date;
  category: { id: string; name: string };
}) {
  const priceRial = safeMoney(product.priceRial);
  return adminProductSummarySchema.parse({
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    category: product.category,
    priceRial,
    price: formatAdminPrice(priceRial),
    stock: product.stock,
    isOriginal: product.isOriginal,
    isFeatured: product.isFeatured,
    isPublished: product.isPublished,
    image: product.images[0],
    createdAt: product.createdAt.toISOString(),
  });
}

function mapProductEditor(
  product: Parameters<typeof mapProductSummary>[0] & {
    shortDescription: string;
    description: string;
    keyFeatures: string[];
    usage: string;
    compareAtPriceRial: bigint | null;
    sortOrder: number;
  },
) {
  return adminProductEditorSchema.parse({
    ...mapProductSummary(product),
    shortDescription: product.shortDescription,
    description: product.description,
    keyFeatures: product.keyFeatures,
    usage: product.usage,
    compareAtPriceRial:
      product.compareAtPriceRial === null
        ? null
        : safeMoney(product.compareAtPriceRial),
    images: product.images,
    sortOrder: product.sortOrder,
  });
}

const productSummaryInclude = {
  category: { select: { id: true, name: true } },
} as const;

function productWriteData(input: AdminCreateProductInput) {
  return {
    name: input.name,
    slug: input.slug,
    brand: input.brand,
    categoryId: input.categoryId,
    shortDescription: input.shortDescription,
    description: input.description,
    keyFeatures: input.keyFeatures,
    usage: input.usage,
    priceRial: BigInt(input.priceRial),
    compareAtPriceRial:
      input.compareAtPriceRial === null
        ? null
        : BigInt(input.compareAtPriceRial),
    images: input.images,
    stock: input.stock,
    isOriginal: input.isOriginal,
    isFeatured: input.isFeatured,
    isPublished: input.isPublished,
    sortOrder: input.sortOrder,
  };
}

async function assertCategoryExists(categoryId: ProductCategoryId) {
  const prisma = requiredPrisma();
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) {
    throw new AdminProductError(
      "CATEGORY_NOT_FOUND",
      "دسته‌بندی انتخاب‌شده در پایگاه داده پیدا نشد.",
      409,
    );
  }
}

export async function getAdminProductWorkspace() {
  const prisma = requiredPrisma();
  const supportedCategoryIds = [
    ...productCategoryIds,
  ] satisfies ProductCategoryId[];

  const [categoryRecords, productRecords] = await Promise.all([
    prisma.category.findMany({
      where: { id: { in: supportedCategoryIds } },
      select: { id: true, name: true },
    }),
    prisma.product.findMany({
      include: productSummaryInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
    }),
  ]);

  const categoryById = new Map(
    categoryRecords.map((category) => [category.id, category]),
  );
  const categories = supportedCategoryIds.flatMap((id) => {
    const category = categoryById.get(id);
    return category ? [category] : [];
  });

  return adminProductWorkspaceSchema.parse({
    categories,
    products: productRecords.map(mapProductSummary),
  });
}

export async function createAdminProduct(input: AdminCreateProductInput) {
  const prisma = requiredPrisma();
  await assertCategoryExists(input.categoryId);

  try {
    const product = await prisma.product.create({
      data: productWriteData(input),
      include: productSummaryInclude,
    });

    return mapProductSummary(product);
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      throw new AdminProductError(
        "DUPLICATE_SLUG",
        "محصولی با این اسلاگ قبلاً ثبت شده است. یک اسلاگ دیگر وارد کنید.",
        409,
      );
    }
    throw error;
  }
}

export async function getAdminProduct(productId: string) {
  const prisma = requiredPrisma();
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: productSummaryInclude,
  });
  if (!product) {
    throw new AdminProductError(
      "PRODUCT_NOT_FOUND",
      "محصول موردنظر پیدا نشد؛ فهرست را تازه‌سازی کنید.",
      404,
    );
  }

  return mapProductEditor(product);
}

export async function updateAdminProduct(
  productId: string,
  input: AdminCreateProductInput,
) {
  const prisma = requiredPrisma();
  await assertCategoryExists(input.categoryId);

  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (!current) {
    throw new AdminProductError(
      "PRODUCT_NOT_FOUND",
      "محصول موردنظر پیدا نشد؛ فهرست را تازه‌سازی کنید.",
      404,
    );
  }

  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: productWriteData(input),
      include: productSummaryInclude,
    });

    return {
      product: mapProductSummary(product),
      previousSlug: current.slug,
    };
  } catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      throw new AdminProductError(
        "DUPLICATE_SLUG",
        "محصولی با این اسلاگ قبلاً ثبت شده است. یک اسلاگ دیگر وارد کنید.",
        409,
      );
    }
    throw error;
  }
}

export async function deleteAdminProduct(productId: string) {
  const prisma = requiredPrisma();

  try {
    return await prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { orderItems: true } },
        },
      });
      if (!product) {
        throw new AdminProductError(
          "PRODUCT_NOT_FOUND",
          "محصول موردنظر پیدا نشد؛ فهرست را تازه‌سازی کنید.",
          404,
        );
      }
      if (product._count.orderItems > 0) {
        throw new AdminProductError(
          "PRODUCT_HAS_ORDERS",
          "این محصول در سابقه سفارش‌ها استفاده شده و برای حفظ اطلاعات مالی قابل حذف نیست. می‌توانید انتشار آن را غیرفعال و موجودی را صفر کنید.",
          409,
        );
      }

      const removedCartItems = await transaction.cartItem.deleteMany({
        where: { productId },
      });
      await transaction.product.delete({ where: { id: productId } });

      return {
        deleted: true as const,
        id: product.id,
        name: product.name,
        slug: product.slug,
        removedCartItems: removedCartItems.count,
      };
    });
  } catch (error: unknown) {
    if (error instanceof AdminProductError) throw error;
    if (isForeignKeyConstraintError(error)) {
      throw new AdminProductError(
        "PRODUCT_HAS_ORDERS",
        "این محصول هم‌زمان در یک سفارش استفاده شده و برای حفظ سابقه سفارش قابل حذف نیست.",
        409,
      );
    }
    throw error;
  }
}
