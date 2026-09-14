import { expect, test } from "@playwright/test";

test("serves a Persian right-to-left document", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", {
      name: "انتخاب‌هایی برای کسانی که به جزئیات اهمیت می‌دهند.",
    }),
  ).toBeVisible();

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(viewport?.width ?? 0);
});

test("opens the search experience with accessible Persian content", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "جست‌وجو" }).click();

  await expect(
    page.getByRole("dialog", { name: "جست‌وجو در مجموعه" }),
  ).toBeVisible();
  await expect(page.getByLabel("عبارت جست‌وجو")).toBeFocused();
});

test("renders every required homepage section", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#collections")).toBeVisible();
  await expect(page.locator("#featured-products")).toBeVisible();
  await expect(page.locator("#brand-story")).toBeVisible();
  await expect(page.locator("#trust")).toBeVisible();
  await expect(page.getByText("تضمین اصالت").first()).toBeVisible();
});

test("shows a clear preview message for cart actions", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "افزودن به انتخاب‌ها" })
    .first()
    .click();

  await expect(
    page.getByText("انتخاب محصول در مرحله‌ی بعد فعال می‌شود"),
  ).toBeVisible();
});
