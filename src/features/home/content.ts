import { Gem, Headphones, ShieldCheck } from "lucide-react";

export const homeCategories = [
  {
    id: "makeup",
    eyebrow: "رنگ و بافت",
    name: "لوازم آرایشی",
    description: "محصولاتی برای آرایشی دقیق، هماهنگ و ماندگار.",
    image: "/images/home/category-makeup-v2.webp",
    href: "/products?category=makeup",
    imageAlt: "رژ لب، پنکک و براش آرایشی در فضای لوکس و مینیمال",
  },
  {
    id: "skincare",
    eyebrow: "مراقبت آگاهانه",
    name: "مراقبت پوست",
    description: "فرمول‌هایی انتخاب‌شده برای یک روتین روزانه‌ی آرام.",
    image: "/images/home/category-skincare.webp",
    href: "/products?category=skincare",
    imageAlt: "ظرف کرم و سرم مراقبت پوست در فضای روشن و مینیمال",
  },
  {
    id: "fragrance",
    eyebrow: "رایحه‌های ماندگار",
    name: "عطر و رایحه",
    description: "انتخاب‌هایی با شخصیت روشن و حضور به‌یادماندنی.",
    image: "/images/home/category-fragrance.webp",
    href: "/products?category=fragrance",
    imageAlt: "بطری عطر شیشه‌ای روی پایه سنگی در نور ملایم",
  },
] as const;

export const trustPillars = [
  {
    title: "تضمین اصالت",
    description:
      "هر محصول پیش از ورود به مجموعه، از نظر منبع و اصالت بررسی می‌شود.",
    icon: ShieldCheck,
  },
  {
    title: "انتخاب آگاهانه",
    description:
      "مشخصات، کاربرد و کیفیت هر محصول زیبایی پیش از معرفی با دقت بررسی می‌شود.",
    icon: Gem,
  },
  {
    title: "همراهی انسانی",
    description:
      "در تمام مسیر انتخاب و سفارش، پاسخ‌گویی روشن و محترمانه کنار شماست.",
    icon: Headphones,
  },
] as const;
