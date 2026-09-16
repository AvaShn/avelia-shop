import "server-only";

import { databaseProductToDomain } from "@/features/products/database-mapper";
import {
  CheckoutPricingError,
  createCheckoutPricingSnapshot,
} from "@/features/orders/checkout-pricing";
import type { CheckoutCustomer } from "@/features/orders/customer";
import type { OrderApiErrorCode, PublicOrder } from "@/features/orders/types";
import { serverEnvironment } from "@/lib/env/server";
import { getPrismaClient } from "@/lib/prisma/client";
import {
  createOpaqueToken,
  createPaymentSessionToken,
  hashToken,
} from "@/lib/security/tokens";

export class OrderServiceError extends Error {
  constructor(
    public readonly code: OrderApiErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "OrderServiceError";
  }
}

type CreateOrderInput = {
  cartToken: string;
  idempotencyKey: string;
  customer: CheckoutCustomer;
};

function safeBigIntToNumber(value: bigint, field: string) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) {
    throw new Error(`${field} exceeds JavaScript's safe integer range.`);
  }
  return number;
}

function buildTelegramUrl(paymentSessionToken: string) {
  const username = serverEnvironment.TELEGRAM_BOT_USERNAME;
  if (!username) return undefined;

  const url = new URL(`https://t.me/${username.replace(/^@/, "")}`);
  url.searchParams.set("start", paymentSessionToken);
  return url.toString();
}

export function telegramPaymentUrlForOrder(publicOrderToken: string) {
  const secret = serverEnvironment.PAYMENT_SESSION_SECRET;
  if (!secret) return undefined;

  return buildTelegramUrl(createPaymentSessionToken(publicOrderToken, secret));
}

