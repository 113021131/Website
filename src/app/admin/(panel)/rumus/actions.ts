"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { fill, getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { CACHE_TAGS, getCatalogProducts } from "@/lib/data/public";
import {
  DEFAULT_PURITY_PERCENT,
  derivePriceBoard,
  effectiveReference,
  REFERENCE_KARAT_CODE,
} from "@/lib/pricing/reference";
import { readPricingSettings, type PricingSettings } from "@/lib/pricing/settings";
import type { Json } from "@/lib/supabase/database.types";
import { createServerSupabase } from "@/lib/supabase/server";
import { warmPaths } from "@/lib/warm";

const WARN_CHANGE_PERCENT = 5;

/** Karats every installation should offer; missing ones are created with a starting purity. */
const STANDARD_KARATS: {
  code: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}[] = [
  {
    code: REFERENCE_KARAT_CODE,
    label: "Acuan emas murni 24K (per gram)",
    sortOrder: 0,
    isActive: false,
  },
  { code: "23K", label: "Emas 23 Karat", sortOrder: 15, isActive: true },
  { code: "21K", label: "Emas 21 Karat", sortOrder: 25, isActive: true },
  { code: "14K", label: "Emas 14 Karat", sortOrder: 60, isActive: true },
  { code: "10K", label: "Emas 10 Karat", sortOrder: 70, isActive: true },
];

const percent = (min: number, max: number) => z.number().min(min).max(max);

const inputSchema = z.object({
  confirmed: z.boolean(),
  benchmarkIdr: z.number().int().positive().max(1_000_000_000),
  adjustmentPercent: percent(-50, 50),
  source: z.string().trim().max(200),
  sourceUrl: z.union([z.literal(""), z.url({ protocol: /^https?$/ }).max(500)]),
  simulated: z.boolean(),
  perGramStepIdr: z.number().int().min(1).max(100_000),
  defaultMarkupPercent: percent(0, 100),
  taxPercent: percent(0, 50),
  buybackPercent: percent(0, 100),
  buybackDeductionIdr: z.number().int().min(0).max(1_000_000_000),
  karats: z
    .array(
      z.object({
        id: z.number().int().positive(),
        purityPercent: percent(0.001, 100),
        buybackPercent: percent(0, 100).nullable(),
      }),
    )
    .max(50),
});

export type SavePricingInput = z.input<typeof inputSchema>;
export type SavePricingResult =
  | { status: "saved"; message: string }
  | { status: "unchanged"; message: string }
  | { status: "confirm"; warnings: string[] }
  | { status: "error"; message: string };

/**
 * Saves the price formula and recalculates every karat's price per gram from the
 * 24K reference. The first call returns what will change; the second, confirmed
 * call writes. Product prices are not stored anywhere, so they follow by
 * themselves; a product with a manual price is left exactly as it is.
 */
