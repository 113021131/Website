/**
 * Turns the original photos (generated, or supplied by the owner) into the web
 * images the site serves, and records them in src/data/concept-images.json so
 * each photo is attached to its product. Small originals are never enlarged.
 *
 *   node scripts/process-concept-images.mjs          process everything found
 *   node scripts/process-concept-images.mjs --check  list what is present and what is still missing
 *
 * Put the originals (PNG, JPEG or WebP, as large as the generator gives) here:
 *
 *   assets/generated/hero/sinar-mas-hero.png                 wide, about 16:9
 *   assets/generated/products/<slug>-1.png                   primary photo, square
 *   assets/generated/products/<slug>-2.png, -3.png …         extra angles, optional
 *
 * <slug> is the product's slug in src/data/concept-products.ts, e.g.
 * cincin-kirana-solitaire-1.png. Output goes to public/images/hero and
 * public/images/products/<rings|necklaces|bracelets|earrings|wedding>/ as WebP:
 * products 1200 × 1200, hero 2000 px wide. The originals are kept untouched.
 *
 * Nothing is invented here: a product with no original simply keeps the
 * "Foto studio sedang disiapkan" stand-in on the site.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "assets/generated";
const MANIFEST = "src/data/concept-images.json";
const PRODUCT_SIZE = 1200;
const HERO_WIDTH = 2000;
const EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

// slug and image folder of every concept product, read from the data file so the two cannot drift apart.
const dataFile = readFileSync("src/data/concept-products.ts", "utf8");
const products = [...dataFile.matchAll(/slug: "([^"]+)",[\s\S]*?image_folder: "([^"]+)"/g)].map((match) => ({
  slug: match[1],
  folder: match[2],
}));
if (products.length === 0) throw new Error("No concept products found in src/data/concept-products.ts");

function findOriginal(directory, baseName) {
  for (const extension of EXTENSIONS) {
    const file = path.join(SOURCE, directory, `${baseName}${extension}`);
    if (existsSync(file)) return file;
  }
  return null;
}

function originalsOf(slug) {
  const found = [];
  for (let index = 1; index <= 8; index++) {
    const file = findOriginal("products", `${slug}-${index}`);
    if (!file) break;
    found.push(file);
  }
  return found;
}

const heroOriginal = findOriginal("hero", "sinar-mas-hero");

// --prompts: the brief for every image, ready to paste into an image generator.
if (process.argv.includes("--prompts")) {
  const constant = (name) =>
    [
      ...(dataFile.match(new RegExp(`export const ${name} =([\\s\\S]*?);\\n`))?.[1] ?? "").matchAll(
        /"((?:[^"\\]|\\.)*)"/g,
      ),
    ]
      .map((match) => match[1])
      .join("");
  const style = constant("IMAGE_STYLE");
  const prompts = [...dataFile.matchAll(/slug: "([^"]+)",[\s\S]*?image_prompt:\s*"((?:[^"\\]|\\.)*)"/g)];
  console.log(`assets/generated/hero/sinar-mas-hero.png  (wide, 16:9)\n${constant("HERO_IMAGE_PROMPT")}\n`);
  for (const [, slug, prompt] of prompts) {
    console.log(`assets/generated/products/${slug}-1.png  (square, 1:1)\n${prompt} ${style}\n`);
  }
  process.exit(0);
}

if (process.argv.includes("--check")) {
  console.log(
    heroOriginal ? `✓ hero            ${heroOriginal}` : "✗ hero            assets/generated/hero/sinar-mas-hero.png",
  );
  for (const product of products) {
    const originals = originalsOf(product.slug);
    console.log(
      originals.length > 0
        ? `✓ ${product.slug} (${originals.length})`
        : `✗ ${product.slug}   assets/generated/products/${product.slug}-1.png`,
    );
  }
  const present = existsSync(path.join(SOURCE, "products")) ? readdirSync(path.join(SOURCE, "products")) : [];
  const known = new Set(products.map((product) => product.slug));
  for (const file of present) {
    const slug = file.replace(/-\d+\.[a-z]+$/i, "");
    if (!known.has(slug)) console.log(`? ${file} does not match any product slug`);
  }
  process.exit(0);
}

const manifest = { hero: null, products: {} };

if (heroOriginal) {
  mkdirSync("public/images/hero", { recursive: true });
  const info = await sharp(heroOriginal)
    .rotate()
    .resize({ width: HERO_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile("public/images/hero/sinar-mas-hero.webp");
  manifest.hero = {
    src: "/images/hero/sinar-mas-hero.webp",
    width: info.width,
    height: info.height,
  };
  console.log(
    `✓ hero → public/images/hero/sinar-mas-hero.webp (${info.width}×${info.height}, ${Math.round(info.size / 1024)} kB)`,
  );
}

for (const product of products) {
  const originals = originalsOf(product.slug);
  if (originals.length === 0) continue;
  const directory = `public/images/products/${product.folder}`;
  mkdirSync(directory, { recursive: true });
  manifest.products[product.slug] = [];
  for (const [index, original] of originals.entries()) {
    const name = `${product.slug}-${index + 1}.webp`;
    const info = await sharp(original)
      .rotate()
      // Square crop around the centre; the generator is asked for a centred square already.
      .resize({
        width: PRODUCT_SIZE,
        height: PRODUCT_SIZE,
        fit: "cover",
        position: "centre",
        withoutEnlargement: true,
      })
      .webp({ quality: 84 })
      .toFile(path.join(directory, name));
    manifest.products[product.slug].push({
      src: `/images/products/${product.folder}/${name}`,
      width: info.width,
      height: info.height,
    });
    console.log(`✓ ${name} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} kB)`);
  }
}

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
const done = Object.keys(manifest.products).length;
console.log(
  `\n${done} of ${products.length} products have photos; hero ${manifest.hero ? "present" : "missing"}. Wrote ${MANIFEST}.`,
);
