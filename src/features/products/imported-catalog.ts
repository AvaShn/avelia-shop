import type { Product, ProductCategoryId } from "@/features/products/types";

type ImportedProductKind = "foundation" | "mascara" | "skincare";

type ImportedProductSeed = {
  slug: string;
  name: string;
  brand: string;
  categoryId: ProductCategoryId;
  kind: ImportedProductKind;
  assetName: string;
  shortDescription: string;
  description: string;
  priceRial: number;
  compareAtPriceRial?: number | undefined;
  stock: number;
  isFeatured?: boolean | undefined;
  sortOrder: number;
  usage?: string | undefined;
};

const productGuidance: Record<
  ImportedProductKind,
  Pick<Product, "keyFeatures" | "usage">
> = {
  foundation: {
    keyFeatures: [
      "بافت یکدست و مناسب آرایش روزانه",
      "قابل پخش با براش یا اسفنج آرایشی",
      "بسته‌بندی کاربردی برای مصرف دقیق",
    ],
    usage:
      "مقدار کمی از محصول را از مرکز صورت به بیرون پخش کنید. برای پوشش بیشتر، محصول را به‌تدریج و فقط روی نواحی موردنیاز لایه‌سازی کنید.",
  },
  mascara: {
    keyFeatures: [
      "رنگ مشکی برای تعریف بهتر مژه‌ها",
      "برس طراحی‌شده برای پوشش یکنواخت",
      "قابل لایه‌سازی برای رسیدن به حجم دلخواه",
    ],
    usage:
      "برس را از ریشه‌ی مژه‌ها با حرکت آرام به سمت نوک بکشید. پیش از خشک‌شدن کامل، لایه‌ی بعدی را برای حجم بیشتر اضافه کنید.",
  },
  skincare: {
    keyFeatures: [
      "بافت خوش‌نشین برای تکمیل روتین مراقبت پوست",
      "بسته‌بندی بهداشتی و مناسب مصرف روزانه",
      "انتخاب‌شده از مجموعه‌ی تخصصی Clinique",
    ],
    usage:
      "روی پوست تمیز و مطابق نیاز روتین روز یا شب استفاده کنید. برای جزئیات مصرف و سازگاری با پوست، دستور درج‌شده روی بسته‌بندی اصلی را دنبال کنید.",
  },
};

