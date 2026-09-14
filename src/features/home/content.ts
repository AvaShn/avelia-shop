import { Gem, Headphones, ShieldCheck } from "lucide-react";

import type { ProductCardData } from "@/components/product/product-card";

export const homeCategories = [
  {
    id: "fragrance",
    eyebrow: "رایحه‌های ماندگار",
    name: "عطر و رایحه",
    description: "انتخاب‌هایی با شخصیت روشن و حضور به‌یادماندنی.",
    image: "/images/home/category-fragrance.webp",
    href: "/products?category=fragrance",
    imageAlt: "بطری عطر شیشه‌ای روی پایه سنگی در نور ملایم",
  },
  {
    id: "skincare",
    eyebrow: "مراقبت آگاهانه",
    name: "مراقبت پوست",
    description: "فرمول‌هایی انتخاب‌شده برای یک آیین روزانه‌ی آرام.",
    image: "/images/home/category-skincare.webp",
    href: "/products?category=skincare",
    imageAlt: "ظرف کرم و سرم مراقبت پوست در فضای روشن و مینیمال",
  },
  {
    id: "lifestyle",
    eyebrow: "جزئیات روزمره",
    name: "سبک زندگی",
    description: "اشیایی ساده و ماندگار برای لحظه‌های هر روز.",
    image: "/images/home/category-lifestyle.webp",
    href: "/products?category=lifestyle",
    imageAlt: "جاکارتی چرمی مشکی در کنار پارچه ابریشمی روشن",
  },
] as const;

// Presentation-only records. Phase 4 replaces these with the verified catalog.
export const featuredProducts: ProductCardData[] = [
  {
    id: "preview-fragrance-01",
    slug: "editorial-fragrance-01",
    name: "اُ دو پرفیوم شماره ۰۱",
    brand: "AVELIA SELECT",
    shortDescription: "رایحه‌ای گرم با حضوری آرام و ماندگار",
    priceRial: 48_500_000,
    image: "/images/home/product-fragrance.webp",
    imageAlt: "بطری عطر شیشه‌ای بدون برچسب روی زمینه سفید گرم",
    isOriginal: true,
  },
  {
    id: "preview-cream-01",
    slug: "editorial-cream-01",
    name: "کرم غنی روزانه",
    brand: "AVELIA SELECT",
    shortDescription: "بافتی لطیف برای مراقبت آرام روزانه",
    priceRial: 26_800_000,
    image: "/images/home/product-cream.webp",
    imageAlt: "ظرف کرم سفید با لبه شامپاینی روی سنگ روشن",
    isOriginal: true,
  },
  {
    id: "preview-serum-01",
    slug: "editorial-serum-01",
    name: "سرم شب بازسازی",
    brand: "AVELIA SELECT",
    shortDescription: "فرمولی متمرکز برای آیین مراقبت شبانه",
    priceRial: 31_200_000,
    image: "/images/home/product-serum.webp",
    imageAlt: "بطری سرم شیشه‌ای تیره با جزئیات شامپاینی",
    isOriginal: true,
  },
  {
    id: "preview-card-holder-01",
    slug: "editorial-card-holder-01",
    name: "جاکارتی چرم کلاسیک",
    brand: "AVELIA SELECT",
    shortDescription: "طراحی مینیمال با چرم طبیعی و دوخت دقیق",
    priceRial: 19_500_000,
    image: "/images/home/product-card-holder.webp",
    imageAlt: "جاکارتی چرمی مشکی روی سطح سنگی روشن",
    isOriginal: true,
  },
];

export const trustPillars = [
  {
    title: "تضمین اصالت",
    description:
      "هر محصول پیش از ورود به مجموعه، از نظر منبع و اصالت بررسی می‌شود.",
    icon: ShieldCheck,
  },
  {
    title: "کیفیت انتخاب",
    description:
      "تنها محصولاتی که استاندارد کیفیت AVELIA را دارند در مجموعه قرار می‌گیرند.",
    icon: Gem,
  },
  {
    title: "همراهی انسانی",
    description:
      "در تمام مسیر انتخاب و سفارش، پاسخ‌گویی روشن و محترمانه کنار شماست.",
    icon: Headphones,
  },
] as const;
