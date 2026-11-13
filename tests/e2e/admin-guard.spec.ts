import { expect, test } from "@playwright/test";

test.describe("admin auth guard", () => {
  for (const path of ["/admin", "/admin/harga", "/admin/produk", "/admin/toko"]) {
    test(`${path} sends a visitor without a session to the login page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(page.getByRole("heading", { name: "Masuk ke admin" })).toBeVisible();
    });
  }

  test("the login form rejects a malformed email without sending anything", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("bukan-email");
    await page.getByRole("button", { name: "Kirim tautan masuk" }).click();
    await expect(page.getByRole("status")).toHaveText("Masukkan alamat email yang benar.");
  });

  test("the login page is not indexable", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});
