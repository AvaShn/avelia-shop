import "server-only";

import type { z } from "zod";

import {
  accountOrderSummarySchema,
  type accountOrdersQuerySchema,
} from "@/features/account/schemas";
import { decodeCursor, encodeCursor } from "@/lib/api/cursor";
import { formatPriceRial } from "@/lib/pricing/format-price";
import { getPrismaClient } from "@/lib/prisma/client";

type AccountOrdersQuery = z.infer<typeof accountOrdersQuerySchema>;

export class AccountOrdersError extends Error {
  constructor(
    public readonly code: "DATABASE_UNAVAILABLE" | "INVALID_CURSOR",
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AccountOrdersError";
  }
}

export async function listCustomerOrders(
  userId: string,
  query: AccountOrdersQuery,
) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new AccountOrdersError(
      "DATABASE_UNAVAILABLE",
      "پایگاه داده سفارش‌ها در دسترس نیست.",
      503,
    );
  }
  const cursorId = query.cursor ? decodeCursor(query.cursor) : null;
  if (query.cursor && !cursorId) {
    throw new AccountOrdersError(
      "INVALID_CURSOR",
      "صفحهٔ درخواستی معتبر نیست.",
      400,
    );
  }

  const where = { userId };
  if (cursorId) {
    const cursor = await prisma.order.findFirst({
      where: { id: cursorId, userId },
      select: { id: true },
    });
    if (!cursor) {
      throw new AccountOrdersError(
        "INVALID_CURSOR",
        "صفحهٔ درخواستی دیگر در دسترس نیست.",
        400,
      );
    }
  }

  const [records, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { payment: true, _count: { select: { items: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    }),
    prisma.order.count({ where }),
  ]);
  const hasNextPage = records.length > query.limit;
  const page = hasNextPage ? records.slice(0, query.limit) : records;

  return {
    orders: page.map((order) => {
      if (!order.payment) throw new Error("ORDER_PAYMENT_MISSING");
      const totalPriceRial = Number(order.totalPriceRial);
      if (!Number.isSafeInteger(totalPriceRial)) {
        throw new Error("UNSAFE_MONEY_VALUE");
      }
      return accountOrderSummarySchema.parse({
        publicToken: order.publicToken,
        status: order.status,
        paymentStatus: order.payment.status,
        totalPriceRial,
        totalPrice: formatPriceRial(totalPriceRial),
        itemCount: order._count.items,
        deliveryCity: order.shippingCity,
        createdAt: order.createdAt.toISOString(),
      });
    }),
    total,
    nextCursor:
      hasNextPage && page.length > 0
        ? encodeCursor(page[page.length - 1]!.id)
        : null,
  };
}
