import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import conceptImages from "@/data/concept-images.json";
import { CONCEPT_PRODUCTS, type ConceptProduct } from "@/data/concept-products";
import { isPriceStale } from "@/lib/format";
import { REFERENCE_KARAT_CODE } from "@/lib/pricing/reference";
import {
  readPricingSettings,
  referenceStatus,
  type PricingSettings,
  type ReferenceStatus,
} from "@/lib/pricing/settings";
import { storageUrl } from "@/lib/storage";
import { createPublicSupabase } from "@/lib/supabase/public";
import type { Enums, Tables } from "@/lib/supabase/database.types";

/**
 * Public, cached reads. Each function is tagged; the admin Server Actions call
 * updateTag() with the same tag so a saved change shows up on the next request,
 * while visitors keep getting cached pages in between.
 */
export const CACHE_TAGS = {
  prices: "prices",
  store: "store",
  settings: "settings",
  products: "products",
  catalogMeta: "catalog-meta",
} as const;

export type PriceRow = {
  karatCode: string;
  karatLabel: string;
  sellIdr: number;
  buybackIdr: number;
  /** Share of pure gold the price was derived with, in percent. Null when the shop has not stated it. */
  purityPercent: number | null;
};

export type PriceBoard = {
  rows: PriceRow[];
  /** ISO UTC timestamp of the most recent change, or null when no price exists yet. */
  updatedAt: string | null;
  timeZone: string;
  isStale: boolean;
  isDemo: boolean;
  /** The 24K reference per gram every row is derived from. Null until one has been saved. */
  referenceIdr: number | null;
  referenceUpdatedAt: string | null;
  /** "demo" while the reference is a simulated figure, "outdated" when stale, otherwise "current". */
  status: ReferenceStatus;
};

export type SiteSettings = Tables<"site_settings">;
export type Store = Tables<"stores">;
export type Category = Pick<Tables<"categories">, "id" | "slug" | "name">;
export type Karat = Pick<Tables<"karats">, "id" | "code" | "label">;
export type Testimonial = Tables<"testimonials">;

export type ProductImage = {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
};
export type ProductSpec = {
  labelId: string;
  labelEn: string;
  valueId: string;
  valueEn: string;
};

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  weightG: number;
  karatCode: string;
  karatLabel: string;
  categorySlug: string | null;
  categoryName: string | null;
  sizeOptions: string[];
  occasions: string[];
  labourFeeType: Enums<"labour_fee_type">;
  labourFeeValue: number;
  priceOnRequest: boolean;
  status: Enums<"product_status">;
  isFeatured: boolean;
  isDemo: boolean;
  videoUrl: string | null;
  modelGlbUrl: string | null;
  modelUsdzUrl: string | null;
  tryonEnabled: boolean;
  tryonAssetRef: string | null;
  publishedAt: string | null;
  updatedAt: string;
  images: ProductImage[];
  sku: string | null;
  nameEn: string | null;
  descriptionEn: string | null;
  /** Weight of the finished piece with its stones. `weightG` is the net gold weight. */
  grossWeightG: number | null;
  gemstone: string | null;
  gemstoneEn: string | null;
  materialCostIdr: number;
  /** Null = the site-wide default markup. */
  markupPercent: number | null;
  /** A price the shop set by hand; shown as is and never recalculated. */
  manualPriceIdr: number | null;
  specs: ProductSpec[];
  /** A fictional design from the concept collection, not shop inventory. */
  isConcept: boolean;
  /** Marked as a bestseller for the demonstration showcase only. */
  isBestsellerDemo: boolean;
};

export type FeatureFlags = {
  tryon: boolean;
  viewer_3d: boolean;
  reserve: boolean;
};

export function readFeatureFlags(settings: SiteSettings): FeatureFlags {
  const raw = (settings.feature_flags ?? {}) as Record<string, unknown>;
  return {
    tryon: raw.tryon === true,
    viewer_3d: raw.viewer_3d === true,
    reserve: raw.reserve === true,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.settings);

  const supabase = createPublicSupabase();
  const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
  if (error) throw new Error(`Could not load site settings: ${error.message}`);
  return data;
}

/** The tunable parts of the price formula; built-in defaults until `site_settings.pricing` is filled. */
export async function getPricingSettings(): Promise<PricingSettings> {
  const settings = await getSiteSettings();
  return readPricingSettings((settings as { pricing?: unknown }).pricing);
}

export async function getPrimaryStore(): Promise<Store> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.store);

  const supabase = createPublicSupabase();
  const { data, error } = await supabase.from("stores").select("*").eq("is_primary", true).single();
  if (error) throw new Error(`Could not load the store record: ${error.message}`);
  return data;
}

