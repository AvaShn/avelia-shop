import type { Metadata, Viewport } from "next";

import { documentLocale } from "@/lib/i18n/config";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "AVELIA",
    template: "%s | AVELIA",
  },
  description:
    "فروشگاه آنلاین لوازم آرایشی، محصولات مراقبت پوست و عطرهای اصیل و باکیفیت",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f4ee",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={documentLocale.language} dir={documentLocale.direction}>
      <body className="bg-background text-foreground min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
