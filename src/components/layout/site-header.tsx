import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/layout/container";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { SearchDialog } from "@/components/layout/search-dialog";
import { Button } from "@/components/ui/button";

const navigation = [
  { label: "صفحه اصلی", href: "/" },
  { label: "مجموعه محصولات", href: "/products" },
  { label: "داستان برند", href: "/#brand-story" },
] as const;

export function SiteHeader() {
  return (
    <header className="bg-background/90 border-border/70 sticky top-0 z-40 border-b backdrop-blur-xl">
      <Container className="relative flex h-16 items-center justify-between sm:h-20">
        <div className="flex items-center gap-1">
          <MobileNavigation />
          <BrandMark />
        </div>

        <nav
          aria-label="پیمایش اصلی"
          className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
        >
          <ul className="flex items-center gap-8">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground after:bg-accent relative flex min-h-11 items-center text-sm font-medium transition-colors duration-500 after:absolute after:right-0 after:bottom-1 after:h-px after:w-0 after:transition-[width] after:duration-500 hover:after:w-full"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <SearchDialog />
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" aria-label="سبد خرید، بدون محصول">
              <ShoppingBag aria-hidden="true" />
              <span className="sr-only">سبد خرید</span>
            </Link>
          </Button>
        </div>
      </Container>
    </header>
  );
}
