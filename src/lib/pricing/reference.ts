/**
 * The dynamic part of pricing: one 24K reference price per gram, from which every
 * karat's price per gram and buyback per gram are derived.
 *
 *   reference          = benchmark × (1 + manual adjustment %)        → rounded to the step
 *   sell per gram (K)  = reference × purity(K)                        → rounded to the step
 *   buyback per gram   = sell per gram × buyback % (per karat or default) → rounded to the step
 *   buyback value      = net weight × buyback per gram − deductions   → rounded down, never below 0
 *
 * Pure functions, integer Rupiah, safe on server and client. Nothing here reads
 * the database; `settings` comes from `site_settings.pricing` (see ./settings.ts).
 */
import { gramsToMilligrams } from "./calculate";

/** The stand-in karat row that stores the 24K reference price (never shown on the price board). */
export const REFERENCE_KARAT_CODE = "REF";

/**
 * Starting purities, in percent. Each shop states its own kadar, so these are
 * only what a new installation begins with; the live values are `karats.purity_percent`.
 */
export const DEFAULT_PURITY_PERCENT: Readonly<Record<string, number>> = {
  "24K": 99.9,
  "23K": 95.8,
  "22K": 91.6,
  "21K": 87.5,
  "18K": 75,
  "17K": 70.8,
  "16K": 66.7,
  "14K": 58.5,
  "10K": 41.7,
};

export type KaratPurity = { code: string; purityPercent: number | null };
export type DerivedPrice = {
  karatCode: string;
  purityPercent: number;
  sellIdr: number;
  buybackIdr: number;
};
export type BuybackRule = {
  /** Default buyback, % of the karat's sell price per gram. */
  buybackPercent: number;
  /** Optional per-karat override, e.g. { "24K": 95 }. */
  buybackPercentByKarat: Record<string, number>;
  perGramStepIdr: number;
};

function assertPercent(value: number, name: string, min: number, max: number): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be between ${min} and ${max}, received ${value}`);
  }
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be an integer > 0, received ${value}`);
  }
}

/** amount × percent ÷ 100, where percent has at most 3 decimals; rounded half up to whole Rupiah. */
function percentOf(amountIdr: number, percent: number): bigint {
  const thousandths = BigInt(Math.round(percent * 1000));
  return (BigInt(amountIdr) * thousandths * 2n + 100_000n) / 200_000n;
}

function roundToStep(amount: bigint, stepIdr: number, mode: "nearest" | "down"): number {
  assertPositiveInteger(stepIdr, "stepIdr");
  const step = BigInt(stepIdr);
  const rounded = mode === "down" ? (amount / step) * step : ((amount * 2n + step) / (step * 2n)) * step;
  return Number(rounded);
}

/** The 24K reference actually used: the benchmark with the shop's manual adjustment applied. */
export function effectiveReference(benchmarkIdr: number, adjustmentPercent: number, stepIdr: number): number {
  assertPositiveInteger(benchmarkIdr, "benchmarkIdr");
  assertPercent(adjustmentPercent, "adjustmentPercent", -50, 50);
  return roundToStep(percentOf(benchmarkIdr, 100 + adjustmentPercent), stepIdr, "nearest");
}

/** Price per gram of one karat: reference × purity. */
export function perGramFromReference(referenceIdr: number, purityPercent: number, stepIdr: number): number {
  assertPositiveInteger(referenceIdr, "referenceIdr");
  assertPercent(purityPercent, "purityPercent", 0.001, 100);
  return roundToStep(percentOf(referenceIdr, purityPercent), stepIdr, "nearest");
}

export function buybackPercentFor(karatCode: string, rule: BuybackRule): number {
  return rule.buybackPercentByKarat[karatCode] ?? rule.buybackPercent;
}

/** Buyback per gram of one karat: its sell price × the buyback percentage. */
export function buybackPerGram(sellPerGramIdr: number, buybackPercent: number, stepIdr: number): number {
  assertPositiveInteger(sellPerGramIdr, "sellPerGramIdr");
  assertPercent(buybackPercent, "buybackPercent", 0, 100);
  return roundToStep(percentOf(sellPerGramIdr, buybackPercent), stepIdr, "nearest");
}

/** Every karat that has a purity, priced from the reference. Karats without a purity are skipped. */
export function derivePriceBoard(referenceIdr: number, karats: KaratPurity[], rule: BuybackRule): DerivedPrice[] {
  return karats.flatMap((karat) => {
    if (karat.code === REFERENCE_KARAT_CODE || karat.purityPercent == null) return [];
    const sellIdr = perGramFromReference(referenceIdr, karat.purityPercent, rule.perGramStepIdr);
    return [
      {
        karatCode: karat.code,
        purityPercent: karat.purityPercent,
        sellIdr,
        buybackIdr: buybackPerGram(sellIdr, buybackPercentFor(karat.code, rule), rule.perGramStepIdr),
      },
    ];
  });
}

export type BuybackInput = {
  weightG: number | string;
  buybackPerGramIdr: number;
  /** Flat deduction per item (cleaning, missing certificate, …). Default 0. */
  deductionIdr?: number;
  /** Rounded down to this step; the shop never rounds a payout up. Default Rp 1.000. */
  stepIdr?: number;
};

export type BuybackBreakdown = {
  weightMg: number;
  buybackPerGramIdr: number;
  grossIdr: number;
  deductionIdr: number;
  totalIdr: number;
};

/** What the shop might pay for a piece: weight × buyback per gram − deductions. An estimate, not an offer. */
export function calculateBuyback(input: BuybackInput): BuybackBreakdown {
  const { buybackPerGramIdr, deductionIdr = 0, stepIdr = 1000 } = input;
  if (!Number.isInteger(buybackPerGramIdr) || buybackPerGramIdr < 0) {
    throw new RangeError(`buybackPerGramIdr must be an integer ≥ 0, received ${buybackPerGramIdr}`);
  }
  if (!Number.isInteger(deductionIdr) || deductionIdr < 0) {
    throw new RangeError(`deductionIdr must be an integer ≥ 0, received ${deductionIdr}`);
  }
  const weightMg = gramsToMilligrams(input.weightG);
  const gross = (BigInt(weightMg) * BigInt(buybackPerGramIdr) * 2n + 1000n) / 2000n;
  const net = gross > BigInt(deductionIdr) ? gross - BigInt(deductionIdr) : 0n;
  return {
    weightMg,
    buybackPerGramIdr,
    grossIdr: Number(gross),
    deductionIdr,
    totalIdr: roundToStep(net, stepIdr, "down"),
  };
}
