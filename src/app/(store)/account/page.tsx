import type { Metadata } from "next";

import { AccountPageClient } from "@/components/account/account-page-client";

export const metadata: Metadata = {
  title: "حساب کاربری",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountPageClient />;
}
