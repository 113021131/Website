import type { PriceBoard, Product, SiteSettings } from "@/lib/data/public";
import { calculatePrice, type PriceBreakdown, type Rounding } from "@/lib/pricing/calculate";

/** Pure catalogue logic: price estimates, URL filter parsing, filtering, sorting, paging. */

export const PAGE_SIZE = 12;
export const SORT_KEYS = ["terbaru", "harga-naik", "harga-turun", "berat-naik", "berat-turun"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type CatalogQuery = {
  q: string;
  category: string;
  karat: string;
  occasion: string;
  minWeight: number | null;
  maxWeight: number | null;
  sort: SortKey;
  page: number;
};

export type PricedProduct = Product & {
  /** Null when the product is price-on-request or its karat has no price yet. */
  estimate: PriceBreakdown | null;
};

export function roundingFromSettings(settings: SiteSettings): Rounding {
  return { mode: settings.rounding_mode, stepIdr: settings.rounding_step_idr };
}

export function estimateProduct(product: Product, board: PriceBoard, rounding: Rounding): PriceBreakdown | null {
  if (product.priceOnRequest) return null;
  const price = board.rows.find((row) => row.karatCode === product.karatCode);
  if (!price) return null;
  try {
    return calculatePrice({
      weightG: product.weightG,
      pricePerGramIdr: price.sellIdr,
      labourFee: { type: product.labourFeeType, value: product.labourFeeValue },
      rounding,
    });
  } catch {
    return null;
  }
}

export function priceProducts(products: Product[], board: PriceBoard, rounding: Rounding): PricedProduct[] {
  return products.map((product) => ({ ...product, estimate: estimateProduct(product, board, rounding) }));
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function parseWeight(value: string): number | null {
  const number = Number(value.replace(",", "."));
  return value !== "" && Number.isFinite(number) && number >= 0 ? number : null;
}

export function parseCatalogQuery(params: RawParams): CatalogQuery {
  const sort = first(params.urut);
  const page = Number.parseInt(first(params.hal), 10);
  return {
    q: first(params.q).slice(0, 80),
    category: first(params.jenis),
    karat: first(params.kadar),
    occasion: first(params.acara),
    minWeight: parseWeight(first(params.min)),
    maxWeight: parseWeight(first(params.maks)),
    sort: (SORT_KEYS as readonly string[]).includes(sort) ? (sort as SortKey) : "terbaru",
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function hasActiveFilters(query: CatalogQuery): boolean {
  return Boolean(
    query.q || query.category || query.karat || query.occasion || query.minWeight !== null || query.maxWeight !== null,
  );
}

/** Builds a /katalog URL, leaving out anything at its default so links stay clean. */
export function catalogHref(query: Partial<CatalogQuery>): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("jenis", query.category);
  if (query.karat) params.set("kadar", query.karat);
  if (query.occasion) params.set("acara", query.occasion);
  if (query.minWeight != null) params.set("min", String(query.minWeight));
  if (query.maxWeight != null) params.set("maks", String(query.maxWeight));
  if (query.sort && query.sort !== "terbaru") params.set("urut", query.sort);
  if (query.page && query.page > 1) params.set("hal", String(query.page));
  const search = params.toString();
  return search ? `/katalog?${search}` : "/katalog";
}

export type CatalogResult = {
  items: PricedProduct[];
  total: number;
  page: number;
  pageCount: number;
};

export function filterCatalog(products: PricedProduct[], query: CatalogQuery): CatalogResult {
  const needle = query.q.toLocaleLowerCase("id");

  const filtered = products.filter((product) => {
    if (needle && !product.name.toLocaleLowerCase("id").includes(needle)) return false;
    if (query.category && product.categorySlug !== query.category) return false;
    if (query.karat && product.karatCode !== query.karat) return false;
    if (query.occasion && !product.occasions.includes(query.occasion)) return false;
    if (query.minWeight !== null && product.weightG < query.minWeight) return false;
    if (query.maxWeight !== null && product.weightG > query.maxWeight) return false;
    return true;
  });

  // Items without an estimate (price on request) always sort after priced ones.
  const byPrice = (direction: 1 | -1) => (a: PricedProduct, b: PricedProduct) => {
    if (!a.estimate && !b.estimate) return 0;
    if (!a.estimate) return 1;
    if (!b.estimate) return -1;
    return (a.estimate.totalIdr - b.estimate.totalIdr) * direction;
  };

  const sorted = [...filtered];
  switch (query.sort) {
    case "harga-naik":
      sorted.sort(byPrice(1));
      break;
    case "harga-turun":
      sorted.sort(byPrice(-1));
      break;
    case "berat-naik":
      sorted.sort((a, b) => a.weightG - b.weightG);
      break;
    case "berat-turun":
      sorted.sort((a, b) => b.weightG - a.weightG);
      break;
    default:
      break; // already newest first from the database
  }

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(query.page, pageCount);
  return {
    items: sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: sorted.length,
    page,
    pageCount,
  };
}

export function similarProducts(all: PricedProduct[], product: Product, limit = 4): PricedProduct[] {
  const others = all.filter((other) => other.id !== product.id && other.status === "published");
  const sameCategory = others.filter((other) => other.categorySlug === product.categorySlug);
  const sameKarat = others.filter(
    (other) => other.karatCode === product.karatCode && other.categorySlug !== product.categorySlug,
  );
  return [...sameCategory, ...sameKarat].slice(0, limit);
}
