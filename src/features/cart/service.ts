import "server-only";

import { databaseProductToDomain } from "@/features/products/database-mapper";
import { findStorefrontProductById } from "@/features/products/repository";
import type { Product } from "@/features/products/types";
import {
  maximumCartItemQuantity,
  maximumDistinctCartItems,
} from "@/features/cart/schemas";
import type {
  CartApiErrorCode,
  CartItemView,
  CartView,
  StoredCartItem,
} from "@/features/cart/types";
import { getPrismaClient } from "@/lib/prisma/client";
import { createOpaqueToken, hashToken } from "@/lib/security/tokens";

const cartLifetimeMilliseconds = 30 * 24 * 60 * 60 * 1000;

type CartServiceResult = {
  cart: CartView;
  token: string;
  storedItems?: StoredCartItem[];
};

export class CartServiceError extends Error {
  constructor(
    public readonly code: CartApiErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "CartServiceError";
  }
}

function cartExpiry() {
  return new Date(Date.now() + cartLifetimeMilliseconds);
}

function productToCartItem(product: Product, quantity: number): CartItemView {
  const image = product.images[0];

  if (!image) {
    throw new CartServiceError(
      "PRODUCT_NOT_FOUND",
      "تصویر محصول موردنظر در دسترس نیست.",
      404,
    );
  }

  return {
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: image.src,
      imageAlt: image.alt,
      priceRial: product.priceRial,
      stock: product.stock,
    },
    quantity,
    lineTotalRial: product.priceRial * quantity,
  };
}

function createCartView(items: CartItemView[]): CartView {
  return {
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    totalPriceRial: items.reduce(
      (total, item) => total + item.lineTotalRial,
      0,
    ),
  };
}

async function fallbackCartView(
  storedItems: readonly StoredCartItem[],
): Promise<CartView> {
  const resolvedItems = await Promise.all(
    storedItems.map(async (item) => {
      const product = await findStorefrontProductById(item.productId);
      return product ? productToCartItem(product, item.quantity) : null;
    }),
  );

  return createCartView(
    resolvedItems.filter((item): item is CartItemView => item !== null),
  );
}

async function ensureDatabaseCart(token: string) {
  const prisma = getPrismaClient();
  if (!prisma) return null;

  const tokenHash = hashToken(token);
  const existing = await prisma.cart.findUnique({ where: { tokenHash } });
  const isActive =
    existing && !existing.checkedOutAt && existing.expiresAt > new Date();

  if (isActive) {
    return { cartId: existing.id, token };
  }

  const nextToken = existing ? createOpaqueToken() : token;
  const cart = await prisma.cart.create({
    data: {
      tokenHash: hashToken(nextToken),
      expiresAt: cartExpiry(),
    },
  });

  return { cartId: cart.id, token: nextToken };
}

async function databaseCartView(cartId: string): Promise<CartView> {
  const prisma = getPrismaClient();
  if (!prisma) return createCartView([]);

  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!cart) {
    throw new CartServiceError(
      "CART_NOT_FOUND",
      "سبد خرید پیدا نشد. لطفاً دوباره تلاش کنید.",
      404,
    );
  }

  return createCartView(
    cart.items
      .filter((item) => item.product.isPublished)
      .map((item) =>
        productToCartItem(databaseProductToDomain(item.product), item.quantity),
      ),
  );
}

function updateFallbackItem(
  storedItems: readonly StoredCartItem[],
  productId: string,
  quantity: number,
) {
  const withoutProduct = storedItems.filter(
    (item) => item.productId !== productId,
  );
  return [...withoutProduct, { productId, quantity }];
}

async function validateAvailableQuantity(productId: string, quantity: number) {
  const product = await findStorefrontProductById(productId);

  if (!product) {
    throw new CartServiceError(
      "PRODUCT_NOT_FOUND",
      "محصول موردنظر دیگر در مجموعه موجود نیست.",
      404,
    );
  }

  if (quantity > product.stock || quantity > maximumCartItemQuantity) {
    throw new CartServiceError(
      "OUT_OF_STOCK",
      "تعداد انتخاب‌شده بیشتر از موجودی فعلی محصول است.",
      409,
    );
  }

  return product;
}

export async function readCart(
  token: string,
  storedItems: readonly StoredCartItem[],
): Promise<CartServiceResult> {
  const databaseCart = await ensureDatabaseCart(token);

  if (!databaseCart) {
    return {
      cart: await fallbackCartView(storedItems),
      token,
      storedItems: [...storedItems],
    };
  }

  return {
    cart: await databaseCartView(databaseCart.cartId),
    token: databaseCart.token,
  };
}