const importedProductSeeds: readonly ImportedProductSeed[] = [
  {
    slug: "maybelline-super-stay-lumi-matte-119",
    name: "کرم‌پودر Super Stay Lumi-Matte شماره ۱۱۹",
    brand: "MAYBELLINE NEW YORK",
    categoryId: "makeup",
    kind: "foundation",
    assetName: "maybelline-super-stay-lumi-matte-119",
    shortDescription: "کرم‌پودر سبک با جلوه‌ی مات روشن و رنگ ۱۱۹",
    description:
      "Super Stay Lumi-Matte از Maybelline برای آرایشی یکدست با جلوه‌ای مات اما زنده طراحی شده است. رنگ ۱۱۹ در بطری پمپ‌دار، استفاده‌ی دقیق و کنترل‌شده را ساده می‌کند.",
    priceRial: 16_900_000,
    compareAtPriceRial: 18_900_000,
    stock: 9,
    isFeatured: true,
    sortOrder: 1,
  },
  {
    slug: "maybelline-super-stay-active-wear-03",
    name: "کرم‌پودر Super Stay Active Wear 30H شماره ۰۳",
    brand: "MAYBELLINE NEW YORK",
    categoryId: "makeup",
    kind: "foundation",
    assetName: "maybelline-super-stay-active-wear-03",
    shortDescription: "پوشش ماندگار با فینیش مرتب و رنگ ۰۳",
    description:
      "کرم‌پودر Super Stay Active Wear 30H انتخابی برای پوشش ماندگار و ظاهر یکدست است. پمپ محصول کمک می‌کند مقدار موردنیاز را بدون اتلاف بردارید.",
    priceRial: 17_800_000,
    stock: 7,
    sortOrder: 2,
  },
  {
    slug: "maybelline-lifter-plump-glow-220",
    name: "کرم‌پودر Lifter Plump & Glow شماره ۲۲۰",
    brand: "MAYBELLINE NEW YORK",
    categoryId: "makeup",
    kind: "foundation",
    assetName: "maybelline-lifter-plump-glow-220",
    shortDescription: "جلوه‌ای درخشان و شاداب با رنگ ۲۲۰",
    description:
      "Lifter Plump & Glow برای دوست‌داران فینیش شاداب و درخشان انتخاب شده است. بطری شیشه‌ای و قطره‌چکان، کنترل مقدار و ترکیب آن با روتین آرایشی را آسان می‌کند.",
    priceRial: 15_600_000,
    stock: 6,
    sortOrder: 3,
  },
  {
    slug: "maybelline-age-rewind-perfector-00",
    name: "پرفکتور Instant Age Rewind 4-in-1 Glow شماره ۰۰",
    brand: "MAYBELLINE NEW YORK",
    categoryId: "makeup",
    kind: "foundation",
    assetName: "maybelline-age-rewind-perfector-00",
    shortDescription: "پرفکتور چندکاره با جلوه‌ی طبیعی Fair-Light",
    description:
      "Instant Age Rewind Perfector 4-in-1 Glow محصولی چندکاره برای آماده‌سازی و یکدست‌تر نشان‌دادن ظاهر پوست است. اپلیکاتور اسفنجی، استفاده‌ی سریع و موضعی را ممکن می‌کند.",
    priceRial: 14_900_000,
    compareAtPriceRial: 16_500_000,
    stock: 11,
    sortOrder: 4,
  },
  {
    slug: "essence-i-love-extreme-volume",
    name: "ریمل I Love Extreme Volume",
    brand: "ESSENCE",
    categoryId: "makeup",
    kind: "mascara",
    assetName: "essence-i-love-extreme-volume",
    shortDescription: "ریمل حجم‌دهنده با برس بزرگ و رنگ مشکی",
    description:
      "I Love Extreme Volume از Essence با برس بزرگ برای پوشاندن مژه‌ها و ساختن حجمی مشخص طراحی شده است. بسته‌بندی مشکی و صورتی آن یکی از شناخته‌شده‌ترین انتخاب‌های این مجموعه است.",
    priceRial: 8_900_000,
    compareAtPriceRial: 10_500_000,
    stock: 15,
    isFeatured: true,
    sortOrder: 5,
  },
  {
    slug: "essence-i-love-extreme-crazy-volume",
    name: "ریمل I Love Extreme Crazy Volume",
    brand: "ESSENCE",
    categoryId: "makeup",
    kind: "mascara",
    assetName: "essence-i-love-extreme-crazy-volume",
    shortDescription: "حجم چشمگیر با برس فیبری و رنگ مشکی",
    description:
      "نسخه‌ی Crazy Volume برای کسانی انتخاب شده که حجم نمایان‌تری می‌خواهند. برس فیبری محصول مژه‌ها را می‌پوشاند و امکان لایه‌سازی کنترل‌شده را فراهم می‌کند.",
    priceRial: 9_400_000,
    stock: 12,
    sortOrder: 6,
  },
  {
    slug: "bourjois-volume-glamour-red",
    name: "ریمل Volume Glamour",
    brand: "BOURJOIS PARIS",
    categoryId: "makeup",
    kind: "mascara",
    assetName: "bourjois-volume-glamour-red",
    shortDescription: "ریمل کلاسیک حجم‌دهنده با برس دقیق",
    description:
      "Volume Glamour از Bourjois یک ریمل کلاسیک برای تعریف و حجم‌دادن به مژه‌هاست. فرم باریک بدنه و برس متراکم، کنترل حرکت را هنگام آرایش ساده‌تر می‌کند.",
    priceRial: 12_800_000,
    compareAtPriceRial: 14_500_000,
    stock: 8,
    sortOrder: 7,
  },
  {
    slug: "loreal-mega-volume-collagene-24h",
    name: "ریمل Mega Volume Collagene 24H",
    brand: "L'ORÉAL PARIS",
    categoryId: "makeup",
    kind: "mascara",
    assetName: "loreal-mega-volume-collagene-24h",
    shortDescription: "حجم پررنگ با برس بزرگ و بدنه‌ی مشکی",
    description:
      "Mega Volume Collagene 24H با برس بزرگ و طراحی مشکی مینیمال، برای ایجاد حجم نمایان و پوشش یکنواخت مژه‌ها در مجموعه قرار گرفته است.",
    priceRial: 17_900_000,
    stock: 5,
    sortOrder: 8,
  },
  {
    slug: "loreal-paradise-big-deal",
    name: "ریمل Paradise Big Deal",
    brand: "L'ORÉAL PARIS",
    categoryId: "makeup",
    kind: "mascara",
    assetName: "loreal-paradise-big-deal",
    shortDescription: "ریمل حجم‌دهنده با طراحی صورتی رز",
    description:
      "Paradise Big Deal با برس انعطاف‌پذیر برای پوشش و جداسازی مژه‌ها انتخاب شده است. بدنه‌ی رز آن جلوه‌ای ظریف و متمایز در مجموعه‌ی آرایشی AVELIA دارد.",
    priceRial: 19_600_000,
    compareAtPriceRial: 22_000_000,
    stock: 6,
    sortOrder: 9,
  },
  {
    slug: "loreal-panorama-black",
    name: "ریمل Volume Million Lashes Panorama مشکی",
    brand: "L'ORÉAL PARIS",
    categoryId: "makeup",
    kind: "mascara",
    assetName: "loreal-panorama-black",
    shortDescription: "تفکیک و حجم مژه‌ها با طراحی مشکی لوکس",
    description:
      "Panorama در نسخه‌ی مشکی برای ایجاد نمای بازتر و تفکیک‌شده‌تر مژه‌ها طراحی شده است. برس چندسطحی آن برای رسیدن به مژه‌های ریزتر نیز مناسب است.",
    priceRial: 18_900_000,
    stock: 10,
    isFeatured: true,
    sortOrder: 10,
  },
  {
    slug: "loreal-panorama-gold",
    name: "ریمل Volume Million Lashes Panorama طلایی",
    brand: "L'ORÉAL PARIS",
    categoryId: "makeup",
    kind: "mascara",
    assetName: "loreal-panorama-gold",
    shortDescription: "ریمل پانوراما در بسته‌بندی طلایی شاخص",
    description:
      "نسخه‌ی طلایی Panorama همان فرم دقیق برس را در بسته‌بندی طلایی و مشکی ارائه می‌کند؛ انتخابی مناسب برای حجم‌دادن و مشخص‌تر کردن فرم مژه‌ها.",
    priceRial: 20_400_000,
    compareAtPriceRial: 23_000_000,
    stock: 4,
    sortOrder: 11,
  },
  {
    slug: "clinique-moisture-surge-concentrate",
    name: "کنسانتره آبرسان Moisture Surge",
    brand: "CLINIQUE",
    categoryId: "skincare",
    kind: "skincare",
    assetName: "clinique-moisture-surge-concentrate",
    shortDescription: "ژل آبرسان سبک برای تکمیل روتین پوست",
    description:
      "Moisture Surge Hydrating Supercharged Concentrate با بافت ژلی سبک برای افزودن یک مرحله‌ی آبرسان به روتین انتخاب شده است. پمپ محصول، مصرف روزانه را دقیق و تمیز نگه می‌دارد.",
    priceRial: 42_900_000,
    compareAtPriceRial: 48_000_000,
    stock: 8,
    sortOrder: 12,
  },
  {
    slug: "clinique-all-about-eyes-rich",
    name: "کرم دور چشم All About Eyes Rich",
    brand: "CLINIQUE",
    categoryId: "skincare",
    kind: "skincare",
    assetName: "clinique-all-about-eyes-rich",
    shortDescription: "کرم دور چشم با بافت غنی و لطیف",
    description:
      "All About Eyes Rich یک کرم دور چشم با بافت غنی است که برای بخش هدفمند روتین مراقبت پوست انتخاب شده. ظرف کوچک آن برای برداشتن مقدار کنترل‌شده مناسب است.",
    priceRial: 39_800_000,
    stock: 7,
    sortOrder: 13,
    usage:
      "صبح و شب مقدار بسیار کمی را با انگشت حلقه و ضربه‌های آرام روی استخوان دور چشم پخش کنید. از تماس مستقیم با چشم خودداری کنید.",
  },
  {
    slug: "clinique-moisture-surge-eye-96h",
    name: "کنسانتره دور چشم Moisture Surge Eye 96H",
    brand: "CLINIQUE",
    categoryId: "skincare",
    kind: "skincare",
    assetName: "clinique-moisture-surge-eye-96h",
    shortDescription: "ژل سبک دور چشم با اپلیکاتور دقیق",
    description:
      "Moisture Surge Eye 96-Hour Hydro-Filler Concentrate با بافت ژلی و اپلیکاتور دقیق برای روتین سبک دور چشم طراحی شده است.",
    priceRial: 44_600_000,
    stock: 6,
    sortOrder: 14,
    usage:
      "مقدار کمی را روی استخوان دور چشم قرار دهید و با ضربه‌های ملایم پخش کنید. از تماس مستقیم اپلیکاتور یا محصول با چشم خودداری کنید.",
  },
  {
    slug: "clinique-smart-clinical-repair-eye",
    name: "کرم دور چشم Smart Clinical Repair",
    brand: "CLINIQUE",
    categoryId: "skincare",
    kind: "skincare",
    assetName: "clinique-smart-clinical-repair-eye",
    shortDescription: "کرم تخصصی دور چشم در بسته‌بندی پمپ‌دار",
    description:
      "Smart Clinical Repair Wrinkle Correcting Eye Cream در بسته‌بندی پمپ‌دار، یک انتخاب متمرکز برای مرحله‌ی دور چشم در روتین مراقبت است.",
    priceRial: 51_900_000,
    compareAtPriceRial: 58_000_000,
    stock: 5,
    sortOrder: 15,
    usage:
      "صبح و شب مقدار کمی را با ضربه‌های آرام روی استخوان دور چشم پخش کنید. برای پوست حساس ابتدا تست موضعی انجام دهید.",
  },
  {
    slug: "clinique-even-better-eyes",
    name: "کرم دور چشم Even Better Eyes",
    brand: "CLINIQUE",
    categoryId: "skincare",
    kind: "skincare",
    assetName: "clinique-even-better-eyes",
    shortDescription: "کرم دور چشم با اپلیکاتور خنک فلزی",
    description:
      "Even Better Eyes Dark Circle Corrector با اپلیکاتور فلزی برای استفاده‌ی ملایم و دقیق در ناحیه‌ی دور چشم ارائه شده است.",
    priceRial: 46_500_000,
    stock: 5,
    sortOrder: 16,
    usage:
      "مقدار کمی از محصول را با اپلیکاتور روی استخوان دور چشم بگذارید و با انگشت حلقه به‌آرامی پخش کنید. از تماس مستقیم با چشم خودداری کنید.",
  },
  {
    slug: "clinique-smart-clinical-repair-cream",
    name: "کرم Smart Clinical Repair",
    brand: "CLINIQUE",
    categoryId: "skincare",
    kind: "skincare",
    assetName: "clinique-smart-clinical-repair-cream",
    shortDescription: "کرم صورت با بافت غنی برای روتین روز یا شب",
    description:
      "Smart Clinical Repair Wrinkle Correcting Cream یک کرم صورت با بافت غنی است که در مرحله‌ی پایانی روتین مراقبت پوست استفاده می‌شود.",
    priceRial: 67_500_000,
    stock: 4,
    sortOrder: 17,
  },
  {
    slug: "clinique-dramatically-different-lotion",
    name: "لوسیون Dramatically Different Moisturizing Lotion+",
    brand: "CLINIQUE",
    categoryId: "skincare",
    kind: "skincare",
    assetName: "clinique-dramatically-different-lotion",
    shortDescription: "لوسیون مرطوب‌کننده سبک در بطری پمپ‌دار",
    description:
      "Dramatically Different Moisturizing Lotion+ با بافت لوسیونی و بطری پمپ‌دار، برای مرطوب‌کردن پوست در روتین روزانه انتخاب شده است.",
    priceRial: 41_800_000,
    compareAtPriceRial: 46_000_000,
    stock: 9,
    sortOrder: 18,
  },
  {
    slug: "clinique-moisture-surge-100h",
    name: "ژل کرم آبرسان Moisture Surge 100H",
    brand: "CLINIQUE",
    categoryId: "skincare",
    kind: "skincare",
    assetName: "clinique-moisture-surge-100h",
    shortDescription: "ژل کرم آبرسان با بافت سبک و شفاف",
    description:
      "Moisture Surge 100H Auto-Replenishing Hydrator با بافت ژل‌کرم سبک، برای تکمیل یک روتین آبرسان و آرام انتخاب شده است.",
    priceRial: 54_900_000,
    compareAtPriceRial: 61_500_000,
    stock: 10,
    isFeatured: true,
    sortOrder: 19,
  },
] as const;

