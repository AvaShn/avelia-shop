import type { Metadata, Viewport } from "next";

import { documentLocale } from "@/lib/i18n/config";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AVELIA",
    template: "%s | AVELIA",
  },
  description: "تجربه‌ای متفاوت برای انتخاب محصولات اصیل و باکیفیت",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={documentLocale.language} dir={documentLocale.direction}>
      <body>{children}</body>
    </html>
  );
}
