import "server-only";

import { databaseProductToDomain } from "@/features/products/database-mapper";
import {
  CheckoutPricingError,
  createCheckoutPricingSnapshot,
} from "@/features/orders/checkout-pricing";
import type {
  CheckoutCustomer,
  ShippingAddress,
} from "@/features/orders/customer";
import type { OrderApiErrorCode, PublicOrder } from "@/features/orders/types";
import {
  shippingCostRial,
  type ShippingMethod,
} from "@/features/orders/shipping";
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
  userId: string;
  cartToken: string;
  idempotencyKey: string;
  customer: CheckoutCustomer;
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
};

function safeBigIntToNumber(value: bigint, field: string) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) {
    throw new Error(`${field} exceeds JavaScript's safe integer range.`);
  }
  return number;
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

  const totalPriceRial = safeBigIntToNumber(
    order.totalPriceRial,
    "Order.totalPriceRial",
  );
  const shippingCost = safeBigIntToNumber(
    order.shippingCostRial,
    "Order.shippingCostRial",
  );

  return {
    publicToken: order.publicToken,
    status: order.status,
    paymentStatus: order.payment.status,
    shippingMethod: order.shippingMethod,
    shippingCostRial: shippingCost,
    itemsSubtotalRial: totalPriceRial - shippingCost,
    totalPriceRial,
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
    select: { publicToken: true, userId: true },
  });
  if (existingOrder && existingOrder.userId !== input.userId) {
    throw new OrderServiceError(
      "UNAUTHORIZED",
      "این درخواست به حساب کاربری شما تعلق ندارد.",
      403,
    );
  }
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
            select: { publicToken: true, userId: true },
          });
          if (duplicate) {
            if (duplicate.userId !== input.userId) {
              throw new OrderServiceError(
                "UNAUTHORIZED",
                "این درخواست به حساب کاربری شما تعلق ندارد.",
                403,
              );
            }
            return duplicate.publicToken;
          }

          const cart = await transaction.cart.findUnique({
            where: { tokenHash: hashToken(input.cartToken) },
            include: {
              order: { select: { publicToken: true, userId: true } },
              items: true,
            },
          });

          if (cart?.order) {
            if (cart.order.userId !== input.userId) {
              throw new OrderServiceError(
                "UNAUTHORIZED",
                "این سبد قبلاً با حساب دیگری ثبت شده است.",
                403,
              );
            }
            return cart.order.publicToken;
          }
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

          const account = await transaction.user.findUnique({
            where: { id: input.userId },
            select: { id: true, passwordHash: true },
          });
          if (!account?.passwordHash) {
            throw new OrderServiceError(
              "UNAUTHORIZED",
              "برای ثبت سفارش دوباره وارد حساب کاربری شوید.",
              401,
            );
          }

          await transaction.user.update({
            where: { id: account.id },
            data: {
              name: input.customer.name,
              phoneNormalized: input.customer.phone,
              email: input.customer.email,
              defaultCity: input.shippingAddress.city,
              defaultAddressLine: input.shippingAddress.addressLine,
              defaultPostalCode: input.shippingAddress.postalCode,
              defaultPlaque: input.shippingAddress.plaque,
              defaultUnit: input.shippingAddress.unit ?? null,
            },
          });

          const order = await transaction.order.create({
            data: {
              publicToken: nextPublicToken,
              checkoutIdempotencyKeyHash: idempotencyHash,
              userId: account.id,
              cartId: cart.id,
              totalPriceRial:
                pricingSnapshot.totalPriceRial +
                BigInt(shippingCostRial(input.shippingMethod)),
              shippingMethod: input.shippingMethod,
              shippingCostRial: shippingCostRial(input.shippingMethod),
              recipientName: input.customer.name,
              recipientPhoneNormalized: input.customer.phone,
              recipientEmail: input.customer.email,
              shippingCity: input.shippingAddress.city,
              shippingAddressLine: input.shippingAddress.addressLine,
              shippingPostalCode: input.shippingAddress.postalCode,
              shippingPlaque: input.shippingAddress.plaque,
              shippingUnit: input.shippingAddress.unit ?? null,
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
          select: { publicToken: true, userId: true },
        });
        if (duplicate) {
          if (duplicate.userId !== input.userId) {
            throw new OrderServiceError(
              "UNAUTHORIZED",
              "این سفارش به حساب کاربری شما تعلق ندارد.",
              403,
            );
          }
          publicToken = duplicate.publicToken;
        } else {
          throw new OrderServiceError(
            "PROFILE_CONFLICT",
            "این ایمیل یا شماره موبایل به حساب دیگری تعلق دارد.",
            409,
          );
        }
      }

      if (!publicToken) throw error;
    }
  }

  return publicOrderByToken(publicToken);
}

export async function findPublicOrder(publicToken: string) {
  return publicOrderByToken(publicToken);
}
