import "server-only";

import { getPrismaClient } from "@/lib/prisma/client";

export async function releaseReservedInventory(
  orderId: string,
  reason: string,
  reviewedBy?: string,
) {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("DATABASE_CLIENT_UNAVAILABLE");

  return prisma.$transaction(async (transaction) => {
    const claimed = await transaction.order.updateMany({
      where: {
        id: orderId,
        status: { in: ["PENDING_PAYMENT", "WAITING_REVIEW"] },
        inventoryCommittedAt: null,
        inventoryReleasedAt: null,
      },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        inventoryReleasedAt: new Date(),
      },
    });

    if (claimed.count === 0) return false;

    const items = await transaction.orderItem.findMany({
      where: { orderId },
    });
    for (const item of items) {
      await transaction.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await transaction.payment.updateMany({
      where: {
        orderId,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        ...(reviewedBy ? { reviewedBy } : {}),
        reviewNote: reason,
      },
    });

    return true;
  });
}

export async function releaseExpiredInventoryReservations(limit = 100) {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("DATABASE_CLIENT_UNAVAILABLE");

  const expiredOrders = await prisma.order.findMany({
    where: {
      status: { in: ["PENDING_PAYMENT", "WAITING_REVIEW"] },
      inventoryReservationExpiresAt: { lte: new Date() },
      inventoryCommittedAt: null,
      inventoryReleasedAt: null,
    },
    select: { id: true },
    orderBy: { inventoryReservationExpiresAt: "asc" },
    take: Math.min(Math.max(limit, 1), 500),
  });

  const results = await Promise.all(
    expiredOrders.map((order) =>
      releaseReservedInventory(order.id, "مهلت پرداخت سفارش به پایان رسید."),
    ),
  );

  return results.filter(Boolean).length;
}

export async function commitReservedInventory(
  orderId: string,
  reviewedBy: string,
  reviewNote?: string,
) {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("DATABASE_CLIENT_UNAVAILABLE");

  return prisma.$transaction(async (transaction) => {
    const committedAt = new Date();
    const claimed = await transaction.order.updateMany({
      where: {
        id: orderId,
        status: "WAITING_REVIEW",
        inventoryCommittedAt: null,
        inventoryReleasedAt: null,
      },
      data: {
        status: "PAID",
        inventoryCommittedAt: committedAt,
      },
    });

    if (claimed.count === 0) return false;

    const payment = await transaction.payment.updateMany({
      where: { orderId, status: "UNDER_REVIEW" },
      data: {
        status: "APPROVED",
        reviewedAt: committedAt,
        reviewedBy,
        ...(reviewNote ? { reviewNote } : {}),
      },
    });

    if (payment.count !== 1) {
      throw new Error("PAYMENT_NOT_READY_FOR_APPROVAL");
    }

    return true;
  });
}
