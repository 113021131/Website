/**
 * Signed-in admin flows, on a 360 px phone viewport. They change shared data and
 * put it back, so they run one at a time. Skipped when no test admin is configured.
 */
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

test.describe.configure({ mode: "serial" });
test.skip(!email || !password, "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set");

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByRole("textbox", { name: "Email" }).first().fill(email!);
  await page.getByLabel("Kata sandi").fill(password!);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Admin Toko Emas Sinar Mas" })).toBeVisible();
}

function digits(text: string) {
  return Number(text.replace(/\D/g, ""));
}

function grouped(value: number) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

test("an admin changes a karat price and the public site shows it within seconds", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/harga");

  const sell16 = page.locator('input[name="sell-16K"]');
  await expect(sell16).toBeVisible();
  const original = digits(await sell16.inputValue());
  const changed = original + 1000;

  try {
    await sell16.fill(String(changed));
    await page.getByRole("button", { name: "Simpan & Terbitkan" }).click();
    await expect(page.getByText("Harga tersimpan")).toBeVisible();

    // Public pages, straight away, with no rebuild.
    const started = Date.now();
    await page.goto("/harga-emas");
    await expect(page.getByRole("row", { name: /16K/ })).toContainText(grouped(changed));
    await page.goto("/");
    await expect(page.getByRole("row", { name: /16K/ })).toContainText(grouped(changed));
    expect(Date.now() - started).toBeLessThan(10_000);

    // Product pages are refreshed in the background, so a customer opening one a
    // few seconds later gets an estimate from the new price.
    await expect
      .poll(
        async () =>
          (await (await page.request.get("/katalog/demo-anting-tusuk-mini-16k")).text()).includes(grouped(changed)),
        {
          timeout: 15_000,
        },
      )
      .toBe(true);

    // The change is in the audit history with who made it.
    await page.goto("/admin/harga");
    const firstHistoryRow = page.getByRole("region", { name: "Riwayat perubahan" }).getByRole("row").nth(1);
    await expect(firstHistoryRow).toContainText("16K");
    await expect(firstHistoryRow).toContainText(grouped(changed));
    await expect(firstHistoryRow).toContainText(email!);
  } finally {
    await page.goto("/admin/harga");
    await page.locator('input[name="sell-16K"]').fill(String(original));
    await page.getByRole("button", { name: "Simpan & Terbitkan" }).click();
    await expect(page.getByText("Harga tersimpan")).toBeVisible();
  }
  await page.goto("/harga-emas");
  await expect(page.getByRole("row", { name: /16K/ })).toContainText(grouped(original));
});

test("a jump of more than 5% or a buyback above sell asks for confirmation first", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/harga");

  const sell = page.locator('input[name="sell-17K"]');
  const original = digits(await sell.inputValue());
  await sell.fill(String(Math.round(original * 1.1)));
  await page.locator('input[name="buyback-17K"]').fill(String(Math.round(original * 1.2)));
  await page.getByRole("button", { name: "Simpan & Terbitkan" }).click();

  const dialog = page.getByRole("alertdialog", {
    name: "Periksa sebelum menerbitkan",
  });
  await expect(dialog).toContainText("17K: harga beli kembali tidak lebih rendah dari harga jual.");
  await expect(dialog).toContainText("17K: harga jual berubah 10,0% dari harga sebelumnya.");

  // Backing out saves nothing.
  await dialog.getByRole("button", { name: "Periksa lagi" }).click();
  await page.goto("/harga-emas");
  await expect(page.getByRole("row", { name: /17K/ })).toContainText(grouped(original));
});

