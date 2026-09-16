import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/features/cart/cart-provider";

type StoreLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="bg-primary text-primary-foreground fixed start-4 top-4 z-[100] -translate-y-24 rounded-md px-4 py-2 text-sm font-medium transition-transform focus:translate-y-0"
        >
          رفتن به محتوای اصلی
        </a>
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Toaster />
      </div>
    </CartProvider>
  );
}
