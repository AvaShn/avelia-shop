import { expect, test } from "@playwright/test";

test("browses and filters the beauty catalog", async ({ page }) => {
  await page.goto("/products");

  await expect(
    page.getByRole("heading", { name: "انتخابی روشن‌تر در دنیای زیبایی" }),
  ).toBeVisible();
  await expect(page.getByText("۲۸ محصول برای نمایش")).toBeVisible();
  await expect(
    page.getByText("کرم‌پودر Super Stay Lumi-Matte شماره ۱۱۹").first(),
  ).toBeVisible();
  await expect(page.getByText("رژ لب ساتن رز").first()).toBeVisible();
  await expect(page.getByText("ضدآفتاب دیلی وِیل").first()).toBeVisible();

  await page.getByRole("link", { name: "لوازم آرایشی" }).click();

  await expect(page).toHaveURL(/category=makeup/);
  await expect(page.getByText("۱۴ محصول برای نمایش")).toBeVisible();
  await expect(page.getByText("ریمل حجم‌دهنده دیفینیشن").first()).toBeVisible();
  await expect(page.getByText("سرم شب بازسازی")).toHaveCount(0);
});

test("shows the dedicated discounted-products collection", async ({ page }) => {
  await page.goto("/products?discount=1", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("۱۰ محصول برای نمایش")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "تخفیف‌های منتخب" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("٪۱۱ تخفیف").first()).toBeVisible();
  await expect(page.getByText("۱۸٬۹۰۰٬۰۰۰ ریال").first()).toBeVisible();
});

test("searches products from the shared header", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "جست‌وجو" }).click();
  await page.getByLabel("عبارت جست‌وجو").fill("سرم");
  await page.getByRole("button", { name: "مشاهده نتیجه‌ها" }).click();

  await expect(page).toHaveURL(/\/products\?q=/);
  await expect(page.getByText("۱ محصول برای نمایش")).toBeVisible();
  await expect(page.getByText("سرم شب بازسازی").first()).toBeVisible();
});

test("shows complete product details and an interactive gallery", async ({
  page,
}) => {
  await page.goto("/products/satin-lipstick-muted-rose");

  await expect(
    page.getByRole("heading", { name: "رژ لب ساتن رز" }),
  ).toBeVisible();
  await expect(page.getByText("۱۸٬۹۰۰٬۰۰۰ ریال").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "ویژگی‌های کلیدی" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "روش استفاده" }),
  ).toBeVisible();

  const secondGalleryImage = page.getByRole("button", {
    name: "نمای 2 از رژ لب ساتن رز",
  });
  await secondGalleryImage.click();
  await expect(secondGalleryImage).toHaveAttribute("aria-pressed", "true");

  const structuredData = page.locator('script[type="application/ld+json"]');
  await expect(structuredData).toHaveCount(1);
  expect(await structuredData.textContent()).toContain('"priceCurrency":"IRR"');
});

test("returns a human product not-found state", async ({ page }) => {
  await page.goto("/products/not-a-real-product");

  await expect(
    page.getByRole("heading", { name: "این محصول در مجموعه پیدا نشد" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "بازگشت به محصولات" }),
  ).toBeVisible();
});
