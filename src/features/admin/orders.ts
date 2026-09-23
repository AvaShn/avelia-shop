import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { z } from "zod";

import {
  adminOrderDetailSchema,
  adminOrderSummarySchema,
} from "@/features/admin/schemas";
import type { adminOrdersQuerySchema } from "@/features/admin/schemas";
import {
  commitReservedInventory,
  releaseReservedInventory,
} from "@/features/orders/inventory";
import {
  assertOrderTransition,
  assertPaymentTransition,
} from "@/features/orders/status-transitions";
import { decodeCursor, encodeCursor } from "@/lib/api/cursor";
import { formatPriceRial } from "@/lib/pricing/format-price";
import { getPrismaClient } from "@/lib/prisma/client";

type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

export class AdminOrderError extends Error {
  constructor(
    public readonly code:
      | "DATABASE_UNAVAILABLE"
      | "INVALID_CURSOR"
      | "ORDER_NOT_FOUND"
      | "INVALID_TRANSITION",
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AdminOrderError";
  }
}

function requiredPrisma() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AdminOrderError(
      "DATABASE_UNAVAILABLE",
      "پایگاه داده مدیریت هنوز متصل نشده است.",
      503,
    );
  }
  return prisma;
}

function safeMoney(value: bigint) {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error("UNSAFE_MONEY_VALUE");
  return number;
}

function mapSummary(order: {
  id: string;
  publicToken: string;
  status: "PENDING_PAYMENT" | "WAITING_REVIEW" | "PAID" | "REJECTED";
  totalPriceRial: bigint;
  recipientName: string;
  recipientPhoneNormalized: string;
  recipientEmail: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    telegramId: string | null;
  };
  payment: {
    status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
    receiptObjectKey: string | null;
    telegramFileId: string | null;
  } | null;
  _count: { items: number };
}) {
  if (!order.payment) throw new Error("ORDER_PAYMENT_MISSING");
  const totalPriceRial = safeMoney(order.totalPriceRial);

  return adminOrderSummarySchema.parse({
    publicToken: order.publicToken,
    status: order.status,
    paymentStatus: order.payment.status,
    customer: {
      name: order.recipientName,
      phone: order.recipientPhoneNormalized,
      email: order.recipientEmail,
      telegramConnected: Boolean(order.user.telegramId),
    },
    totalPriceRial,
    totalPrice: formatPriceRial(totalPriceRial),
    itemCount: order._count.items,
    receiptAvailable: Boolean(
      order.payment.receiptObjectKey || order.payment.telegramFileId,
    ),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  });
}

const summaryInclude = {
  user: true,
  payment: true,
  _count: { select: { items: true } },
} satisfies Prisma.OrderInclude;

export async function listAdminOrders(query: AdminOrdersQuery) {
  const prisma = requiredPrisma();
  const cursorId = query.cursor ? decodeCursor(query.cursor) : null;
  if (query.cursor && !cursorId) {
    throw new AdminOrderError(
      "INVALID_CURSOR",
      "صفحهٔ درخواستی معتبر نیست؛ فهرست را از ابتدا باز کنید.",
      400,
    );
  }
  if (cursorId) {
    const cursorExists = await prisma.order.findUnique({
      where: { id: cursorId },
      select: { id: true },
    });
    if (!cursorExists) {
      throw new AdminOrderError(
        "INVALID_CURSOR",
        "صفحهٔ درخواستی دیگر در دسترس نیست.",
        400,
      );
    }
  }

  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.paymentStatus
      ? { payment: { is: { status: query.paymentStatus } } }
      : {}),
    ...(query.q
      ? {
          OR: [
            {
              publicToken: { contains: query.q, mode: "insensitive" as const },
            },
            {
              recipientName: {
                contains: query.q,
                mode: "insensitive" as const,
              },
            },
            { recipientPhoneNormalized: { contains: query.q } },
            {
              recipientEmail: {
                contains: query.q,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  } satisfies Prisma.OrderWhereInput;

  const [records, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: summaryInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    }),
    prisma.order.count({ where }),
  ]);
  const hasNextPage = records.length > query.limit;
  const page = hasNextPage ? records.slice(0, query.limit) : records;

  return {
    orders: page.map(mapSummary),
    total,
    nextCursor:
      hasNextPage && page.length > 0
        ? encodeCursor(page[page.length - 1]!.id)
        : null,
  };
}

