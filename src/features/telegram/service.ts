import "server-only";

import {
  downloadTelegramPhoto,
  forwardTelegramMessage,
  maximumReceiptBytes,
  sendTelegramMessage,
} from "@/features/telegram/client";
import type { TelegramUpdate } from "@/features/telegram/schemas";
import { storePrivateReceipt } from "@/features/telegram/storage";
import {
  assertOrderTransition,
  assertPaymentTransition,
} from "@/features/orders/status-transitions";
import { formatPersianInteger } from "@/lib/i18n/format-number";
import { formatPriceRial } from "@/lib/pricing/format-price";
import { getPrismaClient } from "@/lib/prisma/client";
import { serverEnvironment } from "@/lib/env/server";
import {
  createPaymentSessionToken,
  hashToken,
  isValidOpaqueToken,
} from "@/lib/security/tokens";

export class TelegramServiceError extends Error {
  constructor(
    public readonly code:
      | "CONFIGURATION_ERROR"
      | "DATABASE_UNAVAILABLE"
      | "ORDER_NOT_FOUND"
      | "SESSION_EXPIRED"
      | "ORDER_NOT_ELIGIBLE"
      | "INVALID_RECEIPT",
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "TelegramServiceError";
  }
}

function requiredPrisma() {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new TelegramServiceError(
      "DATABASE_UNAVAILABLE",
      "ادامه پرداخت پس از اتصال پایگاه داده فعال می‌شود.",
      503,
    );
  }
  return prisma;
}

function telegramConfiguration() {
  const { TELEGRAM_BOT_USERNAME, PAYMENT_SESSION_SECRET } = serverEnvironment;
  if (!TELEGRAM_BOT_USERNAME || !PAYMENT_SESSION_SECRET) {
    throw new TelegramServiceError(
      "CONFIGURATION_ERROR",
      "تنظیمات امن تلگرام هنوز کامل نشده است.",
      503,
    );
  }
  return {
    username: TELEGRAM_BOT_USERNAME.replace(/^@/, ""),
    sessionSecret: PAYMENT_SESSION_SECRET,
  };
}

export async function createTelegramHandoff(publicOrderToken: string) {
  const prisma = requiredPrisma();
  const configuration = telegramConfiguration();
  const order = await prisma.order.findUnique({
    where: { publicToken: publicOrderToken },
    include: { payment: true },
  });
  if (!order?.payment) {
    throw new TelegramServiceError(
      "ORDER_NOT_FOUND",
      "سفارش موردنظر پیدا نشد.",
      404,
    );
  }

  const now = new Date();
  if (
    order.payment.sessionExpiresAt <= now ||
    order.inventoryReservationExpiresAt <= now ||
    order.inventoryReleasedAt
  ) {
    throw new TelegramServiceError(
      "SESSION_EXPIRED",
      "مهلت ادامه پرداخت تمام شده است؛ وضعیت سفارش را بررسی کنید.",
      410,
    );
  }
  if (
    order.status !== "PENDING_PAYMENT" ||
    order.payment.status !== "PENDING"
  ) {
    throw new TelegramServiceError(
      "ORDER_NOT_ELIGIBLE",
      "این سفارش در وضعیت ادامه پرداخت نیست.",
      409,
    );
  }

  const sessionToken = createPaymentSessionToken(
    publicOrderToken,
    configuration.sessionSecret,
  );
  if (hashToken(sessionToken) !== order.payment.paymentSessionTokenHash) {
    throw new TelegramServiceError(
      "ORDER_NOT_ELIGIBLE",
      "نشست پرداخت این سفارش معتبر نیست.",
      409,
    );
  }

  const telegramUrl = new URL(`https://t.me/${configuration.username}`);
  telegramUrl.searchParams.set("start", sessionToken);
  return {
    telegramUrl: telegramUrl.toString(),
    expiresAt: order.payment.sessionExpiresAt.toISOString(),
  };
}

