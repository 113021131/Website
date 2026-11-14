import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicSupabase } from "@/lib/supabase/public";
import { CACHE_TAGS, getSiteSettings } from "./public";

/** Cached public reads added in Phase 2: price history and articles. */

export const ARTICLES_TAG = "articles";
const HISTORY_DAYS = 90;

export type PricePoint = {
  /** Day in the shop's time zone, YYYY-MM-DD. */
  date: string;
  sellIdr: number;
};
export type PriceHistory = { karatCode: string; points: PricePoint[] }[];

/**
 * The last selling price of each day, per karat, for the past 90 days.
 * Days without a change carry no point; the chart draws straight between them.
 */
export async function getPriceHistory(): Promise<PriceHistory> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.prices, CACHE_TAGS.settings);

  const supabase = createPublicSupabase();
  const since = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const [settings, history] = await Promise.all([
    getSiteSettings(),
    supabase
      .from("gold_price_history")
      .select("sell_idr, effective_at, karats!inner(code, sort_order, is_active), stores!inner(is_primary)")
      .eq("stores.is_primary", true)
      .eq("karats.is_active", true)
      .gte("effective_at", since)
      .order("effective_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(5000),
  ]);
  if (history.error) throw new Error(`Could not load price history: ${history.error.message}`);

  const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone: settings.timezone });
  const byKarat = new Map<string, { sort: number; days: Map<string, number> }>();
  for (const row of history.data) {
    const entry = byKarat.get(row.karats.code) ?? { sort: row.karats.sort_order, days: new Map<string, number>() };
    // Rows arrive oldest first, so a later change on the same day replaces the earlier one.
    entry.days.set(dayOf.format(new Date(row.effective_at)), row.sell_idr);
    byKarat.set(row.karats.code, entry);
  }

  return [...byKarat.entries()]
    .sort((a, b) => a[1].sort - b[1].sort)
    .map(([karatCode, entry]) => ({
      karatCode,
      points: [...entry.days.entries()].map(([date, sellIdr]) => ({ date, sellIdr })),
    }));
}

export type ArticleSummary = { slug: string; title: string; excerpt: string | null; publishedAt: string | null };
export type Article = ArticleSummary & { bodyMd: string; updatedAt: string };

export async function getArticles(): Promise<ArticleSummary[]> {
  "use cache";
  cacheLife("days");
  cacheTag(ARTICLES_TAG);

  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("articles")
    .select("slug, title, excerpt, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw new Error(`Could not load articles: ${error.message}`);
  return data.map((row) => ({ slug: row.slug, title: row.title, excerpt: row.excerpt, publishedAt: row.published_at }));
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  "use cache";
  cacheLife("days");
  cacheTag(ARTICLES_TAG);

  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from("articles")
    .select("slug, title, excerpt, body_md, published_at, updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error(`Could not load the article: ${error.message}`);
  if (!data) return null;
  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    bodyMd: data.body_md,
    publishedAt: data.published_at,
    updatedAt: data.updated_at,
  };
}