export async function getPriceBoard(): Promise<PriceBoard> {
  "use cache";
  // Revalidates hourly so the "older than 24 hours" notice turns on by itself;
  // a price change in the admin invalidates the tag immediately.
  cacheLife("hours");
  cacheTag(CACHE_TAGS.prices, CACHE_TAGS.settings);

  const supabase = createPublicSupabase();
  const [settings, prices] = await Promise.all([
    getSiteSettings(),
    supabase
      .from("gold_prices")
      .select(
        "sell_idr, buyback_idr, updated_at, karats!inner(code, label, sort_order, is_active, purity_percent), stores!inner(is_primary)",
      )
      .eq("stores.is_primary", true),
  ]);

  if (prices.error) throw new Error(`Could not load gold prices: ${prices.error.message}`);

  // The inactive REF karat carries the 24K reference; it is never a row on the board.
  const reference = prices.data.find((row) => row.karats.code === REFERENCE_KARAT_CODE) ?? null;
  const sorted = prices.data
    .filter((row) => row.karats.is_active && row.karats.code !== REFERENCE_KARAT_CODE)
    .sort((a, b) => a.karats.sort_order - b.karats.sort_order);
  const pricing = readPricingSettings((settings as { pricing?: unknown }).pricing);
  const updatedAt = sorted.reduce<string | null>(
    (latest, row) => (latest === null || row.updated_at > latest ? row.updated_at : latest),
    null,
  );

  const isStale = updatedAt ? isPriceStale(updatedAt, Date.now(), settings.price_stale_hours) : false;

  return {
    rows: sorted.map((row) => ({
      karatCode: row.karats.code,
      karatLabel: row.karats.label,
      sellIdr: row.sell_idr,
      buybackIdr: row.buyback_idr,
      purityPercent: row.karats.purity_percent,
    })),
    updatedAt,
    timeZone: settings.timezone,
    isStale,
    isDemo: settings.demo_mode,
    referenceIdr: reference?.sell_idr ?? null,
    referenceUpdatedAt: reference?.updated_at ?? null,
    status: referenceStatus(settings.demo_mode || pricing.simulated, isStale),
  };
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.catalogMeta);

  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return data;
}

export async function getKarats(): Promise<Karat[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.catalogMeta);

  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("karats")
    .select("id, code, label")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(`Could not load karats: ${error.message}`);
  return data;
}

// "*" rather than a column list: the detail columns added by migration 20261116000100
// (sku, name_en, gemstone_details, …) are read when they exist and default when they do not.
const PRODUCT_SELECT =
  "*, karats!inner(code, label), categories(slug, name), product_images(storage_path, alt, width, height, sort_order)";

type DetailColumn =
  | "sku"
  | "name_en"
  | "description_en"
  | "gross_weight_g"
  | "gemstone_details"
  | "gemstone_details_en"
  | "material_cost_idr"
  | "markup_percent"
  | "manual_price_idr"
  | "specs";

// The detail columns are optional until that migration has been applied to the database.
type ProductRow = Omit<Tables<"products">, DetailColumn> &
  Partial<Pick<Tables<"products">, DetailColumn>> & {
    karats: { code: string; label: string };
    categories: { slug: string; name: string } | null;
    product_images: Pick<Tables<"product_images">, "storage_path" | "alt" | "width" | "height" | "sort_order">[];
  };

function readSpecs(raw: unknown): ProductSpec[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry) => {
    if (entry == null || typeof entry !== "object") return [];
    const { label_id, label_en, value_id, value_en } = entry as Record<string, unknown>;
    if (typeof label_id !== "string" || typeof value_id !== "string") return [];
    return [
      {
        labelId: label_id,
        labelEn: typeof label_en === "string" ? label_en : label_id,
        valueId: value_id,
        valueEn: typeof value_en === "string" ? value_en : value_id,
      },
    ];
  });
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    weightG: Number(row.weight_g),
    karatCode: row.karats.code,
    karatLabel: row.karats.label,
    categorySlug: row.categories?.slug ?? null,
    categoryName: row.categories?.name ?? null,
    sizeOptions: row.size_options,
    occasions: row.occasions,
    labourFeeType: row.labour_fee_type,
    labourFeeValue: Number(row.labour_fee_value),
    priceOnRequest: row.price_on_request,
    status: row.status,
    isFeatured: row.is_featured,
    isDemo: row.is_demo,
    videoUrl: row.video_url,
    modelGlbUrl: row.model_glb_path ? storageUrl("product-models", row.model_glb_path) : null,
    modelUsdzUrl: row.model_usdz_path ? storageUrl("product-models", row.model_usdz_path) : null,
    tryonEnabled: row.tryon_enabled,
    tryonAssetRef: row.tryon_asset_ref,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    images: [...row.product_images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        url: storageUrl("product-images", image.storage_path),
        alt: image.alt,
        width: image.width,
        height: image.height,
      })),
    sku: row.sku ?? null,
    nameEn: row.name_en ?? null,
    descriptionEn: row.description_en ?? null,
    grossWeightG: row.gross_weight_g != null ? Number(row.gross_weight_g) : null,
    gemstone: row.gemstone_details ?? null,
    gemstoneEn: row.gemstone_details_en ?? null,
    materialCostIdr: Number(row.material_cost_idr ?? 0),
    markupPercent: row.markup_percent != null ? Number(row.markup_percent) : null,
    manualPriceIdr: row.manual_price_idr ?? null,
    specs: readSpecs(row.specs),
    isConcept: false,
    isBestsellerDemo: false,
  };
}

