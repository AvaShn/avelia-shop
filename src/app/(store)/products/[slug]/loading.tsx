import { Container } from "@/components/layout/container";
import { LoadingState } from "@/components/ui/loading-state";

export default function ProductLoading() {
  return (
    <main id="main-content">
      <Container className="grid gap-10 py-14 lg:grid-cols-2 lg:py-20">
        <LoadingState label="در حال بارگذاری تصاویر محصول" />
        <LoadingState label="در حال بارگذاری اطلاعات محصول" />
      </Container>
    </main>
  );
}
