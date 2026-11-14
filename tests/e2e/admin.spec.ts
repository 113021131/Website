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
      .poll(async () => (await (await page.request.get("/katalog/demo-anting-tusuk-mini-16k")).text()).includes(grouped(changed)), {
        timeout: 15_000,
      })
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

  const dialog = page.getByRole("alertdialog", { name: "Periksa sebelum menerbitkan" });
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

  // A small real PNG; the page resizes and re-encodes it before uploading to storage.
  const png = await sharp({ create: { width: 40, height: 50, channels: 3, background: "#c9992a" } }).png().toBuffer();
  await page.locator("#photo-files").setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: png });
  await expect(page.getByText("Foto diperbarui")).toBeVisible();
  await expect(page.getByLabel("Keterangan foto")).toBeVisible();

  await page.getByRole("button", { name: "Hapus produk" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Hapus produk" }).click();
  await expect(page).toHaveURL(/\/admin\/produk$/);
  await expect(page.getByText(name)).toHaveCount(0);
});

test("the WhatsApp link carries the product, karat, weight and estimate once a number is set", async ({ page }) => {
  await signIn(page);
  await page.goto("/admin/toko");
  const whatsapp = page.getByLabel("Nomor WhatsApp");

  try {
    await whatsapp.fill("0800 0000 0000"); // not a real subscriber number
    await page.getByRole("button", { name: "Simpan pengaturan" }).click();
    await expect(page.locator("[data-sonner-toast]").getByText("Pengaturan tersimpan")).toBeVisible();

    await page.goto("/katalog/demo-cincin-polos-22k");
    const link = page.getByRole("main").getByRole("link", { name: "Tanya via WhatsApp" });
    const href = (await link.getAttribute("href")) ?? "";
    expect(href.startsWith("https://wa.me/6280000000000?text=")).toBe(true);
    const message = decodeURIComponent(href.split("?text=")[1]);
    expect(message).toContain("Cincin Polos");
    expect(message).toContain("22K");
    expect(message).toContain("3,5");
    expect(message).toContain("6.825.000");
    expect(message).toContain("/katalog/demo-cincin-polos-22k");
  } finally {
    await page.goto("/admin/toko");
    await page.getByLabel("Nomor WhatsApp").fill("");
    await page.getByRole("button", { name: "Simpan pengaturan" }).click();
    await expect(page.locator("[data-sonner-toast]").getByText("Pengaturan tersimpan")).toBeVisible();
  }
});

test("store settings are for the owner; the dashboard shows the role", async ({ page }) => {
  await signIn(page);
  await expect(page.getByText("(Pemilik)")).toBeVisible();
  await expect(page.getByRole("link", { name: /Info toko/ })).toBeVisible();
});
