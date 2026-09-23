import { getBotIdentity, telegramBotApi } from "./bot-api";
import "./environment";

async function configureTelegramBot() {
  const bot = await getBotIdentity();
  await telegramBotApi<boolean>("setMyCommands", {
    commands: [
      { command: "start", description: "شروع یا ادامه پرداخت سفارش" },
      { command: "help", description: "راهنمای پرداخت و ارسال رسید" },
      { command: "id", description: "نمایش شناسه عددی ادمین" },
    ],
    language_code: "fa",
  });
  await telegramBotApi<boolean>("setMyDescription", {
    description:
      "مسیر رسمی ادامه پرداخت سفارش‌های AVELIA و ارسال امن رسید برای بررسی دستی.",
    language_code: "fa",
  });
  await telegramBotApi<boolean>("setMyShortDescription", {
    short_description: "پرداخت و پیگیری سفارش‌های AVELIA",
    language_code: "fa",
  });
  console.info(`پروفایل و فرمان‌های بات @${bot.username ?? bot.id} تنظیم شد.`);
}

configureTelegramBot().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
