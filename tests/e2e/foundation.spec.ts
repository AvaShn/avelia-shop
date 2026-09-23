import { expect, test } from "@playwright/test";

test("serves a Persian right-to-left document", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const logo = page
    .getByRole("link", { name: "AVELIA — صفحه اصلی" })
    .first()
    .locator("img");
  await expect(logo).toHaveAttribute(
    "src",
    /avelia-final-mark-black-a-v12\.png/,
  );
  await expect
    .poll(() => logo.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    /avelia-final-mark-black-a-v12\.png/,
  );
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
  await expect(page.locator("#offers")).toBeVisible();
  await expect(page.locator("#brand-story")).toBeVisible();
  await expect(page.locator("#trust")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "لوازم آرایشی" }),
  ).toBeVisible();
  await expect(
    page.getByText("کرم‌پودر Super Stay Lumi-Matte شماره ۱۱۹").first(),
  ).toBeVisible();
  await expect(page.getByText("تضمین اصالت").first()).toBeVisible();
});

test("keeps primary link buttons readable", async ({ page }) => {
  await page.goto("/");

  const primaryLink = page.getByRole("link", { name: "کشف مجموعه" });
  const colors = await primaryLink.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return {
      background: styles.backgroundColor,
      text: styles.color,
    };
  });

  expect(colors.background).toBe("rgb(18, 18, 16)");
  expect(colors.text).toBe("rgb(255, 253, 249)");
});

test("adds a product to the persistent cart", async ({ page }) => {
  await page.goto("/");
  const addButton = page
    .locator("button:enabled")
    .filter({ hasText: "افزودن به انتخاب‌ها" })
    .first();
  await expect(addButton).toBeEnabled();
  await addButton.click();

  await expect(page.getByText("به سبد انتخاب‌ها اضافه شد")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /سبد خرید، ۱ محصول/ }),
  ).toBeVisible();
});
