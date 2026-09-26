"use client";

import Link from "next/link";
import {
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  PackagePlus,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminApiError, readAdminEnvelope } from "@/features/admin/client-api";
import type {
  AdminProductEditor,
  AdminProductSummary,
  AdminProductWorkspace,
} from "@/features/admin/schemas";
import { formatPersianInteger } from "@/lib/i18n/format-number";

type ProductForm = {
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  keyFeatures: string;
  usage: string;
  priceRial: string;
  compareAtPriceRial: string;
  images: string;
  stock: string;
  sortOrder: string;
  isOriginal: boolean;
  isFeatured: boolean;
  isPublished: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  brand: "",
  categoryId: "makeup",
  shortDescription: "",
  description: "",
  keyFeatures: "",
  usage: "",
  priceRial: "",
  compareAtPriceRial: "",
  images: "",
  stock: "0",
  sortOrder: "0",
  isOriginal: true,
  isFeatured: false,
  isPublished: true,
};

const textareaClassName =
  "border-border bg-surface focus-visible:border-accent focus-visible:ring-accent/20 w-full resize-y rounded-md border px-4 py-3 text-base leading-7 outline-none focus-visible:ring-4 sm:text-sm";
const selectClassName =
  "border-border bg-surface focus-visible:border-accent focus-visible:ring-accent/20 h-12 w-full rounded-md border px-4 text-sm outline-none focus-visible:ring-4";

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function parseInteger(value: string, label: string) {
  const normalized = value
    .trim()
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[٬,\s]/g, "");
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${label} باید یک عدد صحیح معتبر باشد.`);
  }
  return parsed;
}

function lines(value: string) {
  return [...new Set(value.split(/\r?\n/).map((item) => item.trim()))].filter(
    Boolean,
  );
}

function FieldLabel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{title}</span>
      {children}
      {hint ? (
        <span className="text-muted-foreground mt-2 block text-xs leading-6">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function ProductFlag({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="border-border/70 flex cursor-pointer items-start gap-3 rounded-lg border p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-accent mt-1 size-4"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-muted-foreground mt-1 block text-xs leading-6">
          {description}
        </span>
      </span>
    </label>
  );
}

export function AdminProductsPanel({
  onUnauthorized,
}: {
  onUnauthorized: (message: string) => void;
}) {
  const formSectionRef = useRef<HTMLElement>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [workspace, setWorkspace] = useState<AdminProductWorkspace | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorLoading, setIsEditorLoading] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [pendingDeleteProductId, setPendingDeleteProductId] = useState<
    string | null
  >(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProductName, setEditingProductName] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await readAdminEnvelope<AdminProductWorkspace>(
        await fetch("/api/admin/products", { cache: "no-store" }),
      );
      setWorkspace(payload.data);
      setForm((current) => ({
        ...current,
        categoryId: payload.data.categories.some(
          (category) => category.id === current.categoryId,
        )
          ? current.categoryId
          : (payload.data.categories[0]?.id ?? ""),
      }));
    } catch (reason: unknown) {
      if (reason instanceof AdminApiError && reason.status === 401) {
        onUnauthorized(reason.message);
      } else {
        setError(
          reason instanceof Error
            ? reason.message
            : "دریافت اطلاعات محصولات انجام نشد.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  function updateForm<Key extends keyof ProductForm>(
    key: Key,
    value: ProductForm[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingProductId(null);
    setEditingProductName(null);
    setForm({
      ...emptyForm,
      categoryId: workspace?.categories[0]?.id ?? "makeup",
    });
  }

  async function editProduct(product: AdminProductSummary) {
    setIsEditorLoading(true);
    setError(null);
    setNotice(null);
    try {
      const payload = await readAdminEnvelope<AdminProductEditor>(
        await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
          cache: "no-store",
        }),
      );
      const detail = payload.data;
      setEditingProductId(detail.id);
      setEditingProductName(detail.name);
      setForm({
        name: detail.name,
        slug: detail.slug,
        brand: detail.brand,
        categoryId: detail.category.id,
        shortDescription: detail.shortDescription,
        description: detail.description,
        keyFeatures: detail.keyFeatures.join("\n"),
        usage: detail.usage,
        priceRial: String(detail.priceRial),
        compareAtPriceRial:
          detail.compareAtPriceRial === null
            ? ""
            : String(detail.compareAtPriceRial),
        images: detail.images.join("\n"),
        stock: String(detail.stock),
        sortOrder: String(detail.sortOrder),
        isOriginal: detail.isOriginal,
        isFeatured: detail.isFeatured,
        isPublished: detail.isPublished,
      });
      requestAnimationFrame(() => {
        formSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (reason: unknown) {
      if (reason instanceof AdminApiError && reason.status === 401) {
        onUnauthorized(reason.message);
      } else {
        setError(
          reason instanceof Error
            ? reason.message
            : "دریافت اطلاعات محصول انجام نشد.",
        );
      }
    } finally {
      setIsEditorLoading(false);
    }
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      const product = {
        name: form.name,
        slug: form.slug,
        brand: form.brand,
        categoryId: form.categoryId,
        shortDescription: form.shortDescription,
        description: form.description,
        keyFeatures: lines(form.keyFeatures),
        usage: form.usage,
        priceRial: parseInteger(form.priceRial, "قیمت فروش"),
        compareAtPriceRial: form.compareAtPriceRial.trim()
          ? parseInteger(form.compareAtPriceRial, "قیمت قبل از تخفیف")
          : null,
        images: lines(form.images),
        stock: parseInteger(form.stock, "موجودی"),
        sortOrder: parseInteger(form.sortOrder, "اولویت نمایش"),
        isOriginal: form.isOriginal,
        isFeatured: form.isFeatured,
        isPublished: form.isPublished,
      };

      const payload = await readAdminEnvelope<AdminProductSummary>(
        await fetch(
          editingProductId
            ? `/api/admin/products/${encodeURIComponent(editingProductId)}`
            : "/api/admin/products",
          {
            method: editingProductId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product),
          },
        ),
      );
      setWorkspace((current) => {
        if (!current) return current;
        if (editingProductId) {
          return {
            ...current,
            products: current.products.map((currentProduct) =>
              currentProduct.id === payload.data.id
                ? payload.data
                : currentProduct,
            ),
          };
        }
        return { ...current, products: [payload.data, ...current.products] };
      });
      setNotice(
        editingProductId
          ? `تغییرات محصول «${payload.data.name}» با موفقیت ذخیره شد.`
          : `محصول «${payload.data.name}» با موفقیت به پایگاه داده اضافه شد.`,
      );
      resetForm();
    } catch (reason: unknown) {
      if (reason instanceof AdminApiError && reason.status === 401) {
        onUnauthorized(reason.message);
      } else {
        setError(
          reason instanceof Error
            ? reason.message
            : editingProductId
              ? "ذخیره تغییرات محصول انجام نشد."
              : "ثبت محصول انجام نشد.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteProduct(product: AdminProductSummary) {
    setDeletingProductId(product.id);
    setError(null);
    setNotice(null);
    try {
      await readAdminEnvelope<{
        deleted: true;
        id: string;
        name: string;
        slug: string;
        removedCartItems: number;
      }>(
        await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
          method: "DELETE",
        }),
      );
      setWorkspace((current) =>
        current
          ? {
              ...current,
              products: current.products.filter(
                (currentProduct) => currentProduct.id !== product.id,
              ),
            }
          : current,
      );
      if (editingProductId === product.id) resetForm();
      setPendingDeleteProductId(null);
      setNotice(`محصول «${product.name}» با موفقیت از پایگاه داده حذف شد.`);
    } catch (reason: unknown) {
      if (reason instanceof AdminApiError && reason.status === 401) {
        onUnauthorized(reason.message);
      } else {
        setError(
          reason instanceof Error ? reason.message : "حذف محصول انجام نشد.",
        );
      }
    } finally {
      setDeletingProductId(null);
    }
  }

  if (isLoading && !workspace) {
    return (
      <div className="text-muted-foreground flex min-h-72 items-center justify-center gap-3 text-sm">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
        در حال آماده‌سازی فرم محصول
      </div>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-start">
      <section
        ref={formSectionRef}
        className="bg-surface border-border/70 scroll-mt-24 rounded-xl border p-5 sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-accent text-sm font-medium">کاتالوگ AVELIA</p>
            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              {editingProductId ? "ویرایش محصول" : "افزودن محصول جدید"}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-7">
              {editingProductId
                ? "پس از ذخیره، اطلاعات جدید در کارت محصول، صفحه جزئیات و بخش تخفیف‌ها اعمال می‌شود."
                : "اطلاعاتی که اینجا ثبت می‌کنید مستقیماً در صفحه محصول، کارت‌های فروشگاه و بخش تخفیف‌ها نمایش داده می‌شود."}
            </p>
          </div>
          {editingProductId ? (
            <Pencil className="text-accent size-7" aria-hidden="true" />
          ) : (
            <PackagePlus className="text-accent size-7" aria-hidden="true" />
          )}
        </div>

        {editingProductId ? (
          <div className="border-accent/25 bg-accent-soft mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border px-4 py-3">
            <p className="text-accent-foreground text-sm">
              در حال ویرایش: <strong>{editingProductName}</strong>
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm();
                setError(null);
                setNotice(null);
              }}
            >
              انصراف از ویرایش
              <X aria-hidden="true" />
            </Button>
          </div>
        ) : null}

        {error ? (
          <p
            className="border-danger/20 bg-danger/5 text-danger mt-6 rounded-lg border px-4 py-3 text-sm leading-7"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {notice ? (
          <p
            className="mt-6 rounded-lg border border-emerald-700/20 bg-emerald-700/8 px-4 py-3 text-sm leading-7 text-emerald-800"
            role="status"
          >
            {notice}
          </p>
        ) : null}

        <form className="mt-8 space-y-10" onSubmit={submitProduct}>
          <fieldset className="space-y-5">
            <legend className="mb-5 text-lg font-semibold">اطلاعات اصلی</legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldLabel title="نام محصول">
                <Input
                  required
                  maxLength={160}
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                />
              </FieldLabel>
              <FieldLabel
                title="اسلاگ انگلیسی"
                hint="نمونه: velvet-matte-lipstick"
              >
                <Input
                  required
                  dir="ltr"
                  maxLength={120}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  value={form.slug}
                  onChange={(event) => updateForm("slug", event.target.value)}
                />
              </FieldLabel>
              <FieldLabel title="برند">
                <Input
                  required
                  maxLength={120}
                  value={form.brand}
                  onChange={(event) => updateForm("brand", event.target.value)}
                />
              </FieldLabel>
              <FieldLabel title="دسته‌بندی">
                <select
                  required
                  className={selectClassName}
                  value={form.categoryId}
                  onChange={(event) =>
                    updateForm("categoryId", event.target.value)
                  }
                >
                  {(workspace?.categories ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FieldLabel>
            </div>
          </fieldset>

          <fieldset className="border-border/70 space-y-5 border-t pt-8">
            <legend className="mb-5 text-lg font-semibold">
              توضیحات صفحه محصول
            </legend>
            <FieldLabel
              title="توضیح کوتاه"
              hint="متن کوتاهی که روی کارت محصول و ابتدای صفحه دیده می‌شود."
            >
              <textarea
                required
                rows={3}
                minLength={10}
                maxLength={300}
                className={textareaClassName}
                value={form.shortDescription}
                onChange={(event) =>
                  updateForm("shortDescription", event.target.value)
                }
              />
            </FieldLabel>
            <FieldLabel title="توضیحات کامل">
              <textarea
                required
                rows={7}
                minLength={30}
                maxLength={5_000}
                className={textareaClassName}
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
              />
            </FieldLabel>
            <FieldLabel
              title="ویژگی‌های کلیدی"
              hint="هر ویژگی را در یک خط جدا بنویسید."
            >
              <textarea
                required
                rows={5}
                className={textareaClassName}
                value={form.keyFeatures}
                onChange={(event) =>
                  updateForm("keyFeatures", event.target.value)
                }
              />
            </FieldLabel>
            <FieldLabel title="روش استفاده">
              <textarea
                required
                rows={5}
                minLength={10}
                maxLength={2_000}
                className={textareaClassName}
                value={form.usage}
                onChange={(event) => updateForm("usage", event.target.value)}
              />
            </FieldLabel>
          </fieldset>

          <fieldset className="border-border/70 space-y-5 border-t pt-8">
            <legend className="mb-5 text-lg font-semibold">
              قیمت، تخفیف و موجودی
            </legend>
            <div className="grid gap-5 sm:grid-cols-2">
              <FieldLabel title="قیمت فروش (ریال)">
                <Input
                  required
                  inputMode="numeric"
                  dir="ltr"
                  placeholder="18900000"
                  value={form.priceRial}
                  onChange={(event) =>
                    updateForm("priceRial", event.target.value)
                  }
                />
              </FieldLabel>
              <FieldLabel
                title="قیمت قبل از تخفیف (ریال)"
                hint="اختیاری؛ برای نمایش تخفیف باید از قیمت فروش بیشتر باشد."
              >
                <Input
                  inputMode="numeric"
                  dir="ltr"
                  value={form.compareAtPriceRial}
                  onChange={(event) =>
                    updateForm("compareAtPriceRial", event.target.value)
                  }
                />
              </FieldLabel>
              <FieldLabel title="موجودی">
                <Input
                  required
                  inputMode="numeric"
                  dir="ltr"
                  value={form.stock}
                  onChange={(event) => updateForm("stock", event.target.value)}
                />
              </FieldLabel>
              <FieldLabel
                title="اولویت نمایش"
                hint="عدد کمتر، محصول را زودتر در فهرست نمایش می‌دهد."
              >
                <Input
                  required
                  inputMode="numeric"
                  dir="ltr"
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateForm("sortOrder", event.target.value)
                  }
                />
              </FieldLabel>
            </div>
          </fieldset>

          <fieldset className="border-border/70 space-y-5 border-t pt-8">
            <legend className="mb-5 flex items-center gap-2 text-lg font-semibold">
              <ImagePlus className="text-accent size-5" aria-hidden="true" />
              تصاویر محصول
            </legend>
            <FieldLabel
              title="آدرس تصاویر"
              hint="هر آدرس را در یک خط بنویسید؛ مانند /images/products/product.webp. تصویر خط اول، تصویر اصلی محصول است."
            >
              <textarea
                required
                rows={5}
                dir="ltr"
                className={textareaClassName}
                value={form.images}
                onChange={(event) => updateForm("images", event.target.value)}
              />
            </FieldLabel>
          </fieldset>

          <fieldset className="border-border/70 border-t pt-8">
            <legend className="mb-5 text-lg font-semibold">وضعیت نمایش</legend>
            <div className="grid gap-4 md:grid-cols-3">
              <ProductFlag
                checked={form.isOriginal}
                label="ضمانت اصالت"
                description="نشان اصالت روی محصول نمایش داده شود."
                onChange={(value) => updateForm("isOriginal", value)}
              />
              <ProductFlag
                checked={form.isFeatured}
                label="محصول منتخب"
                description="در انتخاب‌های ویژه صفحه اصلی قرار بگیرد."
                onChange={(value) => updateForm("isFeatured", value)}
              />
              <ProductFlag
                checked={form.isPublished}
                label="انتشار در فروشگاه"
                description="محصول بلافاصله برای مشتریان قابل مشاهده باشد."
                onChange={(value) => updateForm("isPublished", value)}
              />
            </div>
          </fieldset>

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={isSubmitting || !workspace?.categories.length}
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : editingProductId ? (
              <Save aria-hidden="true" />
            ) : (
              <PackagePlus aria-hidden="true" />
            )}
            {editingProductId ? "ذخیره تغییرات" : "افزودن محصول"}
          </Button>
        </form>
      </section>

      <aside className="bg-surface border-border/70 rounded-xl border p-5 sm:p-6 xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-accent text-sm font-medium">پایگاه داده</p>
            <h2 className="mt-1 text-xl font-semibold">محصولات اخیر</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="تازه‌سازی محصولات"
            disabled={isLoading}
            onClick={() => void loadWorkspace()}
          >
            <RefreshCw
              className={isLoading ? "animate-spin" : undefined}
              aria-hidden="true"
            />
          </Button>
        </div>
        <p className="text-muted-foreground mt-3 text-sm">
          {formatPersianInteger(workspace?.products.length ?? 0)} محصول آخر
        </p>

        <div className="mt-6 max-h-[70vh] space-y-3 overflow-y-auto pl-1">
          {workspace?.products.length === 0 ? (
            <p className="bg-surface-strong text-muted-foreground rounded-lg px-4 py-8 text-center text-sm leading-7">
              هنوز محصولی در پایگاه داده ثبت نشده است.
            </p>
          ) : null}
          {(workspace?.products ?? []).map((product) => (
            <article
              key={product.id}
              className="border-border/70 rounded-lg border p-4"
            >
              <div className="flex items-start gap-3">
                {/* Admin thumbnails support both committed local paths and HTTPS image URLs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt=""
                  className="bg-surface-strong size-14 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold">
                    {product.name}
                  </h3>
                  <p className="text-muted-foreground mt-1 truncate text-xs">
                    {product.brand} · {product.category.name}
                  </p>
                </div>
              </div>
              <div className="text-muted-foreground mt-4 flex items-center justify-between gap-3 text-xs">
                <span>{product.price.rial}</span>
                <span>موجودی {formatPersianInteger(product.stock)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span
                  className={
                    product.isPublished
                      ? "text-xs text-emerald-800"
                      : "text-muted-foreground text-xs"
                  }
                >
                  {product.isPublished ? "منتشرشده" : "پیش‌نویس"}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 min-h-9 px-3 text-xs"
                    disabled={isEditorLoading || isSubmitting}
                    onClick={() => void editProduct(product)}
                  >
                    ویرایش
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/8 hover:text-danger h-9 min-h-9 px-3 text-xs"
                    disabled={
                      isEditorLoading ||
                      isSubmitting ||
                      deletingProductId !== null
                    }
                    onClick={() => setPendingDeleteProductId(product.id)}
                  >
                    حذف
                    <Trash2 aria-hidden="true" />
                  </Button>
                  {product.isPublished && product.slug ? (
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      className="hover:text-accent inline-flex min-h-9 items-center gap-1 px-2 text-xs transition-colors"
                    >
                      مشاهده
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
              </div>
              {pendingDeleteProductId === product.id ? (
                <div className="border-danger/20 bg-danger/5 mt-3 rounded-lg border p-3">
                  <p className="text-danger text-xs leading-6">
                    این محصول از فروشگاه و پایگاه داده حذف شود؟ این کار قابل
                    بازگشت نیست.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-danger hover:bg-danger/90 h-9 min-h-9 text-xs text-white"
                      disabled={deletingProductId === product.id}
                      onClick={() => void deleteProduct(product)}
                    >
                      {deletingProductId === product.id ? (
                        <LoaderCircle
                          className="animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Trash2 aria-hidden="true" />
                      )}
                      حذف قطعی
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 min-h-9 text-xs"
                      disabled={deletingProductId === product.id}
                      onClick={() => setPendingDeleteProductId(null)}
                    >
                      انصراف
                    </Button>
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}