export async function getAdminOrder(publicToken: string) {
  const prisma = requiredPrisma();
  const order = await prisma.order.findUnique({
    where: { publicToken },
    include: {
      ...summaryInclude,
      items: {
        include: { product: { select: { slug: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order || !order.payment) {
    throw new AdminOrderError(
      "ORDER_NOT_FOUND",
      "سفارش موردنظر پیدا نشد.",
      404,
    );
  }

  const summary = mapSummary(order);
  return adminOrderDetailSchema.parse({
    ...summary,
    items: order.items.map((item) => {
      const unitPriceRial = safeMoney(item.unitPriceRial);
      const lineTotalRial = unitPriceRial * item.quantity;
      return {
        product: item.product,
        quantity: item.quantity,
        unitPriceRial,
        unitPrice: formatPriceRial(unitPriceRial),
        lineTotalRial,
        lineTotal: formatPriceRial(lineTotalRial),
      };
    }),
    inventoryReservationExpiresAt:
      order.inventoryReservationExpiresAt.toISOString(),
    inventoryCommittedAt: order.inventoryCommittedAt?.toISOString() ?? null,
    inventoryReleasedAt: order.inventoryReleasedAt?.toISOString() ?? null,
    rejectionReason: order.rejectionReason,
    delivery: {
      city: order.shippingCity,
      addressLine: order.shippingAddressLine,
      postalCode: order.shippingPostalCode,
      plaque: order.shippingPlaque,
      unit: order.shippingUnit,
    },
    receiptPath: summary.receiptAvailable
      ? `/api/admin/orders/${encodeURIComponent(publicToken)}/receipt`
      : null,
    review: {
      reviewedAt: order.payment.reviewedAt?.toISOString() ?? null,
      reviewedBy: order.payment.reviewedBy,
      note: order.payment.reviewNote,
    },
  });
}

export async function reviewAdminOrderPayment(
  publicToken: string,
  action: "APPROVE" | "REJECT",
  reviewedBy: string,
  note?: string,
) {
  const prisma = requiredPrisma();
  const order = await prisma.order.findUnique({
    where: { publicToken },
    include: { payment: true },
  });
  if (!order || !order.payment) {
    throw new AdminOrderError(
      "ORDER_NOT_FOUND",
      "سفارش موردنظر پیدا نشد.",
      404,
    );
  }

  try {
    if (action === "APPROVE") {
      if (order.inventoryReservationExpiresAt <= new Date()) {
        throw new Error("EXPIRED_RESERVATION");
      }
      assertOrderTransition(order.status, "PAID");
      assertPaymentTransition(order.payment.status, "APPROVED");
      if (!(await commitReservedInventory(order.id, reviewedBy, note))) {
        throw new Error("CONCURRENT_TRANSITION");
      }
    } else {
      assertOrderTransition(order.status, "REJECTED");
      assertPaymentTransition(order.payment.status, "REJECTED");
      if (
        !(await releaseReservedInventory(
          order.id,
          note || "پرداخت سفارش توسط مدیریت تأیید نشد.",
          reviewedBy,
        ))
      ) {
        throw new Error("CONCURRENT_TRANSITION");
      }
    }
  } catch {
    throw new AdminOrderError(
      "INVALID_TRANSITION",
      "وضعیت این سفارش تغییر کرده است؛ صفحه را تازه‌سازی کنید.",
      409,
    );
  }

  return getAdminOrder(publicToken);
}

export async function getAdminReceiptReference(publicToken: string) {
  const prisma = requiredPrisma();
  const order = await prisma.order.findUnique({
    where: { publicToken },
    select: {
      payment: {
        select: { receiptObjectKey: true, telegramFileId: true },
      },
    },
  });
  if (!order?.payment) {
    throw new AdminOrderError(
      "ORDER_NOT_FOUND",
      "رسید این سفارش پیدا نشد.",
      404,
    );
  }
  return order.payment;
}
