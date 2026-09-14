import "server-only";

import { z } from "zod";

const optionalSecret = z.string().trim().min(1).optional();

const serverEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: optionalSecret,
  DIRECT_URL: optionalSecret,
  TELEGRAM_BOT_TOKEN: optionalSecret,
  TELEGRAM_BOT_USERNAME: optionalSecret,
  TELEGRAM_ADMIN_ID: optionalSecret,
  TELEGRAM_WEBHOOK_SECRET: optionalSecret,
  PAYMENT_SESSION_SECRET: optionalSecret,
  PAYMENT_CARD_NUMBER: optionalSecret,
  PAYMENT_CARD_HOLDER: optionalSecret,
  SUPABASE_URL: z.url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  SUPABASE_RECEIPTS_BUCKET: z
    .string()
    .trim()
    .min(1)
    .default("payment-receipts"),
  AUTH_SECRET: optionalSecret,
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD_HASH: optionalSecret,
  SMTP_HOST: optionalSecret,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optionalSecret,
  SMTP_PASSWORD: optionalSecret,
  SMTP_FROM: z.email().optional(),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(
  environment: NodeJS.ProcessEnv,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(environment);
}

export const serverEnvironment = parseServerEnvironment(process.env);