async function publicOrderByToken(publicToken: string): Promise<PublicOrder> {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new OrderServiceError(
      "DATABASE_UNAVAILABLE",
      "ثبت سفارش پس از اتصال پایگاه داده فعال می‌شود.",
      503,
    );
  }

  const order = await prisma.order.findUnique({
    where: { publicToken },
    include: {
      payment: true,
      items: {
        include: { product: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!order || !order.payment) {
    throw new OrderServiceError(
      "ORDER_NOT_FOUND",
      "سفارش موردنظر پیدا نشد.",
      404,
    );
  }

  return {
    publicToken: order.publicToken,
    status: order.status,
    paymentStatus: order.payment.status,
    totalPriceRial: safeBigIntToNumber(
      order.totalPriceRial,
      "Order.totalPriceRial",
    ),
    items: order.items.map((item) => {
      const product = databaseProductToDomain(item.product);
      const image = product.images[0];
      const unitPriceRial = safeBigIntToNumber(
        item.unitPriceRial,
        "OrderItem.unitPriceRial",
      );

      if (!image) throw new Error("ORDER_PRODUCT_IMAGE_MISSING");

      return {
        product: {
          slug: product.slug,
          name: product.name,
          image: image.src,
          imageAlt: image.alt,
        },
        quantity: item.quantity,
        unitPriceRial,
        lineTotalRial: unitPriceRial * item.quantity,
      };
    }),
    inventoryReservationExpiresAt:
      order.inventoryReservationExpiresAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
  };
}

function isPrismaUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function createOrderFromCart(input: CreateOrderInput) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new OrderServiceError(
      "DATABASE_UNAVAILABLE",
      "ثبت سفارش پس از اتصال پایگاه داده فعال می‌شود.",
      503,
    );
  }

  const sessionSecret = serverEnvironment.PAYMENT_SESSION_SECRET;
  if (!sessionSecret) {
    throw new OrderServiceError(
      "CONFIGURATION_ERROR",
      "تنظیمات امن ادامهٔ پرداخت هنوز کامل نشده است.",
      503,
    );
  }

  const idempotencyHash = hashToken(input.idempotencyKey);
  const existingOrder = await prisma.order.findUnique({
    where: { checkoutIdempotencyKeyHash: idempotencyHash },
    select: { publicToken: true },
  });
  const reservationExpiresAt = new Date(
    Date.now() + serverEnvironment.ORDER_RESERVATION_MINUTES * 60 * 1000,
  );
  let publicToken = existingOrder?.publicToken;

  if (!publicToken) {
    const nextPublicToken = createOpaqueToken();
    const paymentSessionToken = createPaymentSessionToken(
      nextPublicToken,
      sessionSecret,
    );

    try {
      publicToken = await prisma.$transaction(
        async (transaction) => {
          const duplicate = await transaction.order.findUnique({
            where: { checkoutIdempotencyKeyHash: idempotencyHash },
            select: { publicToken: true },
          });
          if (duplicate) return duplicate.publicToken;

          const cart = await transaction.cart.findUnique({
            where: { tokenHash: hashToken(input.cartToken) },
            include: {
              order: { select: { publicToken: true } },
              items: true,
            },
          });

          if (cart?.order) return cart.order.publicToken;
          if (
            !cart ||
            cart.checkedOutAt ||
            cart.expiresAt <= new Date() ||
            cart.items.length === 0
          ) {
            throw new OrderServiceError(
              "EMPTY_CART",
              "برای ثبت سفارش، ابتدا محصولی به سبد خود اضافه کنید.",
              409,
            );
          }

          const productIds = cart.items.map((item) => item.productId);
          const products = await transaction.product.findMany({
            where: { id: { in: productIds } },
          });
          let pricingSnapshot;
          try {
            pricingSnapshot = createCheckoutPricingSnapshot(
              cart.items,
              products,
            );
          } catch (error: unknown) {
            if (error instanceof CheckoutPricingError) {
              throw new OrderServiceError(
                "STOCK_CHANGED",
                error.code === "OUT_OF_STOCK"
                  ? "موجودی یکی از محصولات تغییر کرده است؛ لطفاً سبد را بررسی کنید."
                  : "یکی از محصولات سبد دیگر قابل سفارش نیست.",
                409,
              );
            }
            throw error;
          }

          if (products.length !== cart.items.length) {
            throw new OrderServiceError(
              "STOCK_CHANGED",
              "یکی از محصولات سبد دیگر قابل سفارش نیست.",
              409,
            );
          }

          for (const item of cart.items) {
            const reserved = await transaction.product.updateMany({
              where: {
                id: item.productId,
                isPublished: true,
                stock: { gte: item.quantity },
              },
              data: { stock: { decrement: item.quantity } },
            });

            if (reserved.count !== 1) {
              throw new OrderServiceError(
                "STOCK_CHANGED",
                "موجودی یکی از محصولات تغییر کرده است؛ لطفاً سبد را بررسی کنید.",
                409,
              );
            }
          }

          const user = await transaction.user.upsert({
            where: { phoneNormalized: input.customer.phone },
            create: {
              name: input.customer.name,
              phoneNormalized: input.customer.phone,
              email: input.customer.email ?? null,
            },
            update: {
              name: input.customer.name,
              ...(input.customer.email ? { email: input.customer.email } : {}),
            },
          });

          const order = await transaction.order.create({
            data: {
              publicToken: nextPublicToken,
              checkoutIdempotencyKeyHash: idempotencyHash,
              userId: user.id,
              cartId: cart.id,
              totalPriceRial: pricingSnapshot.totalPriceRial,
              inventoryReservationExpiresAt: reservationExpiresAt,
              items: {
                create: pricingSnapshot.lines.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  unitPriceRial: item.unitPriceRial,
                })),
              },
              payment: {
                create: {
                  paymentSessionTokenHash: hashToken(paymentSessionToken),
                  sessionExpiresAt: reservationExpiresAt,
                },
              },
            },
          });

          await transaction.cart.update({
            where: { id: cart.id },
            data: { checkedOutAt: new Date() },
          });

          return order.publicToken;
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error: unknown) {
      if (error instanceof OrderServiceError) throw error;

      if (isPrismaUniqueConstraintError(error)) {
        const duplicate = await prisma.order.findFirst({
          where: {
            OR: [
              { checkoutIdempotencyKeyHash: idempotencyHash },
              { cart: { tokenHash: hashToken(input.cartToken) } },
            ],
          },
          select: { publicToken: true },
        });
        if (duplicate) publicToken = duplicate.publicToken;
      }

      if (!publicToken) throw error;
    }
  }

  const order = await publicOrderByToken(publicToken);
  const telegramUrl = telegramPaymentUrlForOrder(publicToken);

  return {
    ...order,
    ...(telegramUrl ? { telegramUrl } : {}),
  };
}

export async function findPublicOrder(publicToken: string) {
  return publicOrderByToken(publicToken);
}