export async function savePricing(input: SavePricingInput): Promise<SavePricingResult> {
  const admin = await requireAdmin();
  const t = getDictionary().admin.pricing;
  if (admin.role !== "owner") return { status: "error", message: t.ownerOnly };

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: t.invalid };
  const data = parsed.data;

  const supabase = await createServerSupabase();
  const [{ data: store }, { data: settings }, { data: existingKarats }] = await Promise.all([
    supabase.from("stores").select("id").eq("is_primary", true).single(),
    supabase.from("site_settings").select("*").eq("id", 1).single(),
    supabase.from("karats").select("code"),
  ]);
  if (!store || !settings || !existingKarats) return { status: "error", message: t.failed };

  // The pricing column arrives with migration 20261116000100; until then only the
  // reference price and the purities can be stored.
  const hasPricingColumn = "pricing" in settings;
  const storedPricing = (settings as { pricing?: unknown }).pricing;
  const before = readPricingSettings(storedPricing);
  // A fresh column holds {}: the first save writes the settings out even when no number was changed.
  const neverStored =
    hasPricingColumn && (storedPricing == null || Object.keys(storedPricing as Record<string, unknown>).length === 0);

  const missing = STANDARD_KARATS.filter((karat) => !existingKarats.some((entry) => entry.code === karat.code));
  if (missing.length > 0 && data.confirmed) {
    const { error } = await supabase.from("karats").insert(
      missing.map((karat) => ({
        code: karat.code,
        label: karat.label,
        sort_order: karat.sortOrder,
        is_active: karat.isActive,
        purity_percent: karat.code === REFERENCE_KARAT_CODE ? 100 : DEFAULT_PURITY_PERCENT[karat.code],
      })),
    );
    if (error) return { status: "error", message: t.failed };
  }

  const [{ data: karats }, { data: current }] = await Promise.all([
    supabase.from("karats").select("id, code, purity_percent, is_active"),
    supabase.from("gold_prices").select("karat_id, sell_idr, buyback_idr").eq("store_id", store.id),
  ]);
  if (!karats || !current) return { status: "error", message: t.failed };

  const purityOf = (karat: (typeof karats)[number]) =>
    data.karats.find((entry) => entry.id === karat.id)?.purityPercent ?? karat.purity_percent;
  const buybackPercentByKarat: Record<string, number> = {};
  for (const entry of data.karats) {
    const code = karats.find((karat) => karat.id === entry.id)?.code;
    if (code && entry.buybackPercent !== null) buybackPercentByKarat[code] = entry.buybackPercent;
  }

  const referenceIdr = effectiveReference(data.benchmarkIdr, data.adjustmentPercent, data.perGramStepIdr);
  const derived = derivePriceBoard(
    referenceIdr,
    karats.filter((karat) => karat.is_active).map((karat) => ({ code: karat.code, purityPercent: purityOf(karat) })),
    {
      buybackPercent: data.buybackPercent,
      buybackPercentByKarat,
      perGramStepIdr: data.perGramStepIdr,
    },
  );

  const referenceKarat = karats.find((karat) => karat.code === REFERENCE_KARAT_CODE);
  const previousReference = current.find((row) => row.karat_id === referenceKarat?.id)?.sell_idr ?? null;

  const priceRows = [
    ...(referenceKarat
      ? [
          {
            karat_id: referenceKarat.id,
            sell_idr: referenceIdr,
            buyback_idr: 0,
          },
        ]
      : []),
    ...derived.flatMap((row) => {
      const karat = karats.find((entry) => entry.code === row.karatCode);
      return karat
        ? [
            {
              karat_id: karat.id,
              sell_idr: row.sellIdr,
              buyback_idr: row.buybackIdr,
            },
          ]
        : [];
    }),
  ];
  const changedPrices = priceRows.filter((row) => {
    const existing = current.find((entry) => entry.karat_id === row.karat_id);
    return !existing || existing.sell_idr !== row.sell_idr || existing.buyback_idr !== row.buyback_idr;
  });
  const changedPurities = karats.filter((karat) => {
    const next = data.karats.find((entry) => entry.id === karat.id)?.purityPercent;
    return next !== undefined && next !== karat.purity_percent;
  });

  const benchmarkChanged =
    before.benchmarkIdr !== data.benchmarkIdr || before.source !== data.source || before.sourceUrl !== data.sourceUrl;
  const next: PricingSettings = {
    benchmarkIdr: data.benchmarkIdr,
    adjustmentPercent: data.adjustmentPercent,
    currency: "IDR",
    source: data.source,
    sourceUrl: data.sourceUrl,
    retrievedAt: benchmarkChanged || !before.retrievedAt ? new Date().toISOString() : before.retrievedAt,
    simulated: data.simulated,
    perGramStepIdr: data.perGramStepIdr,
    defaultMarkupPercent: data.defaultMarkupPercent,
    taxPercent: data.taxPercent,
    buybackPercent: data.buybackPercent,
    buybackPercentByKarat,
    buybackDeductionIdr: data.buybackDeductionIdr,
  };
  const comparable = (value: PricingSettings) => JSON.stringify({ ...value, retrievedAt: null });
  const settingsChanged = hasPricingColumn && (neverStored || comparable(next) !== comparable(before));

  if (changedPrices.length === 0 && changedPurities.length === 0 && !settingsChanged && missing.length === 0) {
    return { status: "unchanged", message: t.nothingChanged };
  }

  if (!data.confirmed) {
    const warnings: string[] = [];
    const replaced = changedPrices.filter((row) => row.karat_id !== referenceKarat?.id).length + missing.length;
    if (replaced > 0) warnings.push(fill(t.warnRecalculate, { count: String(replaced) }));
    if (previousReference) {
      const change = (Math.abs(referenceIdr - previousReference) / previousReference) * 100;
      if (change > WARN_CHANGE_PERCENT) {
        warnings.push(fill(t.warnChange, { percent: change.toFixed(1).replace(".", ",") }));
      }
    }
    if (hasPricingColumn) {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .not("manual_price_idr", "is", null);
      if (count) warnings.push(t.warnManual);
    }
    if (warnings.length > 0) return { status: "confirm", warnings };
  }

  for (const karat of changedPurities) {
    const { error } = await supabase
      .from("karats")
      .update({ purity_percent: purityOf(karat) })
      .eq("id", karat.id);
    if (error) return { status: "error", message: t.failed };
  }

  if (changedPrices.length > 0) {
    const { error } = await supabase.from("gold_prices").upsert(
      changedPrices.map((row) => ({ store_id: store.id, ...row })),
      { onConflict: "store_id,karat_id" },
    );
    if (error) return { status: "error", message: t.failed };
  }

  if (settingsChanged) {
    const { error } = await supabase
      .from("site_settings")
      .update({ pricing: next as unknown as Json })
      .eq("id", 1);
    if (error) return { status: "error", message: t.failed };
  }

  // Expire everything that shows a price, then rebuild the product pages in the background.
  updateTag(CACHE_TAGS.prices);
  updateTag(CACHE_TAGS.settings);
  updateTag(CACHE_TAGS.catalogMeta);
  updateTag(CACHE_TAGS.products);
  const products = await getCatalogProducts();
  await warmPaths(products.map((product) => `/katalog/${product.slug}`));

  return {
    status: "saved",
    message: hasPricingColumn ? t.saved : t.savedPartial,
  };
}
