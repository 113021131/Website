/**
 * Pricing settings: everything the owner can tune besides the per-karat purity
 * (which lives in `karats.purity_percent`) and the per-product workmanship.
 * Stored as JSON in `site_settings.pricing`; anything missing falls back to the
 * defaults below, so a database without that column still prices consistently.
 */
import type { BuybackRule } from "./reference";

export type ReferenceStatus = "current" | "demo" | "outdated";

export type PricingSettings = {
  /** Market benchmark for 24K gold, Rupiah per gram, before the manual adjustment. */
  benchmarkIdr: number;
  /** Manual adjustment applied to the benchmark, in percent (−50 … 50). */
  adjustmentPercent: number;
  currency: "IDR";
  /** Where the benchmark came from, in words, and the page it was read from. */
  source: string;
  sourceUrl: string;
  /** When the benchmark was read (ISO, UTC). */
  retrievedAt: string | null;
  /** True while the reference is a demonstration figure rather than the shop's own. */
  simulated: boolean;
  /** Per-gram prices are rounded to this many Rupiah. */
  perGramStepIdr: number;
  /** Retail markup used when a product does not set its own, in percent. */
  defaultMarkupPercent: number;
  /** Tax or fee added to every estimate, in percent. 0 until the owner confirms what applies. */
  taxPercent: number;
  /** Buyback as a percentage of the karat's price per gram, with optional per-karat overrides. */
  buybackPercent: number;
  buybackPercentByKarat: Record<string, number>;
  /** Flat deduction per item on a buyback estimate, Rupiah. */
  buybackDeductionIdr: number;
};

/**
 * Demonstration defaults. The benchmark is PT Antam's published buyback price for
 * 1 g of 24K gold on 16 Nov 2026 (Rp 2.298.000), used as a stand-in for the raw
 * metal value: it leaves out the minting premium and retail spread contained in
 * Antam's selling price for a 1 g bar (Rp 2.522.000 the same day). It is not a
 * live feed and not the shop's price.
 */
export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  benchmarkIdr: 2_298_000,
  adjustmentPercent: 0,
  currency: "IDR",
  source: "Harga beli kembali emas batangan Antam 1 gram (Logam Mulia), dikutip Katadata",
  sourceUrl:
    "https://katadata.co.id/finansial/keuangan/6afa8061d5f70/harga-emas-antam-hari-ini-senin-16-november-2026-naik-rp5000",
  retrievedAt: "2026-11-16T08:00:00.000Z",
  simulated: true,
  perGramStepIdr: 1000,
  defaultMarkupPercent: 8,
  taxPercent: 0,
  buybackPercent: 90,
  buybackPercentByKarat: { "24K": 95 },
  buybackDeductionIdr: 0,
};

function numberIn(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

function integerIn(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

function text(value: unknown, fallback: string, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : fallback;
}

/** Reads `site_settings.pricing`. Unknown or out-of-range values are replaced by the defaults, one field at a time. */
export function readPricingSettings(raw: unknown): PricingSettings {
  const d = DEFAULT_PRICING_SETTINGS;
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return d;
  const value = raw as Record<string, unknown>;
  if (Object.keys(value).length === 0) return d;

  const byKarat: Record<string, number> = {};
  if (value.buybackPercentByKarat && typeof value.buybackPercentByKarat === "object") {
    for (const [code, percent] of Object.entries(value.buybackPercentByKarat as Record<string, unknown>)) {
      if (typeof percent === "number" && Number.isFinite(percent) && percent >= 0 && percent <= 100) {
        byKarat[code] = percent;
      }
    }
  }
  const retrievedAt =
    typeof value.retrievedAt === "string" && !Number.isNaN(new Date(value.retrievedAt).getTime())
      ? value.retrievedAt
      : null;

  return {
    benchmarkIdr: integerIn(value.benchmarkIdr, 1, 1_000_000_000, d.benchmarkIdr),
    adjustmentPercent: numberIn(value.adjustmentPercent, -50, 50, d.adjustmentPercent),
    currency: "IDR",
    source: text(value.source, d.source, 200),
    sourceUrl: text(value.sourceUrl, d.sourceUrl, 500),
    retrievedAt,
    simulated: typeof value.simulated === "boolean" ? value.simulated : d.simulated,
    perGramStepIdr: integerIn(value.perGramStepIdr, 1, 100_000, d.perGramStepIdr),
    defaultMarkupPercent: numberIn(value.defaultMarkupPercent, 0, 100, d.defaultMarkupPercent),
    taxPercent: numberIn(value.taxPercent, 0, 50, d.taxPercent),
    buybackPercent: numberIn(value.buybackPercent, 0, 100, d.buybackPercent),
    buybackPercentByKarat: byKarat,
    buybackDeductionIdr: integerIn(value.buybackDeductionIdr, 0, 1_000_000_000, d.buybackDeductionIdr),
  };
}

export function buybackRule(settings: PricingSettings): BuybackRule {
  return {
    buybackPercent: settings.buybackPercent,
    buybackPercentByKarat: settings.buybackPercentByKarat,
    perGramStepIdr: settings.perGramStepIdr,
  };
}

/** "demo" while the figure is simulated, "outdated" once it is older than the stale limit, else "current". */
export function referenceStatus(simulated: boolean, isStale: boolean): ReferenceStatus {
  if (simulated) return "demo";
  return isStale ? "outdated" : "current";
}
