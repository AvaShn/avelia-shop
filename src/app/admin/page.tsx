import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "مدیریت سفارش‌ها",
  description: "پنل خصوصی مدیریت سفارش‌ها و بررسی رسیدهای AVELIA",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