export async function addCartItem(
  token: string,
  storedItems: readonly StoredCartItem[],
  productId: string,
  quantity: number,
): Promise<CartServiceResult> {
  const databaseCart = await ensureDatabaseCart(token);

  if (!databaseCart) {
    const currentQuantity =
      storedItems.find((item) => item.productId === productId)?.quantity ?? 0;
    const nextQuantity = currentQuantity + quantity;
    await validateAvailableQuantity(productId, nextQuantity);

    if (
      currentQuantity === 0 &&
      storedItems.length >= maximumDistinctCartItems
    ) {
      throw new CartServiceError(
        "INVALID_REQUEST",
        "برای ادامه، ابتدا یکی از محصولات سبد را حذف کنید.",
        400,
      );
    }

    const nextItems = updateFallbackItem(storedItems, productId, nextQuantity);
    return {
      cart: await fallbackCartView(nextItems),
      token,
      storedItems: nextItems,
    };
  }

  const prisma = getPrismaClient();
  if (!prisma) throw new Error("DATABASE_CLIENT_UNAVAILABLE");

  const product = await prisma.product.findFirst({
    where: { id: productId, isPublished: true },
  });
  if (!product) {
    throw new CartServiceError(
      "PRODUCT_NOT_FOUND",
      "محصول موردنظر دیگر در مجموعه موجود نیست.",
      404,
    );
  }

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_productId: { cartId: databaseCart.cartId, productId },
    },
  });
  const nextQuantity = (existing?.quantity ?? 0) + quantity;

  if (!existing) {
    const itemCount = await prisma.cartItem.count({
      where: { cartId: databaseCart.cartId },
    });
    if (itemCount >= maximumDistinctCartItems) {
      throw new CartServiceError(
        "INVALID_REQUEST",
        "برای ادامه، ابتدا یکی از محصولات سبد را حذف کنید.",
        400,
      );
    }
  }

  if (nextQuantity > product.stock || nextQuantity > maximumCartItemQuantity) {
    throw new CartServiceError(
      "OUT_OF_STOCK",
      "تعداد انتخاب‌شده بیشتر از موجودی فعلی محصول است.",
      409,
    );
  }

  await prisma.$transaction([
    prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId: databaseCart.cartId, productId },
      },
      create: { cartId: databaseCart.cartId, productId, quantity },
      update: { quantity: nextQuantity },
    }),
    prisma.cart.update({
      where: { id: databaseCart.cartId },
      data: { expiresAt: cartExpiry() },
    }),
  ]);

  return {
    cart: await databaseCartView(databaseCart.cartId),
    token: databaseCart.token,
  };
}

export async function updateCartItemQuantity(
  token: string,
  storedItems: readonly StoredCartItem[],
  productId: string,
  quantity: number,
): Promise<CartServiceResult> {
  await validateAvailableQuantity(productId, quantity);
  const databaseCart = await ensureDatabaseCart(token);

  if (!databaseCart) {
    if (!storedItems.some((item) => item.productId === productId)) {
      throw new CartServiceError(
        "CART_NOT_FOUND",
        "این محصول در سبد شما پیدا نشد.",
        404,
      );
    }

    const nextItems = updateFallbackItem(storedItems, productId, quantity);
    return {
      cart: await fallbackCartView(nextItems),
      token,
      storedItems: nextItems,
    };
  }

  const prisma = getPrismaClient();
  if (!prisma) throw new Error("DATABASE_CLIENT_UNAVAILABLE");

  const updated = await prisma.cartItem.updateMany({
    where: { cartId: databaseCart.cartId, productId },
    data: { quantity },
  });
  if (updated.count === 0) {
    throw new CartServiceError(
      "CART_NOT_FOUND",
      "این محصول در سبد شما پیدا نشد.",
      404,
    );
  }

  await prisma.cart.update({
    where: { id: databaseCart.cartId },
    data: { expiresAt: cartExpiry() },
  });

  return {
    cart: await databaseCartView(databaseCart.cartId),
    token: databaseCart.token,
  };
}

export async function removeCartItem(
  token: string,
  storedItems: readonly StoredCartItem[],
  productId: string,
): Promise<CartServiceResult> {
  const databaseCart = await ensureDatabaseCart(token);

  if (!databaseCart) {
    const nextItems = storedItems.filter(
      (item) => item.productId !== productId,
    );
    return {
      cart: await fallbackCartView(nextItems),
      token,
      storedItems: nextItems,
    };
  }

  const prisma = getPrismaClient();
  if (!prisma) throw new Error("DATABASE_CLIENT_UNAVAILABLE");
  await prisma.cartItem.deleteMany({
    where: { cartId: databaseCart.cartId, productId },
  });
  await prisma.cart.update({
    where: { id: databaseCart.cartId },
    data: { expiresAt: cartExpiry() },
  });

  return {
    cart: await databaseCartView(databaseCart.cartId),
    token: databaseCart.token,
  };
}
