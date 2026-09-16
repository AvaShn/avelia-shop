import { expect, test } from "@playwright/test";

test("persists cart items and updates quantities", async ({ page }) => {
  await page.goto("/products/satin-lipstick-muted-rose");

  const addButton = page.getByRole("button", { name: "افزودن به سبد" }).first();
  await expect(addButton).toBeEnabled();
  await addButton.click();
  await expect(page.getByText("به سبد انتخاب‌ها اضافه شد")).toBeVisible();

  await page.getByRole("link", { name: /سبد خرید، ۱ محصول/ }).click();
  await expect(
    page.getByRole("heading", { name: "مرور انتخاب‌های شما" }),
  ).toBeVisible();
  await expect(page.getByText("رژ لب ساتن رز").first()).toBeVisible();

  await page
    .getByRole("button", { name: "افزایش تعداد رژ لب ساتن رز" })
    .click();
  await expect(
    page.getByRole("link", { name: /سبد خرید، ۲ محصول/ }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("link", { name: /سبد خرید، ۲ محصول/ }),
  ).toBeVisible();
  await expect(page.getByText("۳۷٬۸۰۰٬۰۰۰ ریال").first()).toBeVisible();
});

test("shows the mobile-first checkout trust flow", async ({ page }) => {
  await page.goto("/products/satin-lipstick-muted-rose");
  const addButton = page.getByRole("button", { name: "افزودن به سبد" }).first();
  await expect(addButton).toBeEnabled();
  await addButton.click();

  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "چند قدم تا تکمیل انتخاب" }),
  ).toBeVisible();
  await expect(page.getByLabel("نام و نام خانوادگی")).toBeVisible();
  await expect(page.getByLabel("شماره موبایل")).toBeVisible();
  await expect(page.getByLabel(/ایمیل/)).toBeVisible();
  await expect(page.getByText("ادامه پرداخت چگونه است؟")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "ثبت سفارش و ادامه" }),
  ).toBeVisible();
});

test("validates cart API mutations with typed human errors", async ({
  request,
}) => {
  const invalidResponse = await request.post("/api/cart", {
    data: { productId: "not-a-real-product", quantity: 1 },
  });
  expect(invalidResponse.status()).toBe(404);

  const payload = (await invalidResponse.json()) as {
    error: { code: string; message: string };
  };
  expect(payload.error.code).toBe("PRODUCT_NOT_FOUND");
  expect(payload.error.message).toContain("محصول");
});
