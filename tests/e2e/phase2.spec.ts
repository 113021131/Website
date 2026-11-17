import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** "Rp 6.823.000" → 6823000 */
function digits(text: string) {
  return Number(text.replace(/\D/g, ""));
}

/** Today's price per gram of one karat, read from the public board. Prices follow the 24K reference. */
async function boardRow(page: Page, karat: string) {
  await page.goto("/harga-emas");
  const row = page.getByRole("row").filter({ has: page.getByRole("rowheader", { name: karat, exact: true }) });
  const cells = await row.getByRole("cell").allInnerTexts();
  return { sell: digits(cells[0]), buyback: digits(cells[1]) };
}

const pages: { path: string; heading: string | RegExp }[] = [
  { path: "/kalkulator", heading: "Kalkulator" },
  { path: "/artikel", heading: "Artikel" },
  { path: "/en", heading: /Gold jewellery for the moments that matter/ },
  { path: "/en/harga-emas", heading: "Today's gold price" },
  { path: "/en/katalog", heading: "Jewellery catalogue" },
  { path: "/en/katalog/demo-cincin-polos-22k", heading: "Cincin Polos" },
  { path: "/en/kalkulator", heading: "Calculator" },
  { path: "/en/kepercayaan", heading: "Buying gold with confidence" },
];

for (const entry of pages) {
  test(`page ${entry.path} renders, fits the screen, passes axe, logs no errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(entry.path);
    await expect(page.getByRole("heading", { level: 1, name: entry.heading })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test.describe("languages", () => {
  test("the language switch goes to the same page in English and back", async ({ page }) => {
    await page.goto("/katalog");
    await page.getByRole("link", { name: /English/ }).click();
    await expect(page).toHaveURL(/\/en\/katalog$/);
    await expect(page.getByRole("heading", { level: 1, name: "Jewellery catalogue" })).toBeVisible();
    // Links inside the English site stay in English.
    await expect(page.getByRole("contentinfo").getByRole("link", { name: "Gold Price" })).toHaveAttribute(
      "href",
      "/en/harga-emas",
    );

    await page.getByRole("link", { name: /Bahasa Indonesia/ }).click();
    await expect(page).toHaveURL(/\/katalog$/);
  });

  test("each page points search engines at its translation", async ({ page }) => {
    await page.goto("/harga-emas");
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", /\/en\/harga-emas$/);
    await page.goto("/en/harga-emas");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/en\/harga-emas$/);
    await expect(page.locator('link[rel="alternate"][hreflang="id"]')).toHaveAttribute("href", /\/harga-emas$/);
  });
});

test.describe("calculator", () => {
  test("estimates a jewellery price with the making fee and the shop's rounding", async ({ page }) => {
    const { sell } = await boardRow(page, "22K");
    await page.goto("/kalkulator");
    const card = page.getByRole("region", { name: "Harga perhiasan" });
    // 22K is preselected: 2,5 g × today's 22K price; ongkos 2,5 × 100.000 = 250.000; then the shop margin.
    await card.getByLabel("Berat (gram)").fill("2,5");
    await card.getByLabel("Nilai ongkos").fill("100000");
    await expect(card).toContainText("Rp 250.000");
    await expect(card).toContainText("Margin toko");
    const parts = (await card.locator("dd").allInnerTexts()).map(digits);
    expect(parts[0]).toBe(2.5 * sell);
    const total = digits(await card.locator("p.price-fit").innerText());
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(total);
    expect(total % 1000).toBe(0);
  });

  test("estimates a buyback value from the buyback price, without fee or rounding up", async ({ page }) => {
    const { buyback } = await boardRow(page, "22K");
    await page.goto("/kalkulator");
    const card = page.getByRole("region", { name: "Jual atau tukar tambah" });
    // 1,337 g × today's 22K buyback price, then rounded DOWN to Rp 1.000: money the customer receives.
    await card.getByLabel("Berat (gram)").fill("1,337");
    const gross = Math.round(1.337 * buyback);
    const total = digits(await card.locator("p.price-fit").innerText());
    expect(total).toBe(Math.floor(gross / 1000) * 1000);
    await expect(card).not.toContainText("Ongkos pembuatan");
    await expect(card).not.toContainText("Margin toko");
  });

  test("explains what to type when the weight is not a number", async ({ page }) => {
    await page.goto("/kalkulator");
    const card = page.getByRole("region", { name: "Harga perhiasan" });
    await card.getByLabel("Berat (gram)").fill("dua");
    await expect(card.getByText("Masukkan berat dalam gram, misalnya 2,5.")).toBeVisible();
  });
});

test.describe("price history", () => {
  test("the price page shows the history chart with a text summary", async ({ page }) => {
    await page.goto("/harga-emas");
    const chart = page.getByRole("region", { name: "Riwayat harga" });
    await expect(chart.getByRole("img")).toHaveAttribute("aria-label", /Harga jual 24K dari .* terendah Rp/);
    await chart.getByRole("button", { name: "90 hari" }).click();
    await expect(chart.getByRole("button", { name: "90 hari" })).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("3D preview", () => {
  test("a product with a model has a 3D tab that loads the viewer only when opened", async ({ page }) => {
    await page.goto("/katalog/demo-cincin-polos-22k");
    await expect(page.locator("model-viewer")).toHaveCount(0);
    await page.getByRole("tab", { name: "Pratinjau 3D" }).click();
    // React hands the model to the custom element as a property, not an attribute.
    // The viewer library is fetched on demand, so allow it time on a busy machine.
    await expect(page.locator("model-viewer")).toHaveCount(1, {
      timeout: 30_000,
    });
    await expect
      .poll(
        () => page.locator("model-viewer").evaluate((element) => (element as HTMLElement & { src: string | null }).src),
        {
          timeout: 30_000,
        },
      )
      .toMatch(/demo-cincin-polos-22k\.glb$/);
    await expect(page.getByText("Tampilan 3D adalah pratinjau. Foto asli tetap menjadi acuan.")).toBeVisible();
  });

  test("a product without a model has no tabs", async ({ page }) => {
    await page.goto("/katalog/demo-gelang-rantai-17k");
    await expect(page.getByRole("tab")).toHaveCount(0);
  });
});

test.describe("articles", () => {
  test("drafts are not public", async ({ page }) => {
    await page.goto("/artikel");
    await expect(page.getByText("Artikel pertama sedang kami tulis.")).toBeVisible();
    await page.goto("/artikel/cara-menghitung-harga-perhiasan-emas");
    await expect(page.getByRole("heading", { name: /tidak ditemukan/ })).toBeVisible();
  });
});

test.describe("reservation form", () => {
  test("refuses to send without consent and says why", async ({ page }) => {
    await page.goto("/katalog/demo-cincin-polos-22k");
    await page.getByRole("button", { name: "Reservasi ambil di toko" }).click();
    await page.getByLabel("Nama", { exact: true }).fill("Uji Tanpa Persetujuan");
    await page.getByLabel("Nomor WhatsApp atau telepon").fill("081200000000");
    await page.getByRole("button", { name: "Kirim reservasi" }).click();
    await expect(page.getByText("Centang persetujuan untuk melanjutkan.")).toBeVisible();
  });

  test("is not offered on a sold item", async ({ page }) => {
    await page.goto("/katalog/demo-anting-bulat-17k");
    await expect(page.getByRole("button", { name: "Reservasi ambil di toko" })).toHaveCount(0);
  });
});
