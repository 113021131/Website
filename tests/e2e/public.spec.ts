import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const LONG_NAME = "Set Cincin Kawin Sepasang Ukir Nama dengan Kotak Beludru untuk Akad Nikah dan Resepsi Keluarga Besar";

const pages = [
  { path: "/", heading: "Harga emas hari ini" },
  { path: "/harga-emas", heading: "Harga emas hari ini" },
  { path: "/katalog", heading: "Katalog perhiasan" },
  { path: "/katalog/demo-set-cincin-kawin", heading: LONG_NAME },
  { path: "/katalog/demo-kalung-rantai-padat-24k", heading: "Kalung Rantai Padat" },
  { path: "/toko", heading: "Toko kami" },
  { path: "/layanan", heading: "Layanan" },
  { path: "/kepercayaan", heading: "Membeli emas dengan tenang" },
  { path: "/privasi", heading: "Kebijakan privasi" },
  { path: "/syarat", heading: "Syarat dan ketentuan" },
];

async function horizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

for (const entry of pages) {
  test.describe(`page ${entry.path}`, () => {
    test("renders, fits the screen, passes axe, logs no errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));

      await page.goto(entry.path);
      await expect(page.getByRole("heading", { level: 1, name: entry.heading })).toBeVisible();
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);

      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
      expect(errors).toEqual([]);
    });
  });
}

test.describe("home", () => {
  test("shows the live price board and its update time above the fold", async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("main");
    await expect(main.getByRole("rowheader", { name: "24K" })).toBeInViewport({ ratio: 1 });
    await expect(main.getByRole("rowheader", { name: "16K" })).toBeInViewport({ ratio: 1 });
    await expect(main.getByText(/Diperbarui: \d{2} \w{3} \d{4} \d{2}:\d{2} WI[BT]A?/).first()).toBeInViewport({ ratio: 1 });
  });

  test("has JewelryStore structured data without invented facts", async ({ page }) => {
    await page.goto("/");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const store = blocks.map((block) => JSON.parse(block)).find((data) => data["@type"] === "JewelryStore");
    expect(store.name).toBe("Toko Sinar Mas");
    expect(JSON.stringify(store)).not.toContain("TODO_OWNER");
  });

  test("category tiles lead to the filtered catalogue", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("main").getByRole("link", { name: "Cincin", exact: true }).click();
    await expect(page).toHaveURL(/\/katalog\?jenis=cincin$/);
    await expect(page.getByRole("status")).toHaveText("2 perhiasan");
  });
});

test.describe("price page", () => {
  test("has FAQ structured data and is closed to indexing while in demo", async ({ page }) => {
    await page.goto("/harga-emas");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.some((block) => JSON.parse(block)["@type"] === "FAQPage")).toBe(true);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});

test.describe("catalogue filters", () => {
  test("filtering by karat narrows the list and is kept in the URL", async ({ page }) => {
    await page.goto("/katalog");
    await expect(page.getByRole("status")).toHaveText("12 perhiasan");

    await page.locator("summary").click();
    await page.getByLabel("Kadar").selectOption("22K");
    await page.getByRole("button", { name: "Terapkan" }).click();

    await expect(page).toHaveURL(/kadar=22K/);
    await expect(page.getByRole("status")).toHaveText("3 perhiasan");
    const details = await page.getByRole("article").locator("p.price").allTextContents();
    expect(details.length).toBe(3);
    for (const detail of details) expect(detail).toContain("22K");
  });

  test("sorting by highest price puts the Rp 100 juta+ item first", async ({ page }) => {
    await page.goto("/katalog?urut=harga-turun");
    const first = page.getByRole("article").first();
    await expect(first).toContainText("Kalung Rantai Padat");
    await expect(first).toContainText("Rp 126.000.000");
  });

  test("a search with no matches shows a way forward, not a blank page", async ({ page }) => {
    await page.goto("/katalog?q=zzzz-tidak-ada");
    await expect(page.getByRole("heading", { name: "Tidak ada perhiasan yang cocok" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Hapus saringan" }).first()).toBeVisible();
  });

  test("an empty category shows the empty state", async ({ page }) => {
    await page.goto("/katalog?jenis=rantai");
    await expect(page.getByRole("status")).toHaveText("0 perhiasan");
  });

  test("sold and out-of-stock items stay visible but marked", async ({ page }) => {
    await page.goto("/katalog?jenis=anting");
    await expect(page.getByRole("article").filter({ hasText: "Anting Bulat" })).toContainText("Terjual");
    await page.goto("/katalog?jenis=liontin");
    await expect(page.getByRole("article").filter({ hasText: "Liontin Huruf" })).toContainText("Stok habis");
    await expect(page.getByRole("article").filter({ hasText: "Liontin Koin" })).toContainText("Harga sesuai permintaan");
  });
});

test.describe("product page", () => {
  test("shows the price breakdown that adds up", async ({ page }) => {
    // 3,5 g × Rp 1.800.000 = 6.300.000; ongkos 3,5 × 150.000 = 525.000; total 6.825.000
    await page.goto("/katalog/demo-cincin-polos-22k");
    const estimate = page.getByRole("region", { name: "Perkiraan harga hari ini" });
    await expect(estimate).toContainText("Rp 6.300.000");
    await expect(estimate).toContainText("Rp 525.000");
    await expect(estimate).toContainText("Rp 6.825.000");
  });

  test("handles a tiny weight and a missing photo", async ({ page }) => {
    await page.goto("/katalog/demo-anting-tusuk-mini-16k");
    await expect(page.getByRole("main")).toContainText("0,1 g");
    await page.goto("/katalog/demo-cincin-mata-satu-18k");
    await expect(page.getByRole("main").getByText("Foto belum tersedia").first()).toBeVisible();
  });

  test("has Product and BreadcrumbList structured data", async ({ page }) => {
    await page.goto("/katalog/demo-cincin-polos-22k");
    const types = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(
      (block) => JSON.parse(block)["@type"],
    );
    expect(types).toContain("Product");
    expect(types).toContain("BreadcrumbList");
  });

  test("an unknown product shows the not-found page", async ({ page }) => {
    await page.goto("/katalog/tidak-ada-produk-ini");
    await expect(page.getByRole("heading", { name: "Perhiasan tidak ditemukan" })).toBeVisible();
  });
});

test.describe("SEO files", () => {
  test("robots.txt keeps crawlers out during the demo period", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toMatch(/Disallow: \/\s*$/m);
  });

  test("sitemap lists the main pages and products", async ({ request }) => {
    const body = await (await request.get("/sitemap.xml")).text();
    expect(body).toContain("/harga-emas");
    expect(body).toContain("/katalog/demo-cincin-polos-22k");
    expect(body).not.toContain("/admin");
  });
});

test.describe("admin auth guard", () => {
  for (const path of ["/admin", "/admin/harga", "/admin/produk", "/admin/produk/1", "/admin/toko"]) {
    test(`${path} sends a visitor without a session to the login page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(page.getByRole("heading", { name: "Masuk ke admin" })).toBeVisible();
    });
  }

  test("wrong credentials are refused with one neutral message", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByRole("textbox", { name: "Email" }).first().fill("bukan-admin@example.com");
    await page.getByLabel("Kata sandi").fill("salah-sekali");
    await page.getByRole("button", { name: "Masuk", exact: true }).click();
    await expect(page.getByText("Email atau kata sandi salah.")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
  });
});
