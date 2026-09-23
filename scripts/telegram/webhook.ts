import { getBotIdentity, getWebhookInfo, telegramBotApi } from "./bot-api";
import { localAppUrl, requiredEnvironment } from "./environment";

type WebhookCommand = "set" | "delete" | "status";

async function manageWebhook() {
  const command = process.argv[2] as WebhookCommand | undefined;
  if (!command || !["set", "delete", "status"].includes(command)) {
    throw new Error("دستور webhook باید set، delete یا status باشد.");
  }

  const bot = await getBotIdentity();

  if (command === "set") {
    const baseUrl = (process.argv[3] || localAppUrl()).replace(/\/$/, "");
    const webhookUrl = new URL("/api/telegram/webhook", baseUrl);
    if (
      webhookUrl.protocol !== "https:" ||
      webhookUrl.hostname === "localhost"
    ) {
      throw new Error(
        "برای webhook یک آدرس عمومی HTTPS مانند https://example.vercel.app وارد کنید.",
      );
    }
    await telegramBotApi<boolean>("setWebhook", {
      url: webhookUrl.toString(),
      secret_token: requiredEnvironment("TELEGRAM_WEBHOOK_SECRET"),
      allowed_updates: ["message"],
      drop_pending_updates: false,
    });
    console.info(`Webhook بات @${bot.username ?? bot.id} ثبت شد.`);
  } else if (command === "delete") {
    await telegramBotApi<boolean>("deleteWebhook", {
      drop_pending_updates: false,
    });
    console.info(`Webhook بات @${bot.username ?? bot.id} حذف شد.`);
  }

  const info = await getWebhookInfo();
  console.info(`URL: ${info.url || "بدون webhook (polling)"}`);
  console.info(`آپدیت‌های در انتظار: ${info.pending_update_count}`);
  if (info.last_error_message) {
    console.info(`آخرین خطا: ${info.last_error_message}`);
  }
}

manageWebhook().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
