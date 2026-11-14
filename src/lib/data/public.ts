import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isPriceStale } from "@/lib/format";
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
};

export type PriceBoard = {
  rows: PriceRow[];
  /** ISO UTC timestamp of the most recent change, or null when no price exists yet. */
  updatedAt: string | null;
  timeZone: string;
  isStale: boolean;
  isDemo: boolean;
};

export type SiteSettings = Tables<"site_settings">;
export type Store = Tables<"stores">;
export type Category = Pick<Tables<"categories">, "id" | "slug" | "name">;
export type Karat = Pick<Tables<"karats">, "id" | "code" | "label">;
export type Testimonial = Tables<"testimonials">;

export type ProductImage = { url: string; alt: string; width: number | null; height: number | null };

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
};

export type FeatureFlags = { tryon: boolean; viewer_3d: boolean; reserve: boolean };

export function readFeatureFlags(settings: SiteSettings): FeatureFlags {
  const raw = (settings.feature_flags ?? {}) as Record<string, unknown>;
  return { tryon: raw.tryon === true, viewer_3d: raw.viewer_3d === true, reserve: raw.reserve === true };
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
        "sell_idr, buyback_idr, updated_at, karats!inner(code, label, sort_order, is_active), stores!inner(is_primary)",
      )
      .eq("stores.is_primary", true)
      .eq("karats.is_active", true),
  ]);

  if (prices.error) throw new Error(`Could not load gold prices: ${prices.error.message}`);

  const sorted = [...prices.data].sort((a, b) => a.karats.sort_order - b.karats.sort_order);
  const updatedAt = sorted.reduce<string | null>(
    (latest, row) => (latest === null || row.updated_at > latest ? row.updated_at : latest),
    null,
  );

  return {
    rows: sorted.map((row) => ({
      karatCode: row.karats.code,
      karatLabel: row.karats.label,
      sellIdr: row.sell_idr,
      buybackIdr: row.buyback_idr,
    })),
    updatedAt,
    timeZone: settings.timezone,
    isStale: updatedAt ? isPriceStale(updatedAt, Date.now(), settings.price_stale_hours) : false,
    isDemo: settings.demo_mode,
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

const PRODUCT_SELECT =
  "id, slug, name, description, weight_g, size_options, occasions, labour_fee_type, labour_fee_value, " +
  "price_on_request, status, is_featured, is_demo, video_url, model_glb_path, model_usdz_path, " +
  "tryon_enabled, tryon_asset_ref, published_at, updated_at, sort_order, " +
  "karats!inner(code, label), categories(slug, name), product_images(storage_path, alt, width, height, sort_order)";

type ProductRow = Tables<"products"> & {
  karats: { code: string; label: string };
  categories: { slug: string; name: string } | null;
  product_images: Pick<Tables<"product_images">, "storage_path" | "alt" | "width" | "height" | "sort_order">[];
};

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
  };
}

/**
 * Every product a visitor may see (RLS hides drafts), newest first.
 * The catalogue of a single shop is small, so pages filter and sort this one
 * cached list in memory instead of issuing a query per filter combination.
 */
export async function getCatalogProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

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
  return (data as unknown as ProductRow[]).map(toProduct);
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
