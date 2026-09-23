import { createHash, randomBytes, randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnvironment } from "dotenv";

import { PrismaClient } from "../src/generated/prisma/client";

loadEnvironment({ path: ".env.local" });
loadEnvironment();

const databaseUrl = process.env.DATABASE_URL;
const baseUrl = process.env.ACCOUNT_TEST_BASE_URL ?? "http://localhost:3000";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for account verification.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});
const suffix = randomBytes(5).toString("hex");
const digits = BigInt(`0x${suffix}`).toString().padStart(7, "0").slice(-7);
const email = `avelia-account-test-${suffix}@example.invalid`;
const phone = `0912${digits}`;
const password = "1";

function assertStatus(response: Response, expected: number, step: string) {
  if (response.status !== expected) {
    throw new Error(`${step} returned HTTP ${response.status}.`);
  }
}

function readCookie(response: Response, name: string) {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const value = setCookie.match(new RegExp(`${name}=([^;,\\s]+)`))?.[1];
  if (!value) {
    throw new Error(`${name} cookie was not issued.`);
  }
  return `${name}=${value}`;
}

let cartToken: string | undefined;

async function verifyAccountFlow() {
  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({
      name: "کاربر آزمایشی آولیا",
      phone,
      email,
      password,
      passwordConfirmation: password,
    }),
  });
  if (registerResponse.status !== 201) {
    throw new Error(
      `Registration returned HTTP ${registerResponse.status}: ${await registerResponse.text()}`,
    );
  }
  assertStatus(registerResponse, 201, "Registration");
  let cookie = readCookie(registerResponse, "avelia_customer_session");

  const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: cookie },
  });
  assertStatus(sessionResponse, 200, "Session lookup");

  const ordersResponse = await fetch(`${baseUrl}/api/account/orders`, {
    headers: { Cookie: cookie },
  });
  assertStatus(ordersResponse, 200, "Customer order history");

  const product = await prisma.product.findFirst({
    where: { isPublished: true, stock: { gt: 0 } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  if (!product)
    throw new Error("No in-stock product is available for checkout.");

  const cartResponse = await fetch(`${baseUrl}/api/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
      Origin: baseUrl,
    },
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  assertStatus(cartResponse, 200, "Cart creation");
  const cartCookie = readCookie(cartResponse, "avelia_cart");
  cartToken = cartCookie.slice("avelia_cart=".length);

  const orderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `${cookie}; ${cartCookie}`,
      Origin: baseUrl,
      "Idempotency-Key": randomUUID(),
    },
    body: JSON.stringify({
      customer: { name: "کاربر آزمایشی آولیا", phone, email },
      shippingAddress: {
        city: "تهران",
        addressLine: "خیابان آزمایشی، کوچه آولیا",
        postalCode: "1234567890",
        plaque: "۱۲",
        unit: "۳",
      },
    }),
  });
  assertStatus(orderResponse, 201, "Authenticated checkout");
  const orderEnvelope = (await orderResponse.json()) as {
    data?: { publicToken?: string };
  };
  const publicToken = orderEnvelope.data?.publicToken;
  if (!publicToken) throw new Error("Checkout did not return an order token.");

  const storedOrder = await prisma.order.findUnique({
    where: { publicToken },
  });
  if (
    storedOrder?.shippingCity !== "تهران" ||
    storedOrder.shippingPostalCode !== "1234567890" ||
    storedOrder.shippingPlaque !== "۱۲" ||
    storedOrder.shippingUnit !== "۳"
  ) {
    throw new Error(
      "The immutable delivery snapshot was not stored correctly.",
    );
  }

  const storedUser = await prisma.user.findUnique({ where: { email } });
  if (!storedUser?.passwordHash || storedUser.passwordHash === password) {
    throw new Error("The account password was not stored as a secure hash.");
  }

  const logoutResponse = await fetch(`${baseUrl}/api/auth/session`, {
    method: "DELETE",
    headers: { Cookie: cookie, Origin: baseUrl },
  });
  assertStatus(logoutResponse, 200, "Logout");

  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({ identifier: email, password }),
  });
  assertStatus(loginResponse, 200, "Login");
  cookie = readCookie(loginResponse, "avelia_customer_session");

  const restoredSessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Cookie: cookie },
  });
  assertStatus(restoredSessionResponse, 200, "Restored session lookup");

  const deletableUser = await prisma.user.findUnique({ where: { email } });
  if (!deletableUser || !storedOrder || !cartToken) {
    throw new Error("Deletion verification records were not created.");
  }
  await prisma.user.delete({ where: { id: deletableUser.id } });

  const [
    deletedOrder,
    deletedCart,
    remainingItems,
    remainingPayment,
    sessions,
    restoredProduct,
  ] = await Promise.all([
    prisma.order.findUnique({ where: { id: storedOrder.id } }),
    prisma.cart.findUnique({
      where: {
        tokenHash: createHash("sha256").update(cartToken).digest("hex"),
      },
    }),
    prisma.orderItem.count({ where: { orderId: storedOrder.id } }),
    prisma.payment.count({ where: { orderId: storedOrder.id } }),
    prisma.userSession.count({ where: { userId: deletableUser.id } }),
    prisma.product.findUnique({ where: { id: product.id } }),
  ]);
  if (
    deletedOrder ||
    deletedCart ||
    remainingItems !== 0 ||
    remainingPayment !== 0 ||
    sessions !== 0 ||
    restoredProduct?.stock !== product.stock
  ) {
    throw new Error(
      "Safe customer deletion did not clean every related record.",
    );
  }

  console.info(
    "Customer flow verified: registration, secure session, checkout, login, complete deletion, and inventory restoration.",
  );
}

verifyAccountFlow()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { orders: { include: { items: true } } },
    });
    if (user) {
      await prisma.$transaction(async (transaction) => {
        for (const order of user.orders) {
          if (!order.inventoryCommittedAt && !order.inventoryReleasedAt) {
            for (const item of order.items) {
              await transaction.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
        }
        await transaction.order.deleteMany({ where: { userId: user.id } });
        await transaction.user.delete({ where: { id: user.id } });
      });
    }
    if (cartToken) {
      await prisma.cart.deleteMany({
        where: {
          tokenHash: createHash("sha256").update(cartToken).digest("hex"),
        },
      });
    }
    await prisma.apiRateLimit.deleteMany({
      where: {
        scope: {
          in: [
            "account:register",
            "account:login",
            "account:orders:list",
            "cart:mutate",
            "orders:create",
          ],
        },
      },
    });
    await prisma.$disconnect();
  });
