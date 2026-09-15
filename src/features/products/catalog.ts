import { importedProducts } from "@/features/products/imported-catalog";
import type { Product, ProductCategory } from "@/features/products/types";

export const productCategories: readonly ProductCategory[] = [
  {
    id: "makeup",
    name: "لوازم آرایشی",
    description: "رنگ‌ها و بافت‌هایی برای آرایشی دقیق و هماهنگ.",
  },
  {
    id: "skincare",
    name: "مراقبت پوست",
    description: "محصولاتی سنجیده برای روتین روز و شب.",
  },
  {
    id: "fragrance",
    name: "عطر و رایحه",
    description: "رایحه‌هایی با شخصیت روشن و حضور ماندگار.",
  },
] as const;

const aveliaSelectionProducts: readonly Product[] = [
  {
    id: "makeup-lipstick-01",
    slug: "satin-lipstick-muted-rose",
    name: "رژ لب ساتن رز",
    brand: "AVELIA SELECT",
    categoryId: "makeup",
    shortDescription: "رنگی متعادل با جلوه‌ی ساتن و بافتی نرم",
    description:
      "رژ لبی با رنگ رز خنثی و جلوه‌ی ساتن که برای آرایش روزانه و ترکیب‌های مینیمال انتخاب شده است. بافت نرم آن به‌سادگی روی لب می‌نشیند و بدون جلوه‌ی سنگین، رنگی یکدست و آراسته ایجاد می‌کند.",
    keyFeatures: [
      "جلوه‌ی ساتن با درخشندگی کنترل‌شده",
      "رنگ رز خنثی و هماهنگ با آرایش روزانه",
      "بافت نرم و پوشش‌پذیر",
    ],
    usage:
      "رژ لب را از مرکز لب به سمت گوشه‌ها بکشید. برای پوشش دقیق‌تر، پیش از استفاده خط لب هم‌رنگ به‌کار ببرید.",
    priceRial: 18_900_000,
    stock: 12,
    isOriginal: true,
    isFeatured: false,
    sortOrder: 20,
    images: [
      {
        src: "/images/products/satin-lipstick.webp",
        alt: "رژ لب ساتن رز با بسته‌بندی مشکی و شامپاینی",
      },
      {
        src: "/images/products/satin-lipstick-detail.webp",
        alt: "نمای نزدیک بافت و بسته‌بندی رژ لب ساتن رز",
      },
      {
        src: "/images/home/category-makeup-v2.webp",
        alt: "چیدمان ادیتوریال لوازم آرایشی AVELIA",
      },
    ],
  },
  {
    id: "makeup-foundation-01",
    slug: "silk-finish-foundation",
    name: "کرم‌پودر فینیش ابریشمی",
    brand: "AVELIA SELECT",
    categoryId: "makeup",
    shortDescription: "پوششی یکدست با جلوه‌ای طبیعی و سبک",
    description:
      "کرم‌پودری با پوشش متوسط و قابل ساخت که ظاهر پوست را یکدست می‌کند و جلوه‌ای طبیعی باقی می‌گذارد. انتخابی متعادل برای زمانی که پوشش مرتب را بدون حس سنگینی می‌خواهید.",
    keyFeatures: [
      "پوشش متوسط و قابل لایه‌سازی",
      "جلوه‌ی طبیعی و ابریشمی",
      "پخش آسان با براش یا اسفنج آرایشی",
    ],
    usage:
      "مقدار کمی از محصول را از مرکز صورت به بیرون پخش کنید و برای پوشش بیشتر، لایه‌ی دوم را فقط روی نواحی موردنیاز بزنید.",
    priceRial: 29_800_000,
    stock: 8,
    isOriginal: true,
    isFeatured: false,
    sortOrder: 21,
    images: [
      {
        src: "/images/products/foundation-fluid.webp",
        alt: "بطری کرم‌پودر شیشه‌ای با پمپ شامپاینی",
      },
      {
        src: "/images/products/foundation-fluid-detail.webp",
        alt: "نمای نزدیک بسته‌بندی کرم‌پودر فینیش ابریشمی",
      },
      {
        src: "/images/home/category-makeup-v2.webp",
        alt: "چیدمان پریمیوم محصولات آرایشی",
      },
    ],
  },
  {
    id: "makeup-mascara-01",
    slug: "definition-volume-mascara",
    name: "ریمل حجم‌دهنده دیفینیشن",
    brand: "AVELIA SELECT",
    categoryId: "makeup",
    shortDescription: "تفکیک دقیق مژه‌ها با حجم قابل کنترل",
    description:
      "ریملی با برس متراکم برای تفکیک مژه‌ها و ساختن حجم به‌اندازه. فرمول و طراحی برس برای آرایشی تمیز، دقیق و قابل کنترل انتخاب شده‌اند.",
    keyFeatures: [
      "برس متراکم برای تفکیک بهتر",
      "حجم قابل ساخت بدون ظاهر سنگین",
      "رنگ مشکی عمیق",
    ],
    usage:
      "برس را از ریشه‌ی مژه‌ها با حرکت آرام رو به بالا بکشید. برای حجم بیشتر پس از خشک‌شدن لایه‌ی اول، یک لایه‌ی نازک دیگر اضافه کنید.",
    priceRial: 21_400_000,
    stock: 0,
    isOriginal: true,
    isFeatured: false,
    sortOrder: 22,
    images: [
      {
        src: "/images/products/mascara-volume.webp",
        alt: "ریمل مشکی و برس حجم‌دهنده با جزئیات شامپاینی",
      },
      {
        src: "/images/products/mascara-volume-detail.webp",
        alt: "نمای نزدیک برس ریمل حجم‌دهنده دیفینیشن",
      },
      {
        src: "/images/home/category-makeup-v2.webp",
        alt: "فضای ادیتوریال مجموعه لوازم آرایشی",
      },
    ],
  },
  {
    id: "skincare-serum-01",
    slug: "restorative-night-serum",
    name: "سرم شب بازسازی",
    brand: "AVELIA SELECT",
    categoryId: "skincare",
    shortDescription: "فرمولی متمرکز برای روتین مراقبت شبانه",
    description:
      "سرمی سبک برای تکمیل روتین شب که بافتی روان دارد و بدون ایجاد حس سنگینی جذب می‌شود. این محصول برای تجربه‌ای آرام و منظم در مراقبت شبانه انتخاب شده است.",
    keyFeatures: [
      "بافت سبک و جذب راحت",
      "مناسب استفاده در روتین شب",
      "بسته‌بندی قطره‌چکانی برای مصرف دقیق",
    ],
    usage:
      "شب‌ها دو تا سه قطره روی پوست تمیز صورت و گردن پخش کنید و سپس از مرطوب‌کننده‌ی مناسب خود استفاده کنید.",
    priceRial: 31_200_000,
    stock: 7,
    isOriginal: true,
    isFeatured: false,
    sortOrder: 23,
    images: [
      {
        src: "/images/products/night-serum.webp",
        alt: "بطری سرم شب تیره با قطره‌چکان شامپاینی",
      },
      {
        src: "/images/products/night-serum-detail.webp",
        alt: "نمای نزدیک بطری سرم شب بازسازی",
      },
      {
        src: "/images/home/category-skincare.webp",
        alt: "محصولات مراقبت پوست در نور طبیعی و آرام",
      },
    ],
  },
  {
    id: "skincare-cream-01",
    slug: "daily-rich-cream",
    name: "کرم غنی روزانه",
    brand: "AVELIA SELECT",
    categoryId: "skincare",
    shortDescription: "بافتی لطیف برای مراقبت آرام روزانه",
    description:
      "کرم روزانه‌ای با بافت غنی اما خوش‌نشین که برای آخرین مرحله‌ی روتین مراقبت انتخاب شده است. حس نرم و راحت آن، استفاده‌ی روزمره را به بخشی آرام از شروع روز تبدیل می‌کند.",
    keyFeatures: [
      "بافت غنی با پخش یکنواخت",
      "مناسب آخرین مرحله‌ی روتین روز",
      "بسته‌بندی مینیمال و کاربردی",
    ],
    usage:
      "صبح مقدار مناسبی روی پوست تمیز صورت و گردن بزنید و با حرکت‌های آرام پخش کنید. در طول روز ضدآفتاب را فراموش نکنید.",
    priceRial: 26_800_000,
    stock: 15,
    isOriginal: true,
    isFeatured: false,
    sortOrder: 24,
    images: [
      {
        src: "/images/products/daily-cream.webp",
        alt: "ظرف کرم روزانه سفید روی سنگ روشن",
      },
      {
        src: "/images/products/daily-cream-detail.webp",
        alt: "نمای نزدیک ظرف کرم غنی روزانه",
      },
      {
        src: "/images/home/category-skincare.webp",
        alt: "چیدمان آرام محصولات مراقبت پوست",
      },
    ],
  },
  {
    id: "skincare-sunscreen-01",
    slug: "daily-veil-sunscreen",
    name: "ضدآفتاب دیلی وِیل",
    brand: "AVELIA SELECT",
    categoryId: "skincare",
    shortDescription: "بافت سبک برای آخرین مرحله‌ی روتین صبح",
    description:
      "ضدآفتابی با بافت سبک و ظاهر تمیز که برای استفاده‌ی منظم روزانه انتخاب شده است. بسته‌بندی کاربردی و پخش آسان، تمدید محصول را در طول روز ساده‌تر می‌کند.",
    keyFeatures: [
      "بافت سبک و قابل پخش",
      "مناسب آخرین مرحله‌ی روتین صبح",
      "تیوب کاربردی برای استفاده‌ی روزمره",
    ],
    usage:
      "پانزده دقیقه پیش از قرارگرفتن در معرض آفتاب، مقدار کافی روی پوست صورت و گردن بزنید و طبق دستور محصول در طول روز تمدید کنید.",
    priceRial: 24_600_000,
    stock: 11,
    isOriginal: true,
    isFeatured: false,
    sortOrder: 25,
    images: [
      {
        src: "/images/products/daily-sunscreen.webp",
        alt: "تیوب ضدآفتاب سفید با در شامپاینی",
      },
      {
        src: "/images/products/daily-sunscreen-detail.webp",
        alt: "نمای نزدیک بسته‌بندی ضدآفتاب دیلی ویل",
      },
      {
        src: "/images/home/category-skincare.webp",
        alt: "فضای روشن مجموعه مراقبت پوست",
      },
    ],
  },
  {
    id: "fragrance-warm-01",
    slug: "warm-eau-de-parfum-01",
    name: "اُ دو پرفیوم شماره ۰۱",
    brand: "AVELIA SELECT",
    categoryId: "fragrance",
    shortDescription: "رایحه‌ای گرم با حضوری آرام و ماندگار",
    description:
      "رایحه‌ای گرم و متعادل که بدون غلبه بر فضا، حضوری مشخص و به‌یادماندنی دارد. شماره ۰۱ برای لحظه‌هایی انتخاب شده که وقار و آرامش باید کنار هم بمانند.",
    keyFeatures: [
      "خانواده‌ی بویایی گرم و متعادل",
      "مناسب استفاده‌ی روز و عصر",
      "پخش بوی آرام و حضور ماندگار",
    ],
    usage:
      "مقدار کمی روی نقاط نبض اسپری کنید. برای حفظ کیفیت رایحه، شیشه را دور از نور مستقیم و گرمای زیاد نگهداری کنید.",
    priceRial: 48_500_000,
    stock: 5,
    isOriginal: true,
    isFeatured: false,
    sortOrder: 26,
    images: [
      {
        src: "/images/products/warm-fragrance.webp",
        alt: "بطری شیشه‌ای عطر گرم روی زمینه سفید",
      },
      {
        src: "/images/products/warm-fragrance-detail.webp",
        alt: "نمای نزدیک شیشه اُ دو پرفیوم شماره ۰۱",
      },
      {
        src: "/images/home/category-fragrance.webp",
        alt: "عطر شیشه‌ای در فضای ادیتوریال تیره",
      },
    ],
  },
  {
    id: "fragrance-night-01",
    slug: "nocturne-eau-de-parfum",
    name: "اُ دو پرفیوم نوکتورن",
    brand: "AVELIA SELECT",
    categoryId: "fragrance",
    shortDescription: "رایحه‌ای عمیق برای لحظه‌های آرام شب",
    description:
      "نوکتورن رایحه‌ای عمیق‌تر با ساختاری گرم و تاریک است؛ انتخابی برای عصر و شب که حضور خود را با وقار و بدون هیاهو نشان می‌دهد.",
    keyFeatures: [
      "شخصیت گرم و عمیق",
      "مناسب استفاده در عصر و شب",
      "شیشه‌ی دودی با طراحی مینیمال",
    ],
    usage:
      "یک تا دو اسپری روی نقاط نبض کافی است. از مالش پوست پس از اسپری خودداری کنید تا ساختار رایحه طبیعی‌تر باقی بماند.",
    priceRial: 56_000_000,
    stock: 3,
    isOriginal: true,
    isFeatured: false,
    sortOrder: 27,
    images: [
      {
        src: "/images/products/night-fragrance.webp",
        alt: "بطری دودی عطر نوکتورن روی پایه سنگی مشکی",
      },
      {
        src: "/images/products/night-fragrance-detail.webp",
        alt: "نمای نزدیک شیشه عطر شب نوکتورن",
      },
      {
        src: "/images/home/category-fragrance.webp",
        alt: "فضای ادیتوریال مجموعه عطر و رایحه",
      },
    ],
  },
  {
    id: "fragrance-oil-01",
    slug: "amber-perfume-oil",
    name: "روغن عطر آمبر",
    brand: "AVELIA SELECT",
    categoryId: "fragrance",
    shortDescription: "رایحه‌ای متمرکز در فرم ظریف و همراه",
    description:
      "روغن عطر آمبر با فرم باریک و استفاده‌ی دقیق، برای همراه‌داشتن در طول روز انتخاب شده است. رایحه‌ی گرم آن نزدیک به پوست باقی می‌ماند و تجربه‌ای شخصی‌تر می‌سازد.",
    keyFeatures: [
      "فرم رول‌آن برای استفاده‌ی دقیق",
      "اندازه‌ی مناسب برای همراه‌داشتن",
      "رایحه‌ی گرم و نزدیک به پوست",
    ],
    usage:
      "رول‌آن را به‌آرامی روی نقاط نبض بکشید. از تماس با چشم و استفاده روی پوست تحریک‌شده خودداری کنید.",
    priceRial: 22_400_000,
    stock: 9,
    isOriginal: true,
    isFeatured: false,
    sortOrder: 28,
    images: [
      {
        src: "/images/products/perfume-oil.webp",
        alt: "بطری باریک روغن عطر آمبر با در شامپاینی",
      },
      {
        src: "/images/products/perfume-oil-detail.webp",
        alt: "نمای نزدیک روغن عطر آمبر در شیشه شفاف",
      },
      {
        src: "/images/home/category-fragrance.webp",
        alt: "چیدمان آرام مجموعه رایحه‌های AVELIA",
      },
    ],
  },
] as const;

export const products: readonly Product[] = [
  ...importedProducts,
  ...aveliaSelectionProducts,
];
