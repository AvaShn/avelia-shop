import { expect, test } from "@playwright/test";

test("persists cart items and updates quantities", async ({ page }) => {
  await page.goto("/products/satin-lipstick-muted-rose");

  const addButton = page
    .getByRole("button", { name: "افزودن به انتخاب‌ها" })
    .first();
  await expect(addButton).toBeEnabled();
  await addButton.click();
  await expect(page.getByText("به سبد انتخاب‌ها اضافه شد")).toBeVisible();

  const cartLink = page.getByRole("link", { name: /سبد خرید، ۱ محصول/ });
  await expect(cartLink).toHaveAttribute("href", "/cart");
  await page.goto("/cart");
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

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "مرور انتخاب‌های شما" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("link", { name: /سبد خرید، ۲ محصول/ }),
  ).toBeVisible();
  await expect(page.getByText("۳۷٬۸۰۰٬۰۰۰ ریال").first()).toBeVisible();
});

test("requires an account before the mobile-first checkout flow", async ({
  page,
}) => {
  await page.goto("/products/satin-lipstick-muted-rose");
  const addButton = page
    .getByRole("button", { name: "افزودن به انتخاب‌ها" })
    .first();
  await expect(addButton).toBeEnabled();
  await addButton.click();
  await expect(
    page.getByRole("link", { name: /سبد خرید، ۱ محصول/ }),
  ).toBeVisible();

  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "برای ثبت سفارش وارد حساب شوید" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "ورود به حساب" }),
  ).toHaveAttribute("href", "/login?returnTo=/checkout");
  await expect(page.getByRole("link", { name: "ساخت حساب" })).toHaveAttribute(
    "href",
    "/register?returnTo=/checkout",
  );
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
