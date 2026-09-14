import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({
  label = "در حال بارگذاری",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "bg-surface border-border/80 rounded-xl border p-6 sm:p-8",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <Skeleton className="aspect-[16/9] w-full rounded-lg" />
      <Skeleton className="mt-7 h-5 w-2/3" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-4/5" />
    </div>
  );
}
