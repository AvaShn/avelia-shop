import { getBotIdentity, getWebhookInfo } from "./bot-api";
import "./environment";

async function checkTelegram() {
  const [bot, webhook] = await Promise.all([
    getBotIdentity(),
    getWebhookInfo(),
  ]);
  const variables = [
    "TELEGRAM_ADMIN_ID",
    "TELEGRAM_WEBHOOK_SECRET",
    "PAYMENT_SESSION_SECRET",
    "PAYMENT_CARD_NUMBER",
    "PAYMENT_CARD_HOLDER",
  ] as const;

  console.info(`اتصال به بات @${bot.username ?? bot.id} برقرار شد.`);
  console.info(
    webhook.url
      ? `حالت دریافت: webhook (${webhook.url})`
      : "حالت دریافت: polling / بدون webhook",
  );
  console.info(`آپدیت‌های در انتظار: ${webhook.pending_update_count}`);
  for (const variable of variables) {
    const value = process.env[variable]?.trim();
    const status =
      variable === "TELEGRAM_ADMIN_ID" && value && !/^-?\d+$/.test(value)
        ? "نامعتبر؛ باید شناسه عددی باشد"
        : value
          ? "تنظیم شده"
          : "تنظیم نشده";
    console.info(`${variable}: ${status}`);
  }
}

checkTelegram().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
