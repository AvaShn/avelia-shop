import { expect, test } from "@playwright/test";

test("paginates and filters the public product contract", async ({
  request,
}) => {
  const firstResponse = await request.get(
    "/api/products?limit=2&featured=true&availability=in-stock",
  );
  expect(firstResponse.ok()).toBe(true);
  const first = (await firstResponse.json()) as {
    data: Array<{ id: string; isFeatured: boolean; stock: number }>;
    error: null;
    meta: { nextCursor: string | null; total: number; requestId: string };
  };

  expect(first.error).toBeNull();
  expect(first.data).toHaveLength(2);
  expect(first.data.every((product) => product.isFeatured)).toBe(true);
  expect(first.data.every((product) => product.stock > 0)).toBe(true);
  expect(first.meta.requestId).toBeTruthy();
  expect(first.meta.nextCursor).toBeTruthy();

  const secondResponse = await request.get(
    `/api/products?limit=2&featured=true&availability=in-stock&cursor=${encodeURIComponent(first.meta.nextCursor!)}`,
  );
  expect(secondResponse.ok()).toBe(true);
  const second = (await secondResponse.json()) as {
    data: Array<{ id: string }>;
  };
  expect(second.data[0]?.id).not.toBe(first.data[0]?.id);
  expect(second.data[0]?.id).not.toBe(first.data[1]?.id);
});

test("returns one consistent envelope for validation errors", async ({
  request,
}) => {
  const response = await request.get("/api/products?availability=unknown");
  expect(response.status()).toBe(400);
  const payload = (await response.json()) as {
    data: null;
    error: { code: string; message: string };
    meta: { requestId: string };
  };

  expect(payload.data).toBeNull();
  expect(payload.error.code).toBe("INVALID_REQUEST");
  expect(payload.error.message).toContain("فیلتر");
  expect(payload.meta.requestId).toBeTruthy();
});

test("uses the documented cart item route and blocks cross-site mutation", async ({
  request,
}) => {
  const add = await request.post("/api/cart", {
    data: { productId: "makeup-lipstick-01", quantity: 1 },
  });
  expect(add.ok()).toBe(true);

  const update = await request.patch("/api/cart/makeup-lipstick-01", {
    data: { quantity: 2 },
  });
  expect(update.ok()).toBe(true);
  const updatedCart = (await update.json()) as {
    data: { itemCount: number };
  };
  expect(updatedCart.data.itemCount).toBe(2);

  const crossSite = await request.post("/api/cart", {
    headers: {
      Origin: "https://untrusted.example",
      "Sec-Fetch-Site": "cross-site",
    },
    data: { productId: "makeup-lipstick-01", quantity: 1 },
  });
  expect(crossSite.status()).toBe(403);
});

test("enforces JSON body limits and protects private APIs", async ({
  request,
}) => {
  const oversized = await request.post("/api/cart", {
    headers: { "Content-Type": "application/json" },
    data: { productId: "x".repeat(40_000), quantity: 1 },
  });
  expect(oversized.status()).toBe(413);

  const admin = await request.get("/api/admin/orders");
  expect(admin.status()).toBe(401);

  const telegram = await request.post("/api/telegram/session", {
    data: { orderToken: "a".repeat(43) },
  });
  expect(telegram.status()).toBe(503);

  const webhook = await request.post("/api/telegram/webhook", {
    data: { update_id: 1 },
  });
  expect([401, 503]).toContain(webhook.status());
});
