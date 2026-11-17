import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const LONG_NAME =
  "Set Cincin Kawin Sepasang Ukir Nama dengan Kotak Beludru untuk Akad Nikah dan Resepsi Keluarga Besar";

/** "Rp 6.823.000" → 6823000 */
function digits(text: string) {
  return Number(text.replace(/\D/g, ""));
}

const pages: { path: string; heading: string | RegExp }[] = [
  { path: "/", heading: /Perhiasan emas untuk setiap momen berharga/ },
  { path: "/harga-emas", heading: "Harga emas hari ini" },
  { path: "/katalog", heading: "Katalog perhiasan" },
  { path: "/katalog/demo-set-cincin-kawin", heading: LONG_NAME },
  {
    path: "/katalog/demo-kalung-rantai-padat-24k",
    heading: "Kalung Rantai Padat",
  },
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
  test("shows today's 24K price above the fold, and the full board with its update time", async ({ page }) => {
    await page.goto("/");
    // The strip at the very top carries the price a gold shop's customer looks for first.
    await expect(page.getByRole("banner").getByText(/Rp\s[\d.]+\/gram/)).toBeInViewport({ ratio: 1 });
    const main = page.getByRole("main");
    await expect(main.getByRole("rowheader", { name: "24K" })).toBeVisible();
    await expect(main.getByRole("rowheader", { name: "18K" })).toBeVisible();
    await expect(main.getByText(/Diperbarui: \d{2} \w{3} \d{4} \d{2}:\d{2} WI[BT]A?/).first()).toBeVisible();
    await expect(main.getByText("Harga acuan emas 24K", { exact: true })).toBeVisible();
  });

  test("has JewelryStore structured data without invented facts", async ({ page }) => {
    await page.goto("/");
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const store = blocks.map((block) => JSON.parse(block)).find((data) => data["@type"] === "JewelryStore");
    expect(store.name).toBe("Toko Emas Sinar Mas");
    expect(JSON.stringify(store)).not.toContain("TODO_OWNER");
  });

  test("category tiles lead to the filtered catalogue", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("main").getByRole("link", { name: "Cincin", exact: true }).click();
    await expect(page).toHaveURL(/\/katalog\?jenis=cincin$/);
    // The concept collection has three rings.
    await expect(page.getByRole("status")).toHaveText("3 perhiasan");
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

    // On a phone the filters fold away behind "Saring"; on a wide screen they are always open.
    const summary = page.locator("summary");
    if (await summary.isVisible()) await summary.click();
    await page.getByLabel("Kadar").selectOption("22K");
    await page.getByRole("button", { name: "Terapkan" }).click();

    await expect(page).toHaveURL(/kadar=22K/);
    await expect(page.getByRole("status")).toHaveText("3 perhiasan");
    const details = await page.getByRole("article").locator("p.price").allTextContents();
    expect(details.length).toBe(3);
    for (const detail of details) expect(detail).toContain("22K");
  });

  test("sorting by highest price puts the heaviest set first and keeps prices in order", async ({ page }) => {
    await page.goto("/katalog?urut=harga-turun");
    const cards = page.getByRole("article");
    await expect(cards.first()).toContainText("Set Mas Kawin Anindya");
    const prices = (await cards.locator("span.font-display").allInnerTexts()).map(digits);
    expect(prices.length).toBe(12);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test("the price range and type filters narrow the list and are kept in the URL", async ({ page }) => {
    await page.goto("/katalog");
    // Wait for the results to stream in before asking whether the filters are folded.
    await expect(page.getByRole("status")).toHaveText("12 perhiasan");
    const summary = page.locator("summary");
    if (await summary.isVisible()) await summary.click();
    await page.getByLabel("Harga sampai (Rp)").fill("7.000.000");
    await page.getByLabel("Tipe").selectOption("bermata");
    await page.getByRole("button", { name: "Terapkan" }).click();

    await expect(page).toHaveURL(/tipe=bermata/);
    await expect(page).toHaveURL(/hmaks=7.000.000/);
    const prices = (await page.getByRole("article").locator("span.font-display").allInnerTexts()).map(digits);
    expect(prices.length).toBeGreaterThan(0);
    for (const price of prices) expect(price).toBeLessThanOrEqual(7_000_000);
    await expect(page.getByRole("article").filter({ hasText: "Cincin Arunika Polos" })).toHaveCount(0);
  });

  test("every concept design is labelled in the list", async ({ page }) => {
    await page.goto("/katalog");
    await expect(
      page.getByText("Katalog ini berisi desain konsep dengan harga ilustrasi. Bukan stok toko."),
    ).toBeVisible();
    const cards = page.getByRole("article");
    await expect(cards).toHaveCount(12);
    await expect(cards.getByText("Konsep", { exact: true })).toHaveCount(12);
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

  // The older placeholder products are no longer listed beside the concept collection,
  // but their pages still exist and are the fixtures for these states.
  test("sold, out-of-stock and price-on-request items stay reachable and are marked", async ({ page }) => {
    await page.goto("/katalog/demo-anting-bulat-17k");
    await expect(page.getByRole("main").getByText("Terjual", { exact: true })).toBeVisible();
    await page.goto("/katalog/demo-liontin-huruf-18k");
    await expect(page.getByRole("main").getByText("Stok habis", { exact: true })).toBeVisible();
    await page.goto("/katalog/demo-liontin-koin-24k");
    await expect(page.getByRole("region", { name: "Perkiraan harga hari ini" })).toContainText(
      "Harga perhiasan ini kami sampaikan langsung",
    );
  });
});

test.describe("product page", () => {
  test("shows the price breakdown that adds up", async ({ page }) => {
    // Kirana Solitaire: 3,2 g of 18K, ongkos Rp 650.000, batu Rp 150.000, plus the shop margin.
    // The gold price follows the 24K reference, so the test adds the parts up instead of fixing them.
    await page.goto("/katalog/cincin-kirana-solitaire");
    const estimate = page.getByRole("region", {
      name: "Perkiraan harga hari ini",
    });
    await expect(estimate).toContainText("Rp 650.000");
    await expect(estimate).toContainText("Rp 150.000");
    await expect(estimate).toContainText("Margin toko");

    const [weight, perGram] = (await estimate.locator("dt span").first().innerText()).split("×");
    const parts = (await estimate.locator("dd").allInnerTexts()).map(digits);
    expect(parts[0]).toBe(Math.round((digits(weight) / 10) * digits(perGram)));
    const total = digits(await estimate.locator("p span.price").innerText());
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(total);
    expect(total % 1000).toBe(0);
  });

  test("a concept design says so, shows its buyback estimate, and cannot be reserved", async ({ page }) => {
    await page.goto("/katalog/cincin-kirana-solitaire");
    await expect(page.getByText("DESAIN KONSEP — HARGA ILUSTRASI — BUKAN STOK TOKO")).toBeVisible();
    await expect(page.getByText("SM-CN-001")).toBeVisible();

    const buyback = page.getByRole("region", {
      name: "Perkiraan nilai beli kembali",
    });
    await expect(buyback).toContainText("bukan penawaran resmi toko");
    const estimate = digits(
      await page.getByRole("region", { name: "Perkiraan harga hari ini" }).locator("p span.price").innerText(),
    );
    const offer = digits(await buyback.locator("p span.price").innerText());
    expect(offer).toBeGreaterThan(0);
    expect(offer).toBeLessThan(estimate);

    await expect(page.getByRole("button", { name: "Reservasi ambil di toko" })).toHaveCount(0);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.map((block) => JSON.parse(block)["@type"])).not.toContain("Product");
  });

  test("the English page carries the required concept notice word for word", async ({ page }) => {
    await page.goto("/en/katalog/cincin-kirana-solitaire");
    await expect(page.getByRole("heading", { level: 1, name: "Kirana Solitaire Ring" })).toBeVisible();
    await expect(page.getByText("DESIGN CONCEPT — ILLUSTRATIVE PRICE — NOT ACTUAL STORE INVENTORY")).toBeVisible();
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
  for (const path of ["/admin", "/admin/harga", "/admin/rumus", "/admin/produk", "/admin/produk/1", "/admin/toko"]) {
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

// Worst cases from the break-ui review: a phone's text size set very large, and a
// product photo that fails to load.
test.describe("large text setting (200%)", () => {
  const sidewaysScroll = (page: Page) =>
    page.evaluate(
      () =>
        new Promise<number>((resolve) =>
          requestAnimationFrame(() =>
            resolve(document.documentElement.scrollWidth - document.documentElement.clientWidth),
          ),
        ),
    );

  for (const path of [
    "/",
    "/harga-emas",
    "/katalog",
    "/katalog/demo-set-cincin-kawin",
    "/kalkulator",
    "/kepercayaan",
    "/en/kepercayaan",
    "/layanan",
    "/en/toko",
  ]) {
    test(`${path} does not scroll sideways`, async ({ page }) => {
      await page.goto(path);
      await page.addStyleTag({ content: "html{font-size:200%}" });
      expect(await sidewaysScroll(page)).toBeLessThanOrEqual(0);
    });
  }

  test("the price board shows one block per karat instead of a three-column table", async ({ page }) => {
    await page.goto("/harga-emas");
    const board = page.getByRole("table", { name: /Harga emas hari ini/ });
    await expect(board).toBeVisible();
    const karats = await board.locator("tbody tr").count();
    await page.addStyleTag({ content: "html{font-size:200%}" });
    await expect(board).toBeHidden();
    const list = page.getByRole("list", { name: /Harga emas hari ini/ });
    await expect(list).toBeVisible();
    await expect(list.getByRole("listitem")).toHaveCount(karats);
  });
});

test("a product photo that fails to load shows the drawing, not a broken image", async ({ page }) => {
  await page.route(
    (url) => url.pathname === "/_next/image" && (url.searchParams.get("url") ?? "").includes("demo-cincin-polos-22k-1"),
    (route) => route.fulfill({ status: 404, body: "" }),
  );
  await page.goto("/katalog/demo-cincin-polos-22k");
  const first = page.getByRole("list", { name: "Foto produk" }).getByRole("listitem").first();
  await expect(first.getByText("Foto belum tersedia")).toBeVisible();
  await expect(first.locator("img")).toHaveCount(0);
});
