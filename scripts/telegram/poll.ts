import { getBotIdentity, getWebhookInfo, telegramBotApi } from "./bot-api";
import { localAppUrl, requiredEnvironment } from "./environment";

type TelegramUpdate = { update_id: number } & Record<string, unknown>;

let shouldStop = false;
let offset: number | undefined;

process.once("SIGINT", () => {
  shouldStop = true;
  console.info("\nدر حال توقف polling تلگرام...");
});
process.once("SIGTERM", () => {
  shouldStop = true;
});

async function forwardUpdate(update: TelegramUpdate) {
  const response = await fetch(`${localAppUrl()}/api/telegram/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Bot-Api-Secret-Token": requiredEnvironment(
        "TELEGRAM_WEBHOOK_SECRET",
      ),
    },
    body: JSON.stringify(update),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const body = (await response.text()).slice(0, 1_000);
    throw new Error(`Local webhook HTTP ${response.status}: ${body}`);
  }
}

async function poll() {
  const [bot, webhook] = await Promise.all([
    getBotIdentity(),
    getWebhookInfo(),
  ]);
  if (webhook.url) {
    await telegramBotApi<boolean>("deleteWebhook", {
      drop_pending_updates: false,
    });
    console.info("Webhook قبلی غیرفعال شد تا polling محلی اجرا شود.");
  }

  console.info(`بات @${bot.username ?? bot.id} به ${localAppUrl()} متصل شد.`);
  console.info("برای توقف Ctrl+C را بزنید.");

  while (!shouldStop) {
    try {
      const updates = await telegramBotApi<TelegramUpdate[]>(
        "getUpdates",
        {
          ...(offset === undefined ? {} : { offset }),
          limit: 100,
          timeout: 25,
          allowed_updates: ["message"],
        },
        35_000,
      );

      for (const update of updates) {
        try {
          await forwardUpdate(update);
          offset = update.update_id + 1;
          console.info(`Update ${update.update_id} پردازش شد.`);
        } catch (error: unknown) {
          console.error(
            `Update ${update.update_id} پردازش نشد:`,
            error instanceof Error ? error.message : error,
          );
          await new Promise((resolve) => setTimeout(resolve, 2_000));
          break;
        }
      }
    } catch (error: unknown) {
      if (shouldStop) break;
      console.error(
        "خطای polling:",
        error instanceof Error ? error.message : error,
      );
      await new Promise((resolve) => setTimeout(resolve, 3_000));
    }
  }
}

poll().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
