import { expect, test } from "@playwright/test";

test("footer links every information page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: "ارتباط با ما" }),
  ).toHaveAttribute("href", "/contact");
  await expect(page.getByRole("link", { name: "حریم خصوصی" })).toHaveAttribute(
    "href",
    "/policies/privacy",
  );
  await expect(page.getByRole("link", { name: "شرایط سفارش" })).toHaveAttribute(
    "href",
    "/policies/terms",
  );
  await expect(
    page.getByRole("link", { name: "شبکه‌های اجتماعی" }),
  ).toHaveAttribute("href", "/social");
});

test("shows all official support channels", async ({ page }) => {
  await page.goto("/contact");

  await expect(
    page.getByRole("heading", { name: "ربات تلگرام سفارش‌های AVELIA" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "تلگرام مستقیم: @youknowava" }),
  ).toHaveAttribute("href", "https://t.me/youknowava");
  await expect(
    page.getByRole("link", { name: "واتساپ: ۰۹۱۲ ۸۵۸ ۶۰۱۰" }),
  ).toHaveAttribute("href", /https:\/\/wa\.me\/989128586010/);
  await expect(
    page.getByRole("link", { name: "بله: @uknowava" }),
  ).toHaveAttribute("href", "https://ble.ir/uknowava");
  await expect(
    page.getByRole("link", { name: "ایمیل: avashahabi@gmail.com" }),
  ).toHaveAttribute("href", "mailto:avashahabi@gmail.com");
});

test("publishes the official Instagram profile", async ({ page }) => {
  await page.goto("/social");

  await expect(page.getByText("@avelia.shopp")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "مشاهده در اینستاگرام" }),
  ).toHaveAttribute("href", "https://www.instagram.com/avelia.shopp/");
});

test("renders the complete privacy policy", async ({ page }) => {
  await page.goto("/policies/privacy");

  await expect(
    page.getByRole("heading", { level: 1, name: "حریم خصوصی" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "رسید پرداخت و تلگرام" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "انتخاب‌ها و ارتباط با ما" }),
  ).toBeVisible();
});

test("explains the order and manual payment terms", async ({ page }) => {
  await page.goto("/policies/terms");

  await expect(
    page.getByRole("heading", { level: 1, name: "شرایط سفارش" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "پرداخت و ارسال رسید" }),
  ).toBeVisible();
  await expect(
    page.getByText(/دریافت رسید به معنای تأیید پرداخت نیست/),
  ).toBeVisible();
});
