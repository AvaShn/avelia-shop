import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function OrderNotFound() {
  return (
    <main id="main-content">
      <Container className="py-20 text-center">
        <h1 className="text-3xl font-semibold">این سفارش پیدا نشد</h1>
        <p className="text-muted-foreground mt-4">
          لینک پیگیری را بررسی کنید یا برای راهنمایی با پشتیبانی تماس بگیرید.
        </p>
        <Button className="mt-7" asChild>
          <Link href="/products">بازگشت به محصولات</Link>
        </Button>
      </Container>
    </main>
  );
}
