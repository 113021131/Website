/**
 * Seeds 12 DEMO products with generated placeholder images.
 *
 *   node scripts/seed-demo.mjs          create or refresh the demo products
 *   node scripts/seed-demo.mjs --remove delete them (and their images) again
 *
 * Signs in as the test admin from .env.local, so it goes through the same RLS and
 * storage policies as the real admin. Every product is flagged is_demo and shows
 * a "Contoh" badge; the images are drawings that say "CONTOH", not product photos.
 * The set deliberately includes the worst cases the UI must survive.
 */
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

process.loadEnvFile(".env.local");
const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } =
  process.env;
if (!url || !key || !E2E_ADMIN_EMAIL || !E2E_ADMIN_PASSWORD) {
  throw new Error("Missing Supabase or E2E_ADMIN_* values in .env.local");
}

const NOTE = "Produk contoh untuk melihat tampilan situs. Bukan stok toko.";

/** kind → SVG paths drawn in an 80×80 box. */
const ART = {
  cincin: '<circle cx="40" cy="48" r="20"/><polygon points="40,14 31,24 40,34 49,24"/>',
  "mas-kawin": '<circle cx="31" cy="42" r="17"/><circle cx="49" cy="42" r="17"/>',
  kalung: '<path d="M14 14 Q40 74 66 14"/><circle cx="40" cy="51" r="6"/>',
  gelang: '<ellipse cx="40" cy="40" rx="27" ry="17"/><ellipse cx="40" cy="40" rx="19" ry="10"/>',
  anting: '<path d="M27 14 v14"/><circle cx="27" cy="40" r="11"/><path d="M53 14 v14"/><circle cx="53" cy="40" r="11"/>',
  liontin: '<path d="M26 12 L40 30 L54 12"/><path d="M40 30 C26 44 30 64 40 66 C50 64 54 44 40 30 Z"/>',
  "perhiasan-anak": '<ellipse cx="40" cy="42" rx="20" ry="13"/><circle cx="40" cy="22" r="5"/>',
};

const PRODUCTS = [
  { slug: "demo-cincin-polos-22k", name: "Cincin Polos", category: "cincin", karat: "22K", weight: 3.5, fee: ["per_gram", 150000], sizes: ["10", "12", "14", "16"], occasions: ["sehari-hari"], featured: true, images: 2 },
  { slug: "demo-set-cincin-kawin", name: "Set Cincin Kawin Sepasang Ukir Nama dengan Kotak Beludru untuk Akad Nikah dan Resepsi Keluarga Besar", category: "mas-kawin", karat: "22K", weight: 8.25, fee: ["fixed", 750000], sizes: ["12 & 18", "14 & 20"], occasions: ["pernikahan"], featured: true, images: 2 },
  { slug: "demo-kalung-rantai-padat-24k", name: "Kalung Rantai Padat", category: "kalung", karat: "24K", weight: 60, fee: ["percent", 5], occasions: ["pernikahan", "hadiah"], images: 1 },
  { slug: "demo-kalung-liontin-hati-18k", name: "Kalung Liontin Hati", category: "kalung", karat: "18K", weight: 4.2, fee: ["per_gram", 200000], occasions: ["hadiah"], featured: true, images: 2 },
  { slug: "demo-gelang-rantai-17k", name: "Gelang Rantai", category: "gelang", karat: "17K", weight: 6.75, fee: ["per_gram", 120000], occasions: ["sehari-hari"], images: 1 },
  { slug: "demo-gelang-anak-18k", name: "Gelang Anak", category: "perhiasan-anak", karat: "18K", weight: 2.25, fee: ["per_gram", 150000], occasions: ["anak", "hadiah"], images: 1 },
  { slug: "demo-anting-tusuk-mini-16k", name: "Anting Tusuk Mini", category: "anting", karat: "16K", weight: 0.1, fee: ["fixed", 50000], occasions: ["anak", "sehari-hari"], images: 1 },
  { slug: "demo-anting-bulat-17k", name: "Anting Bulat", category: "anting", karat: "17K", weight: 1.2, fee: ["per_gram", 150000], occasions: ["sehari-hari"], status: "sold", images: 1 },
  { slug: "demo-liontin-huruf-18k", name: "Liontin Huruf", category: "liontin", karat: "18K", weight: 0.85, fee: ["fixed", 100000], occasions: ["hadiah"], status: "out_of_stock", images: 1 },
  { slug: "demo-liontin-koin-24k", name: "Liontin Koin", category: "liontin", karat: "24K", weight: 5, fee: ["per_gram", 0], occasions: ["imlek", "hadiah"], onRequest: true, images: 1 },
  { slug: "demo-cincin-mata-satu-18k", name: "Cincin Mata Satu", category: "cincin", karat: "18K", weight: 2.8, fee: ["per_gram", 250000], sizes: ["11", "13", "15"], occasions: ["hadiah", "lebaran"], images: 0 },
  { slug: "demo-gelang-keroncong-22k", name: "Gelang Keroncong", category: "gelang", karat: "22K", weight: 15.5, fee: ["per_gram", 100000], occasions: ["lebaran", "imlek"], featured: true, images: 2 },
];

