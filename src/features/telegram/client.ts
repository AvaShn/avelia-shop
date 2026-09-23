import "server-only";

import {
  detectReceiptContentType,
  maximumReceiptBytes,
} from "@/features/telegram/receipt-validation";
import { serverEnvironment } from "@/lib/env/server";
import { getPrismaClient } from "@/lib/prisma/client";

const telegramRequestTimeoutMs = 10_000;

type TelegramApiResponse<Result> = {
  ok: boolean;
  result?: Result;
  description?: string;
};

function botToken() {
  const token = serverEnvironment.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_NOT_CONFIGURED");
  return token;
}

async function telegramApi<Result>(
  method: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(
    `https://api.telegram.org/bot${botToken()}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(telegramRequestTimeoutMs),
      cache: "no-store",
    },
  );
  const result = (await response.json()) as TelegramApiResponse<Result>;
  if (!response.ok || !result.ok || result.result === undefined) {
    throw new Error(
      `TELEGRAM_API_ERROR:${method}:${result.description ?? response.status}`,
    );
  }
  return result.result;
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
) {
  await telegramApi("sendMessage", {
    chat_id: chatId,
    text,
  });
}

export async function forwardTelegramMessage(
  targetChatId: string | number,
  sourceChatId: string | number,
  messageId: number,
) {
  await telegramApi("forwardMessage", {
    chat_id: targetChatId,
    from_chat_id: sourceChatId,
    message_id: messageId,
  });
}

export async function downloadTelegramPhoto(fileId: string) {
  const file = await telegramApi<{ file_path?: string; file_size?: number }>(
    "getFile",
    { file_id: fileId },
  );
  if (!file.file_path || (file.file_size ?? 0) > maximumReceiptBytes) {
    throw new Error("INVALID_TELEGRAM_FILE");
  }

  const response = await fetch(
    `https://api.telegram.org/file/bot${botToken()}/${file.file_path}`,
    {
      signal: AbortSignal.timeout(telegramRequestTimeoutMs),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error("TELEGRAM_FILE_DOWNLOAD_FAILED");

  const declaredSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > maximumReceiptBytes) {
    throw new Error("INVALID_RECEIPT_SIZE");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0 || bytes.byteLength > maximumReceiptBytes) {
    throw new Error("INVALID_RECEIPT_SIZE");
  }
  const contentType = detectReceiptContentType(bytes);
  if (!contentType) throw new Error("INVALID_RECEIPT_CONTENT_TYPE");

  return { bytes, contentType };
}

export async function notifyCustomerAboutReview(
  publicOrderToken: string,
  action: "APPROVE" | "REJECT",
) {
  const prisma = getPrismaClient();
  if (!prisma || !serverEnvironment.TELEGRAM_BOT_TOKEN) return;

  const order = await prisma.order.findUnique({
    where: { publicToken: publicOrderToken },
    select: { user: { select: { telegramId: true } } },
  });
  if (!order?.user.telegramId) return;

  await sendTelegramMessage(
    order.user.telegramId,
    action === "APPROVE"
      ? "پرداخت شما تأیید شد. سفارش AVELIA اکنون برای ادامه آماده است."
      : "پرداخت این سفارش تأیید نشد. برای بررسی دوباره با پشتیبانی AVELIA در تماس باشید.",
  );
}

export { maximumReceiptBytes };