test("an admin creates a draft product, adds a photo, and deletes it", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/produk/baru");

  const name = `Uji E2E ${Date.now()}`;
  await page.getByLabel("Nama produk").fill(name);
  await page.getByLabel("Kadar").selectOption({ label: "18K" });
  await page.getByLabel("Berat (gram)").fill("1,25");
  await page.getByRole("button", { name: "Simpan produk" }).click();

  await expect(page).toHaveURL(/\/admin\/produk\/\d+$/);
  await expect(page.getByLabel("Nama produk")).toHaveValue(name);

  // A draft is invisible to the public.
  const slug = await page.getByLabel("Alamat halaman (slug)").inputValue();
  expect(slug).toMatch(/^uji-e2e-\d+$/);

  try {
    // A small real PNG; the page resizes and re-encodes it before uploading to storage.
    // The upload goes over the internet to Supabase, so allow it more than the default 5 s.
    const png = await sharp({
      create: { width: 40, height: 50, channels: 3, background: "#c9992a" },
    })
      .png()
      .toBuffer();
    await page.locator("#photo-files").setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: png });
    await expect(page.locator("[data-sonner-toast]").getByText("Foto diperbarui")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel("Keterangan foto")).toBeVisible();
  } finally {
    // Always remove the draft, even if the photo step failed, so no test data is left behind.
    await page.goto(page.url());
    await page.getByRole("button", { name: "Hapus produk" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Hapus produk" }).click();
    await expect(page).toHaveURL(/\/admin\/produk$/);
  }
  await expect(page.getByText(name)).toHaveCount(0);
});

