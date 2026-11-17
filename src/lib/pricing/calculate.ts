/**
 * The one place a jewellery price is calculated.
 *
 *   gold value      = net weight × price_per_gram(karat)   (price_per_gram = 24K reference × purity)
 *   estimated_price = gold value + workmanship + material + markup + tax   → then rounded
 *
 * Markup is charged on gold value + workmanship + material; tax on that plus the
 * markup. Each part is counted once.
 *
 * Everything is integer arithmetic: weight in milligrams, money in whole Rupiah.
 * No floating-point money, so 0,1 g and Rp 100 juta+ on the same item stay exact.
 */

export type LabourFeeType = "per_gram" | "fixed" | "percent";
export type RoundingMode = "none" | "up" | "nearest";

export type LabourFee = {
  type: LabourFeeType;
  /** per_gram: Rupiah per gram. fixed: Rupiah per item. percent: % of the gold value. */
  value: number;
};

export type Rounding = {
  mode: RoundingMode;
  /** Step in Rupiah, e.g. 1000 rounds to the nearest Rp 1.000. */
  stepIdr: number;
};

export type PriceInput = {
  /** Grams, up to 3 decimals. Accepts the string Postgres returns for numeric(8,3). */
  weightG: number | string;
  pricePerGramIdr: number;
  labourFee: LabourFee;
  /** Gemstones and other non-gold material, whole Rupiah per item. Default 0. */
  materialCostIdr?: number;
  /** Retail markup, % of gold value + workmanship + material (2 decimals). Default 0. */
  markupPercent?: number;
  /** Tax or fee, % of everything above including markup (2 decimals). Default 0. */
  taxPercent?: number;
  rounding: Rounding;
};

export type PriceBreakdown = {
  weightMg: number;
  pricePerGramIdr: number;
  goldValueIdr: number;
  labourFeeIdr: number;
  materialCostIdr: number;
  markupIdr: number;
  taxIdr: number;
  /** Everything above added up, before rounding. */
  subtotalIdr: number;
  /** totalIdr − subtotalIdr. Positive when rounded up. */
  roundingAdjustmentIdr: number;
  totalIdr: number;
};

export const DEFAULT_ROUNDING: Rounding = { mode: "up", stepIdr: 1000 };

const MAX_WEIGHT_MG = 99_999_999; // numeric(8,3)

function assertNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite number ≥ 0, received ${value}`);
  }
}

/** Integer division of non-negative BigInts, rounding half up. */
function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n);
}

function toSafeNumber(value: bigint, name: string): number {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`${name} is too large to represent safely`);
  }
  return Number(value);
}

/** Scale a decimal to an integer, rejecting more precision than `decimals` allows. */
function toScaledInteger(value: number, decimals: number, name: string): bigint {
  assertNonNegativeFinite(value, name);
  const factor = 10 ** decimals;
  const scaled = Math.round(value * factor);
  if (Math.abs(value * factor - scaled) > 1e-6) {
    throw new RangeError(`${name} supports at most ${decimals} decimal places, received ${value}`);
  }
  return BigInt(scaled);
}

export function gramsToMilligrams(weightG: number | string): number {
  const grams = typeof weightG === "string" ? Number(weightG.trim()) : weightG;
  if (typeof weightG === "string" && weightG.trim() === "") {
    throw new RangeError("weightG is empty");
  }
  const mg = toScaledInteger(grams, 3, "weightG");
  if (mg <= 0n) {
    throw new RangeError(`weightG must be greater than 0, received ${weightG}`);
  }
  if (mg > BigInt(MAX_WEIGHT_MG)) {
    throw new RangeError(`weightG exceeds the supported maximum, received ${weightG}`);
  }
  return Number(mg);
}

export function applyRounding(amountIdr: number, rounding: Rounding): number {
  if (!Number.isInteger(amountIdr) || amountIdr < 0) {
    throw new RangeError(`amountIdr must be an integer ≥ 0, received ${amountIdr}`);
  }
  if (rounding.mode === "none") return amountIdr;
  if (!Number.isInteger(rounding.stepIdr) || rounding.stepIdr <= 0) {
    throw new RangeError(`rounding.stepIdr must be an integer > 0, received ${rounding.stepIdr}`);
  }
  const amount = BigInt(amountIdr);
  const step = BigInt(rounding.stepIdr);
  const rounded = rounding.mode === "up" ? ((amount + step - 1n) / step) * step : divRoundHalfUp(amount, step) * step;
  return toSafeNumber(rounded, "rounded amount");
}

export function calculatePrice(input: PriceInput): PriceBreakdown {
  const { pricePerGramIdr, labourFee, rounding } = input;

  if (!Number.isInteger(pricePerGramIdr) || pricePerGramIdr <= 0) {
    throw new RangeError(`pricePerGramIdr must be an integer > 0, received ${pricePerGramIdr}`);
  }

  const weightMg = gramsToMilligrams(input.weightG);
  const mg = BigInt(weightMg);

  const goldValue = divRoundHalfUp(mg * BigInt(pricePerGramIdr), 1000n);

  let labour: bigint;
  switch (labourFee.type) {
    case "per_gram": {
      // Rate in sen (2 decimals) × milligrams → Rupiah.
      const rateSen = toScaledInteger(labourFee.value, 2, "labourFee.value");
      labour = divRoundHalfUp(mg * rateSen, 100_000n);
      break;
    }
    case "fixed": {
      const sen = toScaledInteger(labourFee.value, 2, "labourFee.value");
      labour = divRoundHalfUp(sen, 100n);
      break;
    }
    case "percent": {
      // Percent with 2 decimals → basis points.
      const basisPoints = toScaledInteger(labourFee.value, 2, "labourFee.value");
      labour = divRoundHalfUp(goldValue * basisPoints, 10_000n);
      break;
    }
    default: {
      const unknownType: never = labourFee.type;
      throw new RangeError(`Unknown labour fee type: ${String(unknownType)}`);
    }
  }

  const materialCostIdr = input.materialCostIdr ?? 0;
  if (!Number.isInteger(materialCostIdr) || materialCostIdr < 0) {
    throw new RangeError(`materialCostIdr must be an integer ≥ 0, received ${materialCostIdr}`);
  }
  const markupBasisPoints = toScaledInteger(input.markupPercent ?? 0, 2, "markupPercent");
  const taxBasisPoints = toScaledInteger(input.taxPercent ?? 0, 2, "taxPercent");
  const cost = goldValue + labour + BigInt(materialCostIdr);
  const markup = divRoundHalfUp(cost * markupBasisPoints, 10_000n);
  const tax = divRoundHalfUp((cost + markup) * taxBasisPoints, 10_000n);

  const goldValueIdr = toSafeNumber(goldValue, "gold value");
  const labourFeeIdr = toSafeNumber(labour, "labour fee");
  const markupIdr = toSafeNumber(markup, "markup");
  const taxIdr = toSafeNumber(tax, "tax");
  const subtotalIdr = toSafeNumber(cost + markup + tax, "subtotal");
  const totalIdr = applyRounding(subtotalIdr, rounding);

  return {
    weightMg,
    pricePerGramIdr,
    goldValueIdr,
    labourFeeIdr,
    materialCostIdr,
    markupIdr,
    taxIdr,
    subtotalIdr,
    roundingAdjustmentIdr: totalIdr - subtotalIdr,
    totalIdr,
  };
}
