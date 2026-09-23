import { config as loadEnvironment } from "dotenv";

loadEnvironment({ path: ".env.local" });
loadEnvironment();

export function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} تنظیم نشده است. مقدار آن را در فایل .env.local قرار دهید.`,
    );
  }
  return value;
}

export function localAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
