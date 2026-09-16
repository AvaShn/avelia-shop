export const contactDetails = {
  telegram: {
    handle: "@youknowava",
    href: "https://t.me/youknowava",
  },
  whatsapp: {
    display: "۰۹۱۲ ۸۵۸ ۶۰۱۰",
    href: `https://wa.me/989128586010?text=${encodeURIComponent(
      "سلام، برای راهنمایی درباره AVELIA پیام می‌دهم.",
    )}`,
  },
  bale: {
    handle: "@uknowava",
    href: "https://ble.ir/uknowava",
  },
  email: {
    address: "avashahabi@gmail.com",
    href: "mailto:avashahabi@gmail.com",
  },
  instagram: {
    handle: "@avelia.shopp",
    href: "https://www.instagram.com/avelia.shopp/",
  },
} as const;

export function telegramBotUrl(username: string | undefined) {
  const normalized = username?.trim().replace(/^@/, "");
  return normalized ? `https://t.me/${normalized}` : null;
}
