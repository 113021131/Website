import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const variants = [
  { v: 1, name: "Papan Harga", heading: "Harga emas hari ini" },
  { v: 2, name: "Etalase", heading: "Perhiasan emas untuk dipakai, dihadiahkan, dan disimpan." },
  { v: 3, name: "Nota", heading: "Hitung dulu, baru datang ke toko." },
];

test("the home page opens the prototype picker during Phase 0", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/prototypes\/hero/);
});

for (const variant of variants) {
  test.describe(`hero direction ${variant.v}: ${variant.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/prototypes/hero?v=${variant.v}`);
      await expect(page.getByRole("heading", { level: 1, name: variant.heading })).toBeVisible();
    });

    test("shows a live price and its update time above the fold", async ({ page }) => {
      const main = page.getByRole("main");
      await expect(main.getByText("24K").first()).toBeInViewport({ ratio: 1 });
      await expect(main.getByText(/Diperbarui:? \d{2} \w{3} \d{4} \d{2}:\d{2} WIB/).first()).toBeInViewport({ ratio: 1 });
    });

    test("has no horizontal scroll", async ({ page }) => {
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("passes axe WCAG 2.1 A and AA checks", async ({ page }) => {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .exclude(".proto-picker") // harness chrome, not part of the design
        .analyze();
      expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    });

    test("the WhatsApp action explains itself while the shop number is missing", async ({ page }) => {
      const whatsapp = page.getByRole("main").getByRole("button", { name: "Tanya via WhatsApp" });
      await whatsapp.click();
      await expect(page.getByText("Nomor WhatsApp toko belum diisi.")).toBeVisible();
    });
  });
}

test.describe("picker", () => {
  test("number keys and clicks switch direction and keep it in the URL", async ({ page }) => {
    await page.goto("/prototypes/hero");
    await expect(page.getByRole("heading", { level: 1, name: variants[0].heading })).toBeVisible();

    await page.keyboard.press("2");
    await expect(page).toHaveURL(/v=2/);
    await expect(page.getByRole("heading", { level: 1, name: variants[1].heading })).toBeVisible();

    await page.getByRole("navigation", { name: "Prototype variants" }).getByRole("button", { name: "Nota" }).click();
    await expect(page).toHaveURL(/v=3/);
    await expect(page.getByRole("heading", { level: 1, name: variants[2].heading })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: variants[2].heading })).toBeVisible();
  });
});

test.describe("Etalase price strip", () => {
  test("expands to the full price table", async ({ page }) => {
    await page.goto("/prototypes/hero?v=2");
    await page.getByRole("button", { name: "Semua harga" }).click();
    const table = page.getByRole("table", { name: /Harga emas hari ini/ });
    await expect(table).toBeVisible();
    await expect(table.getByRole("row")).toHaveCount(6);
  });
});

test.describe("Nota estimator", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prototypes/hero?v=3");
  });

  test("estimates from a weight typed with a decimal comma", async ({ page }) => {
    await page.getByLabel("Berat (gram)").fill("2,5");
    await expect(page.getByText(/^2,5\sg × Rp\s[\d.]+$/)).toBeVisible();
    await expect(page.getByText("Belum termasuk ongkos pembuatan.", { exact: false })).toBeVisible();
    await expect(page.getByRole("main").getByRole("button", { name: "Tanya via WhatsApp" })).toBeVisible();
  });

  test("the estimate follows the selected karat", async ({ page }) => {
    await page.getByLabel("Berat (gram)").fill("1");
    const amount = page.locator("[aria-live] .font-display");
    const at22K = await amount.textContent();
    await page.getByText("24K", { exact: true }).click();
    await expect(amount).not.toHaveText(at22K ?? "");
  });

  test("explains what to type when the weight is not a number", async ({ page }) => {
    await page.getByLabel("Berat (gram)").fill("dua");
    await expect(page.getByText("Masukkan berat dalam gram, misalnya 2,5.")).toBeVisible();
    await expect(page.getByLabel("Berat (gram)")).toHaveAttribute("aria-invalid", "true");
  });
});