test("a product's stones, its own margin and a manual price reach its public page", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/produk/baru");

  const stamp = Date.now();
  const name = `Uji Detail ${stamp}`;
  await page.getByLabel("Nama produk").fill(name);
  await page.getByLabel("Kadar").selectOption({ label: "18K" });
  await page.getByLabel("Berat (gram)").fill("2");
  await page.locator("#product-status").selectOption("published");
  await page.getByText("Detail tambahan dan harga").click();
  await page.getByLabel("Kode produk (SKU)").fill(`UJI-${stamp}`);
  await page.getByLabel("Batu dan mutiara", { exact: true }).fill("1 zirkonia uji");
  await page.getByLabel("Biaya batu dan bahan lain (Rp)").fill("100000");
  await page.getByLabel("Margin toko untuk produk ini (%)").fill("10");
  await page.getByLabel("Nama dalam bahasa Inggris").fill("Detail Test Ring");
  await page.getByRole("button", { name: "Simpan produk" }).click();

  await expect(page).toHaveURL(/\/admin\/produk\/\d+$/);
  const adminUrl = page.url();
  const slug = await page.getByLabel("Alamat halaman (slug)").inputValue();

  try {
    await page.goto(`/katalog/${slug}`);
    const estimate = page.getByRole("region", { name: "Perkiraan harga hari ini" });
    await expect(estimate).toContainText("Batu dan bahan lain");
    await expect(estimate).toContainText("Rp 100.000");
    await expect(estimate).toContainText("Margin toko (10%)");
    await expect(page.getByText("1 zirkonia uji")).toBeVisible();
    await expect(page.getByText(`UJI-${stamp}`)).toBeVisible();
    const parts = (await estimate.locator("dd").allInnerTexts()).map(digits);
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(digits(await estimate.locator("p span.price").innerText()));

    await page.goto(`/en/katalog/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: "Detail Test Ring" })).toBeVisible();

    // A price set by hand replaces the calculation and says so.
    await page.goto(adminUrl);
    await page.getByLabel("Harga ditetapkan manual (Rp)").fill("5000000");
    await page.getByRole("button", { name: "Simpan produk" }).click();
    await expect(page.locator("[data-sonner-toast]").getByText("Produk tersimpan")).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(async () => (await (await page.request.get(`/katalog/${slug}`)).text()).includes("Harga ditetapkan toko"), {
        timeout: 20_000,
      })
      .toBe(true);
    await page.goto(`/katalog/${slug}`);
    await expect(page.getByRole("region", { name: "Perkiraan harga hari ini" })).toContainText("Rp 5.000.000");
  } finally {
    // Always remove the product so no test data is left in the catalogue.
    await page.goto(adminUrl);
    await page.getByRole("button", { name: "Hapus produk" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Hapus produk" }).click();
    await expect(page).toHaveURL(/\/admin\/produk$/);
  }
});

test("the WhatsApp link carries the product, karat, weight and estimate once a number is set", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/toko");
  const whatsapp = page.getByLabel("Nomor WhatsApp");
  // The shop's real number, put back afterwards.
  const original = await whatsapp.inputValue();

  try {
    await whatsapp.fill("0800 0000 0000"); // not a real subscriber number
    await page.getByRole("button", { name: "Simpan pengaturan" }).click();
    // Two database writes plus a cache refresh; allow for a slow round trip.
    await expect(page.locator("[data-sonner-toast]").getByText("Pengaturan tersimpan")).toBeVisible({
      timeout: 20_000,
    });

    await page.goto("/katalog/demo-cincin-polos-22k");
    const link = page.getByRole("main").getByRole("link", { name: "Tanya via WhatsApp" });
    const href = (await link.getAttribute("href")) ?? "";
    expect(href.startsWith("https://wa.me/6280000000000?text=")).toBe(true);
    const message = decodeURIComponent(href.split("?text=")[1]);
    expect(message).toContain("Cincin Polos");
    expect(message).toContain("22K");
    expect(message).toContain("3,5");
    // The estimate follows the 24K reference, so the message must carry whatever the page shows.
    const shown = await page
      .getByRole("region", { name: "Perkiraan harga hari ini" })
      .locator("p span.price")
      .innerText();
    expect(message).toContain(shown.replace(/[^\d.]/g, ""));
    expect(message).toContain("/katalog/demo-cincin-polos-22k");
  } finally {
    await page.goto("/admin/toko");
    await page.getByLabel("Nomor WhatsApp").fill(original);
    await page.getByRole("button", { name: "Simpan pengaturan" }).click();
    await expect(page.locator("[data-sonner-toast]").getByText("Pengaturan tersimpan")).toBeVisible({
      timeout: 20_000,
    });
  }
});

test("store settings are for the owner; the dashboard shows the role", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("(Pemilik)")).toBeVisible();
  await expect(page.getByRole("link", { name: /Info toko/ })).toBeVisible();
});

// ── The price formula screen (/admin/rumus) ─────────────────────────────────
// Kept in this file so it never runs at the same time as the price tests above:
// saving the formula recalculates every karat.

const BENCHMARK = "Harga patokan pasar (Rp/gram)";

async function saveBenchmark(page: Page, value: number) {
  await page.goto("/admin/rumus");
  await page.getByLabel(BENCHMARK).fill(String(value));
  await page.getByRole("button", { name: "Simpan & hitung ulang" }).click({ timeout: 10_000 });
  // Replacing the per-gram prices always asks first.
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("akan diganti dengan hasil hitung dari harga acuan");
  await dialog.getByRole("button", { name: "Ya, simpan & hitung ulang" }).click();
  await expect(page.getByText(/tersimpan/).first()).toBeVisible({
    timeout: 30_000,
  });
}

async function publicPrices(page: Page) {
  await page.goto("/harga-emas");
  const row = page.getByRole("row").filter({ has: page.getByRole("rowheader", { name: "18K", exact: true }) });
  const perGram = digits((await row.getByRole("cell").allInnerTexts())[0]);
  await page.goto("/katalog?q=Kirana");
  const estimate = digits(await page.getByRole("article").first().locator("span.font-display").innerText());
  return { perGram, estimate };
}

test("changing the 24K reference recalculates karat prices and catalogue estimates, and back", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/rumus");
  const original = digits(await page.getByLabel(BENCHMARK).inputValue());
  expect(original).toBeGreaterThan(0);
  const before = await publicPrices(page);

  const raised = Math.round((original * 1.1) / 1000) * 1000;
  try {
    // The screen previews the new numbers before anything is saved.
    await page.goto("/admin/rumus");
    await page.getByLabel(BENCHMARK).fill(String(raised));
    await expect(page.locator("output")).toContainText(raised.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."));

    await saveBenchmark(page, raised);
    const after = await publicPrices(page);
    // 18K is 75 % of the reference; a 10 % higher reference is a 10 % higher price per gram.
    expect(after.perGram / before.perGram).toBeCloseTo(1.1, 2);
    // The ring's estimate rises too, by less than 10 %: workmanship and stones do not follow gold.
    expect(after.estimate).toBeGreaterThan(before.estimate);
    expect(after.estimate / before.estimate).toBeLessThan(1.1);
  } finally {
    await saveBenchmark(page, original);
  }

  const restored = await publicPrices(page);
  expect(restored).toEqual(before);
});

test("the screen refuses a purity that is not a number", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/rumus");
  const field = page.getByLabel("Kemurnian (%) 18K");
  const original = await field.inputValue();
  await field.fill("abc");
  await page.getByRole("button", { name: "Simpan & hitung ulang" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Periksa kembali angka yang diisi." })).toBeVisible();
  await field.fill(original);
});
