import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { isPriceStale } from "@/lib/format";
import { createPublicSupabase } from "@/lib/supabase/public";
import type { Tables } from "@/lib/supabase/database.types";

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
