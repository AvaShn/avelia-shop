import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/layout/container";

const footerLinks = [
  { label: "ارتباط با ما", href: "/contact" },
  { label: "حریم خصوصی", href: "/policies/privacy" },
  { label: "شرایط سفارش", href: "/policies/terms" },
  { label: "شبکه‌های اجتماعی", href: "/contact#social" },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <Container className="py-14 sm:py-20">
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div className="max-w-xl">
            <BrandMark className="text-white" />
            <p className="mt-6 leading-8 text-white/60">
              مجموعه‌ای انتخاب‌شده برای کسانی که به اصالت، کیفیت و جزئیات اهمیت
              می‌دهند.
            </p>
          </div>
          <nav aria-label="پیوندهای پایانی">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-white/65 md:justify-items-end">
              {footerLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex min-h-11 items-center transition-colors duration-500 hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex flex-col gap-2 pt-7 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AVELIA</p>
          <p>طراحی‌شده با احترام به جزئیات</p>
        </div>
      </Container>
    </footer>
  );
}
