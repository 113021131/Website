/**
 * Generates the concept collection's photographs with a free public image
 * generator (Pollinations, FLUX model) and saves the originals where
 * scripts/process-concept-images.mjs expects them.
 *
 *   node scripts/generate-concept-images.mjs                      everything that is still missing
 *   node scripts/generate-concept-images.mjs --only <slug|hero>   one image, replacing what is there
 *   node scripts/generate-concept-images.mjs --only <slug> --seed 7 --view 2
 *
 * Only the prompt text from src/data/concept-products.ts is sent; nothing about
 * the shop or its owner. Every image is AI-generated and shows a fictional
 * design: it must never be presented as a photo of real stock. Look at each
 * result before using it; a different --seed gives a different attempt.
 *
 * The service is a third party with no guarantee of availability or quality.
 * Any generator can be used instead: `process-concept-images.mjs --prompts`
 * prints the same briefs.
 *
 * Seen on 16–17 Nov 2026: without an account the service quietly answers with a
 * weaker model ("sana" instead of "flux"), caps images at 768 px, stamps its logo
 * in the corner, and refuses most requests with HTTP 402. Those images were not
 * fit for the catalogue. With a free account, put its token in .env.local as
 * POLLINATIONS_TOKEN; the script then sends it and refuses any image that did
 * not come from the requested model.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ENDPOINT = "https://image.pollinations.ai/prompt/";
const OUT = "assets/generated";
const MODEL = "flux";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const token = process.env.POLLINATIONS_TOKEN;
const headers = token ? { Authorization: `Bearer ${token}` } : {};
if (!token) console.log("No POLLINATIONS_TOKEN: the free anonymous tier may downgrade the model and add a logo.");

/** The service records the model it really used in the image's metadata. */
function actualModel(bytes) {
  return bytes.subarray(0, 4000).toString("latin1").match(/"actualModel":"([^"]+)"/)?.[1] ?? null;
}

const dataFile = readFileSync("src/data/concept-products.ts", "utf8");
const constant = (name) =>
  [...(dataFile.match(new RegExp(`export const ${name} =([\\s\\S]*?);\\n`))?.[1] ?? "").matchAll(/"((?:[^"\\]|\\.)*)"/g)]
    .map((match) => match[1])
    .join("");
const style = constant("IMAGE_STYLE");
const jobs = [
  { key: "hero", file: "hero/sinar-mas-hero", prompt: constant("HERO_IMAGE_PROMPT"), width: 1792, height: 1008 },
  ...[...dataFile.matchAll(/slug: "([^"]+)",[\s\S]*?image_prompt:\s*"((?:[^"\\]|\\.)*)"/g)].map(([, slug, prompt]) => ({
    key: slug,
    file: `products/${slug}`,
    prompt: `${prompt} ${style}`,
    width: 1280,
    height: 1280,
  })),
];

const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index > 0 ? process.argv[index + 1] : undefined;
};
const only = argument("--only");
const view = Number(argument("--view") ?? 1);
const seedBase = Number(argument("--seed") ?? 20261116);

async function generate(job, index) {
  const target = path.join(OUT, job.key === "hero" ? `${job.file}.jpg` : `${job.file}-${view}.jpg`);
  if (!only && existsSync(target)) return console.log(`– ${job.key} already exists`);

  const seed = seedBase + index;
  const url =
    `${ENDPOINT}${encodeURIComponent(job.prompt)}` +
    `?width=${job.width}&height=${job.height}&model=${MODEL}&seed=${seed}&nologo=true&enhance=false`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { headers, signal: AbortSignal.timeout(180_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      const model = actualModel(bytes);
      if (model && model !== MODEL) {
        // A silently downgraded image is not good enough for the catalogue; stop instead of retrying.
        console.log(`✗ ${job.key}: the service used "${model}" instead of "${MODEL}"; image not kept`);
        process.exitCode = 1;
        return;
      }
      // Decode before keeping anything: what was downloaded must really be an image of a usable size.
      const info = await sharp(bytes).metadata();
      if (!info.width || !info.height || info.width < 512) throw new Error("not a usable image");
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, bytes);
      return console.log(`✓ ${job.key} → ${target} (${info.width}×${info.height} ${info.format}, seed ${seed})`);
    } catch (error) {
      console.log(`  ${job.key}: attempt ${attempt} failed (${error.message})`);
      await new Promise((resolve) => setTimeout(resolve, 8000 * attempt));
    }
  }
  console.log(`✗ ${job.key} could not be generated`);
  process.exitCode = 1;
}

const selected = only ? jobs.filter((job) => job.key === only) : jobs;
if (selected.length === 0) throw new Error(`No image is called "${only}". Use "hero" or a product slug.`);
// One at a time: the free service limits how many requests an anonymous caller may run at once.
for (const job of selected) await generate(job, jobs.indexOf(job));