export const importedProducts: readonly Product[] = importedProductSeeds.map(
  (seed) => ({
    id: `imported-${seed.slug}`,
    slug: seed.slug,
    name: seed.name,
    brand: seed.brand,
    categoryId: seed.categoryId,
    shortDescription: seed.shortDescription,
    description: seed.description,
    keyFeatures: productGuidance[seed.kind].keyFeatures,
    usage: seed.usage ?? productGuidance[seed.kind].usage,
    priceRial: seed.priceRial,
    compareAtPriceRial: seed.compareAtPriceRial,
    stock: seed.stock,
    isOriginal: true,
    isFeatured: seed.isFeatured ?? false,
    sortOrder: seed.sortOrder,
    images: [
      {
        src: `/images/products/imported/${seed.assetName}.webp`,
        alt: `${seed.name} از برند ${seed.brand}`,
      },
      {
        src: `/images/products/imported/${seed.assetName}-detail.webp`,
        alt: `نمای نزدیک بسته‌بندی ${seed.name}`,
      },
      {
        src:
          seed.categoryId === "skincare"
            ? "/images/home/category-skincare.webp"
            : "/images/home/category-makeup-v2.webp",
        alt:
          seed.categoryId === "skincare"
            ? "فضای ادیتوریال مجموعه مراقبت پوست AVELIA"
            : "فضای ادیتوریال مجموعه لوازم آرایشی AVELIA",
      },
    ],
  }),
);
