import Link from "next/link";
import { UserRound } from "lucide-react";

export function AccountLink() {
  return (
    <Link
      href="/account"
      aria-label="ورود / ثبت‌نام"
      className="hover:bg-surface-strong focus-visible:ring-accent/30 flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-4 focus-visible:outline-none"
    >
      <UserRound className="size-5" aria-hidden="true" />
      <span className="hidden xl:inline">ورود / ثبت‌نام</span>
    </Link>
  );
}
