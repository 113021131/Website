/**
 * Phase 2 signed-in flows. Each creates its own data and removes it again.
 * Runs in the admin project (after the public tests), one test at a time.
 */
import { expect, test, type Page } from "@playwright/test";

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

const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").getByText(text);

test("a visitor reserves an item; the admin sees it, updates it, exports it and deletes it", async ({ page }) => {
  const name = `Uji Reservasi ${Date.now()}`;
  // A different number each run, so the per-number hourly limit never trips the test.
  const phone = `0899${String(Date.now()).slice(-8)}`;

  await page.goto("/katalog/demo-cincin-polos-22k");
  await page.getByRole("button", { name: "Reservasi ambil di toko" }).click();
  await page.getByLabel("Nama", { exact: true }).fill(name);
  await page.getByLabel("Nomor WhatsApp atau telepon").fill(phone);
  await page.getByLabel("Catatan (opsional)").fill("Ukuran 14");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Kirim reservasi" }).click();
  // Saved in the database first; allow for a slow round trip.
  await expect(page.getByText("Reservasi tersimpan.", { exact: false })).toBeVisible({ timeout: 20_000 });

  await signIn(page);
  await page.goto("/admin/leads");
  const card = page.getByRole("listitem").filter({ hasText: name });
  await expect(card).toContainText(phone);
  await expect(card).toContainText("Cincin Polos");
  await expect(card).toContainText("Ukuran 14");

  await card.getByRole("combobox").selectOption("contacted");
  await expect(toast(page, "Status diperbarui")).toBeVisible();

  const exported = await page.request.get("/admin/leads/export");
  expect(exported.status()).toBe(200);
  expect(exported.headers()["content-type"]).toContain("text/csv");
  const csv = await exported.text();
  expect(csv).toContain("nama");
  expect(csv).toContain(name);
  expect(csv).toContain("contacted");

  await card.getByRole("button", { name: "Hapus" }).click();
  await card.getByRole("button", { name: "Ya, hapus" }).click();
  await expect(toast(page, "Reservasi dihapus")).toBeVisible();
  await expect(page.getByText(name)).toHaveCount(0);
});

test("the reservation export is closed to visitors without a session", async ({ request }) => {
  const response = await request.get("/admin/leads/export", { maxRedirects: 0 });
  expect([302, 303, 307, 308]).toContain(response.status());
});

test("an admin imports products from CSV as drafts", async ({ page }) => {
  const stamp = Date.now();
  const csv = [
    "nama,jenis,kadar,berat,jenis_ongkos,nilai_ongkos,ukuran,acara,deskripsi",
    `Impor Uji ${stamp},cincin,22K,"3,5",per_gram,150000,10|12,hadiah,Baris uji`,
    "Tanpa Kadar,cincin,99K,2,per_gram,0,,,",
  ].join("\r\n");

  await signIn(page);
  await page.goto("/admin/produk/impor");
  // The form streams in after the admin check; wait until it is interactive.
  await page.waitForLoadState("networkidle");
  await page.locator("#csv-file").setInputFiles({ name: "produk.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf8") });
  await expect(page.getByText("1 baris siap diimpor, 1 baris perlu diperbaiki.")).toBeVisible();
  await expect(page.getByText("kadar tidak dikenal")).toBeVisible();

  const name = `Impor Uji ${stamp}`;
  await page.getByRole("button", { name: "Impor 1 produk sebagai draf" }).click();
  try {
    await expect(page).toHaveURL(/\/admin\/produk$/);
    const row = page.getByRole("listitem").filter({ hasText: name });
    await expect(row).toContainText("Draf");
    await row.getByRole("link", { name }).click();
    await expect(page.getByLabel("Berat (gram)")).toHaveValue("3,5");
  } finally {
    // Always remove the imported draft, even if a check above failed, so no test data is left behind.
    await page.goto("/admin/produk");
    const link = page.getByRole("link", { name });
    const created = await link.waitFor({ timeout: 20_000 }).then(
      () => true,
      () => false,
    );
    if (created) {
      await link.click();
      await page.getByRole("button", { name: "Hapus produk" }).click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Hapus produk" }).click();
      await expect(page).toHaveURL(/\/admin\/produk$/);
    }
  }
});

test("an admin writes an article, publishes it, and removes it", async ({ page }) => {
  const title = `Artikel Uji ${Date.now()}`;

  await signIn(page);
  await page.goto("/admin/artikel/baru");
  await page.getByLabel("Judul").fill(title);
  await page.getByLabel("Isi artikel (Markdown)").fill("## Bagian satu\n\nParagraf **penting**.\n\n<script>window.bahaya = 1</script>");
  await page.getByRole("button", { name: "Simpan artikel" }).click();
  await expect(page).toHaveURL(/\/admin\/artikel\/\d+$/);
  // The URL changes before the editor for the saved article has rendered; wait for
  // it, or the slug is read from the empty "new article" form still on screen.
  await expect(page.getByRole("heading", { name: "Ubah artikel" })).toBeVisible();
  await expect(page.getByLabel("Alamat halaman (slug)")).not.toHaveValue("");
  const slug = await page.getByLabel("Alamat halaman (slug)").inputValue();

  // Still a draft: not public.
  await page.goto(`/artikel/${slug}`);
  await expect(page.getByRole("heading", { name: /tidak ditemukan/ })).toBeVisible();

  await page.goBack();
  await page.getByLabel("Status").selectOption("published");
  await page.getByRole("button", { name: "Simpan artikel" }).click();
  await expect(toast(page, "Artikel tersimpan")).toBeVisible();

  await page.goto(`/artikel/${slug}`);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Bagian satu" })).toBeVisible();
  // Raw HTML in the Markdown is dropped, not executed.
  expect(await page.evaluate(() => (window as unknown as { bahaya?: number }).bahaya)).toBeUndefined();
  await page.goto("/artikel");
  await expect(page.getByRole("link", { name: new RegExp(title) })).toBeVisible();

  await page.goto("/admin/artikel");
  await page.getByRole("link", { name: new RegExp(title) }).click();
  await page.getByRole("button", { name: "Hapus artikel" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Hapus artikel" }).click();
  await expect(page).toHaveURL(/\/admin\/artikel$/);
  await page.goto("/artikel");
  await expect(page.getByText("Artikel pertama sedang kami tulis.")).toBeVisible();
});
