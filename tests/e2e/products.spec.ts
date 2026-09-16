import { expect, test } from "@playwright/test";

test("browses and filters the beauty catalog", async ({ page }) => {
  await page.goto("/products");

  await expect(
    page.getByRole("heading", { name: "انتخابی روشن‌تر در دنیای زیبایی" }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText("۲۸ محصول برای نمایش"),
  ).toBeVisible();
  await expect(
    page.getByText("کرم‌پودر Super Stay Lumi-Matte شماره ۱۱۹").first(),
  ).toBeVisible();
  await expect(page.getByText("رژ لب ساتن رز").first()).toBeVisible();
  await expect(page.getByText("ضدآفتاب دیلی وِیل").first()).toBeVisible();

  await page.getByRole("link", { name: "لوازم آرایشی" }).click();

  await expect(page).toHaveURL(/category=makeup/);
  await expect(
    page.getByRole("main").getByText("۱۴ محصول برای نمایش"),
  ).toBeVisible();
  await expect(page.getByText("ریمل حجم‌دهنده دیفینیشن").first()).toBeVisible();
  await expect(page.getByText("سرم شب بازسازی")).toHaveCount(0);
});

test("keeps product cards compact and aligned with long names", async ({
  page,
}) => {
  await page.goto("/products");

  const grid = page.getByTestId("product-grid");
  await expect(grid).toBeVisible();
  const viewportWidth = page.viewportSize()?.width ?? 0;
  const expectedColumns =
    viewportWidth >= 1024 ? 4 : viewportWidth >= 640 ? 2 : 1;
  await expect
    .poll(() =>
      grid.evaluate(
        (element) =>
          window.getComputedStyle(element).gridTemplateColumns.split(" ")
            .length,
      ),
    )
    .toBe(expectedColumns);

  const cardHeights = await page
    .locator("main article")
    .evaluateAll((elements) =>
      elements
        .slice(0, 8)
        .map((element) => Math.round(element.getBoundingClientRect().height)),
    );

  expect(
    Math.max(...cardHeights) - Math.min(...cardHeights),
  ).toBeLessThanOrEqual(1);
});

test("serves typed product data through the database-backed API", async ({
  request,
}) => {
  const listResponse = await request.get("/api/products?discount=1");
  expect(listResponse.ok()).toBe(true);

  const listPayload = (await listResponse.json()) as {
    data: Array<{ slug: string }>;
    meta: { count: number; query: { discount: boolean } };
  };
  expect(listPayload.meta.count).toBe(10);
  expect(listPayload.meta.query.discount).toBe(true);

  const detailResponse = await request.get(
    `/api/products/${listPayload.data[0]?.slug ?? "missing"}`,
  );
  expect(detailResponse.ok()).toBe(true);
  expect(detailResponse.headers()["cache-control"]).toMatch(/s-maxage=60/);
  const detailPayload = (await detailResponse.json()) as {
    data: { product: { slug: string }; relatedProducts: unknown[] };
    error: null;
  };
  expect(detailPayload.data.product.slug).toBe(listPayload.data[0]?.slug);
  expect(detailPayload.data.relatedProducts.length).toBeGreaterThan(0);
  expect(detailPayload.error).toBeNull();

  const missingResponse = await request.get("/api/products/not-a-real-product");
  expect(missingResponse.status()).toBe(404);
});

test("shows the dedicated discounted-products collection", async ({ page }) => {
  await page.goto("/products?discount=1", { waitUntil: "domcontentloaded" });

  await expect(page.getByText("۱۰ محصول برای نمایش")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "تخفیف‌های منتخب" }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("۱۸٬۹۰۰٬۰۰۰ ریال").first()).toBeVisible();
  await expect(page.getByText("۱۶٬۹۰۰٬۰۰۰ ریال").first()).toBeVisible();
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