function orderMessage(payment: {
  order: {
    publicToken: string;
    totalPriceRial: bigint;
    items: Array<{ quantity: number; product: { name: string } }>;
  };
}) {
  const total = formatPriceRial(payment.order.totalPriceRial);
  const lines = payment.order.items.map(
    (item) => `• ${item.product.name} × ${formatPersianInteger(item.quantity)}`,
  );
  const cardNumber = serverEnvironment.PAYMENT_CARD_NUMBER;
  const cardHolder = serverEnvironment.PAYMENT_CARD_HOLDER;

  return [
    "سفارش AVELIA شما آماده ادامه پرداخت است.",
    "",
    ...lines,
    "",
    `مبلغ: ${total.rial}`,
    `معادل ${total.tomanWords}`,
    cardNumber
      ? `شماره کارت: ${cardNumber}`
      : "شماره کارت هنوز تنظیم نشده است.",
    cardHolder ? `به نام: ${cardHolder}` : "",
    "",
    "پس از انتقال وجه، تصویر واضح رسید را همین‌جا ارسال کنید. رسید به‌صورت دستی بررسی می‌شود.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function processStartMessage(
  chatId: number,
  telegramUserId: number,
  text: string,
) {
  const sessionToken = text.match(
    /^\/start(?:@[A-Za-z0-9_]+)?\s+([A-Za-z0-9_-]+)$/,
  )?.[1];
  if (!sessionToken || !isValidOpaqueToken(sessionToken)) {
    await sendTelegramMessage(
      chatId,
      "لینک پرداخت معتبر نیست. از صفحه سفارش AVELIA دوباره وارد تلگرام شوید.",
    );
    return { kind: "invalid-session" as const };
  }

  const prisma = requiredPrisma();
  const payment = await prisma.payment.findUnique({
    where: { paymentSessionTokenHash: hashToken(sessionToken) },
    include: {
      order: {
        include: {
          user: true,
          items: {
            include: { product: { select: { name: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!payment) {
    await sendTelegramMessage(chatId, "سفارش مرتبط با این لینک پیدا نشد.");
    return { kind: "order-not-found" as const };
  }
  if (
    payment.sessionExpiresAt <= new Date() ||
    payment.order.inventoryReservationExpiresAt <= new Date() ||
    payment.order.inventoryReleasedAt
  ) {
    await sendTelegramMessage(
      chatId,
      "مهلت این نشست پرداخت تمام شده است. وضعیت سفارش را در سایت بررسی کنید.",
    );
    return { kind: "expired" as const };
  }
  if (
    payment.status !== "PENDING" ||
    payment.order.status !== "PENDING_PAYMENT"
  ) {
    await sendTelegramMessage(
      chatId,
      "رسید این سفارش قبلاً ثبت شده یا وضعیت سفارش تغییر کرده است.",
    );
    return { kind: "not-eligible" as const };
  }

  try {
    await prisma.user.update({
      where: { id: payment.order.userId },
      data: { telegramId: String(telegramUserId) },
    });
  } catch {
    await sendTelegramMessage(
      chatId,
      "این حساب تلگرام به سفارش دیگری متصل است. با پشتیبانی AVELIA در تماس باشید.",
    );
    return { kind: "telegram-account-conflict" as const };
  }

  await sendTelegramMessage(chatId, orderMessage(payment));
  return { kind: "session-connected" as const };
}

async function processReceipt(
  updateId: number,
  chatId: number,
  messageId: number,
  telegramUserId: number,
  photos: NonNullable<NonNullable<TelegramUpdate["message"]>["photo"]>,
) {
  const prisma = requiredPrisma();
  const providerUpdateId = String(updateId);
  const duplicate = await prisma.payment.findUnique({
    where: { providerUpdateId },
    select: { id: true },
  });
  if (duplicate) return { kind: "duplicate" as const };

  const payment = await prisma.payment.findFirst({
    where: {
      status: "PENDING",
      sessionExpiresAt: { gt: new Date() },
      order: {
        is: {
          status: "PENDING_PAYMENT",
          inventoryReservationExpiresAt: { gt: new Date() },
          inventoryReleasedAt: null,
          user: { telegramId: String(telegramUserId) },
        },
      },
    },
    include: {
      order: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!payment) {
    await sendTelegramMessage(
      chatId,
      "سفارش فعالی برای این رسید پیدا نشد. ابتدا از لینک پرداخت سفارش وارد ربات شوید.",
    );
    return { kind: "no-active-order" as const };
  }

  assertOrderTransition(payment.order.status, "WAITING_REVIEW");
  assertPaymentTransition(payment.status, "UNDER_REVIEW");
  const photo = [...photos].sort(
    (first, second) =>
      (second.file_size ?? second.width * second.height) -
      (first.file_size ?? first.width * first.height),
  )[0];
  if (!photo || (photo.file_size ?? 0) > maximumReceiptBytes) {
    await sendTelegramMessage(
      chatId,
      "حجم تصویر رسید بیش از حد مجاز است. یک تصویر واضح و کوچک‌تر از ۸ مگابایت ارسال کنید.",
    );
    return { kind: "invalid-receipt" as const };
  }

  const receipt = await downloadTelegramPhoto(photo.file_id);
  const objectKey = await storePrivateReceipt(payment.orderId, receipt);

  await prisma.$transaction(async (transaction) => {
    const paymentUpdated = await transaction.payment.updateMany({
      where: {
        id: payment.id,
        status: "PENDING",
        providerUpdateId: null,
      },
      data: {
        status: "UNDER_REVIEW",
        telegramFileId: photo.file_id,
        receiptObjectKey: objectKey,
        providerUpdateId,
      },
    });
    const orderUpdated = await transaction.order.updateMany({
      where: {
        id: payment.orderId,
        status: "PENDING_PAYMENT",
        inventoryReleasedAt: null,
      },
      data: { status: "WAITING_REVIEW" },
    });
    if (paymentUpdated.count !== 1 || orderUpdated.count !== 1) {
      throw new Error("CONCURRENT_RECEIPT_UPDATE");
    }
  });

  await sendTelegramMessage(
    chatId,
    "رسید دریافت شد. پرداخت شما اکنون در حال بررسی دستی است.",
  ).catch((error: unknown) =>
    console.error("Failed to notify the customer about receipt review.", error),
  );

  const adminId = serverEnvironment.TELEGRAM_ADMIN_ID;
  if (adminId) {
    await sendTelegramMessage(
      adminId,
      `رسید جدید برای سفارش ${payment.order.publicToken}\n${formatPriceRial(payment.order.totalPriceRial).rial}`,
    ).catch((error: unknown) =>
      console.error("Failed to notify the Telegram admin.", error),
    );
    await forwardTelegramMessage(adminId, chatId, messageId).catch(
      (error: unknown) =>
        console.error("Failed to forward the receipt to the admin.", error),
    );
  }

  return { kind: "receipt-recorded" as const };
}

export async function processTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  if (!message?.from) return { kind: "ignored" as const };

  if (message.text?.startsWith("/start")) {
    return processStartMessage(message.chat.id, message.from.id, message.text);
  }
  if (message.photo?.length) {
    return processReceipt(
      update.update_id,
      message.chat.id,
      message.message_id,
      message.from.id,
      message.photo,
    );
  }

  await sendTelegramMessage(
    message.chat.id,
    "برای ثبت پرداخت، تصویر واضح رسید را ارسال کنید.",
  );
  return { kind: "instructions-sent" as const };
}