const KARAT_LABELS: Record<ConceptProduct["gold_karat"], string> = {
  "24K": "Emas 24 Karat",
  "22K": "Emas 22 Karat",
  "18K": "Emas 18 Karat",
  "17K": "Emas 17 Karat",
  "14K": "Emas 14 Karat",
};

type ConceptImage = { src: string; width: number; height: number };
const CONCEPT_IMAGES = (conceptImages as { products: Record<string, ConceptImage[]> }).products;

/** The homepage hero photograph, or null until one has been generated (scripts/process-concept-images.mjs). */
export const heroImage = (conceptImages as { hero: ConceptImage | null }).hero;

function conceptToProduct(concept: ConceptProduct, categories: Category[]): Product {
  const category = categories.find((entry) => entry.slug === concept.category);
  return {
    id: concept.id,
    slug: concept.slug,
    name: concept.name_id,
    description: concept.description_id,
    weightG: concept.net_gold_weight_grams,
    karatCode: concept.gold_karat,
    karatLabel: KARAT_LABELS[concept.gold_karat],
    categorySlug: concept.category,
    categoryName: category?.name ?? null,
    sizeOptions: concept.available_sizes,
    occasions: concept.occasions,
    labourFeeType: concept.workmanship.type,
    labourFeeValue: concept.workmanship.value,
    priceOnRequest: false,
    status: "published",
    isFeatured: concept.is_featured,
    isDemo: true,
    videoUrl: null,
    modelGlbUrl: null,
    modelUsdzUrl: null,
    tryonEnabled: false,
    tryonAssetRef: null,
    publishedAt: concept.created_at,
    updatedAt: concept.updated_at,
    images: (CONCEPT_IMAGES[concept.slug] ?? []).map((image) => ({
      url: image.src,
      alt: `Foto konsep ${concept.name_id}`,
      width: image.width,
      height: image.height,
    })),
    sku: concept.sku,
    nameEn: concept.name_en,
    descriptionEn: concept.description_en,
    grossWeightG: concept.gross_weight_grams,
    gemstone: concept.gemstone_details_id,
    gemstoneEn: concept.gemstone_details_en,
    materialCostIdr: concept.material_cost_idr,
    markupPercent: concept.markup_percentage,
    manualPriceIdr: null,
    specs: concept.specs.map((entry) => ({
      labelId: entry.label_id,
      labelEn: entry.label_en,
      valueId: entry.value_id,
      valueEn: entry.value_en,
    })),
    isConcept: true,
    isBestsellerDemo: concept.is_bestseller_demo,
  };
}

/**
 * Every product a visitor may open (RLS hides drafts), newest first. While demo
 * mode is on, the concept collection (src/data/concept-products.ts) comes first.
 * The catalogue of a single shop is small, so pages filter and sort this one
 * cached list in memory instead of issuing a query per filter combination.
 */
export async function getCatalogProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.settings, CACHE_TAGS.catalogMeta);

  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .neq("status", "draft")
    .order("sort_order")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .limit(1000);
  if (error) throw new Error(`Could not load products: ${error.message}`);
  const stored = (data as unknown as ProductRow[]).map(toProduct);

  const [settings, categories] = await Promise.all([getSiteSettings(), getCategories()]);
  if (!settings.demo_mode) return stored;
  return [...CONCEPT_PRODUCTS.map((concept) => conceptToProduct(concept, categories)), ...stored];
}

/**
 * What the home page, catalogue and "similar" lists show. While demo mode is on
 * that is the concept collection plus the shop's real products; the older
 * placeholder rows flagged `is_demo` stay reachable by their address only.
 * With demo mode off it is simply everything in the database.
 */
export async function getListedProducts(): Promise<Product[]> {
  const [products, settings] = await Promise.all([getCatalogProducts(), getSiteSettings()]);
  return settings.demo_mode ? products.filter((product) => product.isConcept || !product.isDemo) : products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getCatalogProducts();
  return products.find((product) => product.slug === slug) ?? null;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.store);

  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw new Error(`Could not load testimonials: ${error.message}`);
  return data;
}
