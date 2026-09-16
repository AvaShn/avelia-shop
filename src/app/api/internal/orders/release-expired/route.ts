import { NextResponse } from "next/server";

import { releaseExpiredInventoryReservations } from "@/features/orders/inventory";
import { serverEnvironment } from "@/lib/env/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = serverEnvironment.INVENTORY_CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "Inventory cleanup is not configured.",
        },
      },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized." } },
      { status: 401 },
    );
  }

  try {
    const releasedOrders = await releaseExpiredInventoryReservations();
    return NextResponse.json(
      { data: { releasedOrders } },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error: unknown) {
    console.error("Failed to release expired inventory reservations.", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Inventory cleanup failed.",
        },
      },
      { status: 500 },
    );
  }
}
