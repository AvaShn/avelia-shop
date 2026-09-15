import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main id="main-content">
      <Container className="flex min-h-[65svh] max-w-3xl flex-col items-center justify-center py-20 text-center">
        <p className="text-accent text-sm font-medium">AVELIA / 404</p>
        <h1 className="mt-5 text-4xl leading-[1.45] font-semibold">
          این محصول در مجموعه پیدا نشد
        </h1>
        <p className="text-muted-foreground mt-5 max-w-xl leading-8">
          ممکن است آدرس تغییر کرده باشد یا محصول دیگر در مجموعه‌ی فعلی AVELIA
          حضور نداشته باشد.
        </p>
        <Button asChild className="mt-8">
          <Link href="/products">بازگشت به محصولات</Link>
        </Button>
      </Container>
    </main>
  );
}
