import { LoadingState } from "@/components/ui/loading-state";

export default function ProductsLoading() {
  return (
    <main
      id="main-content"
      className="mx-auto w-full max-w-[90rem] px-5 py-16 sm:px-8 lg:px-12 lg:py-24 xl:px-16"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <LoadingState key={index} label="در حال بارگذاری محصولات" />
        ))}
      </div>
    </main>
  );
}
