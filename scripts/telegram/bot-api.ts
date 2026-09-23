import { requiredEnvironment } from "./environment";

type TelegramApiResponse<Result> = {
  ok: boolean;
  result?: Result;
  description?: string;
};

export type TelegramBotIdentity = {
  id: number;
  is_bot: true;
  first_name: string;
  username?: string;
};

export type TelegramWebhookInfo = {
  url: string;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
};

export async function telegramBotApi<Result>(
  method: string,
  payload: Record<string, unknown> = {},
  timeoutMilliseconds = 15_000,
) {
  const token = requiredEnvironment("TELEGRAM_BOT_TOKEN");
  const response = await fetch(
    `https://api.telegram.org/bot${token}/${method}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMilliseconds),
    },
  );
  const body = (await response.json()) as TelegramApiResponse<Result>;
  if (!response.ok || !body.ok || body.result === undefined) {
    throw new Error(
      `Telegram ${method}: ${body.description ?? `HTTP ${response.status}`}`,
    );
  }
  return body.result;
}

export function getBotIdentity() {
  return telegramBotApi<TelegramBotIdentity>("getMe");
}

export function getWebhookInfo() {
  return telegramBotApi<TelegramWebhookInfo>("getWebhookInfo");
}