function placeholderSvg(kind, variant) {
  const background = variant === 0 ? "#FBF5E6" : "#F7F4F0";
  const scale = variant === 0 ? 7 : 5;
  const offset = (1000 - 80 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1250" viewBox="0 0 1000 1250">
  <rect width="1000" height="1250" fill="${background}"/>
  <g transform="translate(${offset} ${offset + 60}) scale(${scale})" fill="none" stroke="#8A6410" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ART[kind]}</g>
  <text x="500" y="1120" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="700" fill="#6B4A00" letter-spacing="6">CONTOH</text>
  <text x="500" y="1180" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#5B4E50">Bukan foto produk</text>
</svg>`;
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const signIn = await supabase.auth.signInWithPassword({ email: E2E_ADMIN_EMAIL, password: E2E_ADMIN_PASSWORD });
if (signIn.error) throw new Error(`Sign-in failed: ${signIn.error.message}`);

function check(result, what) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data;
}

if (process.argv.includes("--remove")) {
  const demo = check(await supabase.from("products").select("id, product_images(storage_path)").eq("is_demo", true), "list demo");
  const paths = demo.flatMap((product) => product.product_images.map((image) => image.storage_path));
  if (paths.length > 0) check(await supabase.storage.from("product-images").remove(paths), "remove images");
  check(await supabase.from("products").delete().eq("is_demo", true), "delete demo products");
  console.log(`Removed ${demo.length} demo products and ${paths.length} images.`);
  process.exit(0);
}

const karats = check(await supabase.from("karats").select("id, code"), "karats");
const categories = check(await supabase.from("categories").select("id, slug"), "categories");
const karatId = (code) => karats.find((karat) => karat.code === code)?.id;
const categoryId = (slug) => categories.find((category) => category.slug === slug)?.id;

let sortOrder = 0;
for (const item of PRODUCTS) {
  sortOrder += 10;
  const status = item.status ?? "published";
  const product = check(
    await supabase
      .from("products")
      .upsert(
        {
          slug: item.slug,
          name: item.name,
          description: NOTE,
          category_id: categoryId(item.category),
          karat_id: karatId(item.karat),
          weight_g: item.weight,
          size_options: item.sizes ?? [],
          occasions: item.occasions ?? [],
          labour_fee_type: item.fee[0],
          labour_fee_value: item.fee[1],
          price_on_request: item.onRequest === true,
          status,
          is_featured: item.featured === true,
          is_demo: true,
          sort_order: sortOrder,
          published_at: new Date().toISOString(),
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single(),
    `upsert ${item.slug}`,
  );

  check(await supabase.from("product_images").delete().eq("product_id", product.id), `clear images ${item.slug}`);

  for (let index = 0; index < item.images; index++) {
    const buffer = await sharp(Buffer.from(placeholderSvg(item.category, index))).webp({ quality: 80 }).toBuffer();
    const path = `demo/${item.slug}-${index + 1}.webp`;
    check(
      await supabase.storage.from("product-images").upload(path, buffer, { contentType: "image/webp", upsert: true }),
      `upload ${path}`,
    );
    check(
      await supabase.from("product_images").insert({
        product_id: product.id,
        storage_path: path,
        alt: `Gambar contoh ${item.name}, bukan foto produk`,
        width: 1000,
        height: 1250,
        sort_order: index,
      }),
      `image row ${path}`,
    );
  }
  console.log(`✓ ${item.slug} (${status}, ${item.images} image${item.images === 1 ? "" : "s"})`);
}

await supabase.auth.signOut();
console.log(`Seeded ${PRODUCTS.length} demo products.`);
