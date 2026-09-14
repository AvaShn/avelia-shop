import { expect, test } from "@playwright/test";

test("serves a Persian right-to-left document", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "پایه‌ی فنی AVELIA آماده است." }),
  ).toBeVisible();
});
