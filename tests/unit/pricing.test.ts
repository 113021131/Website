import { describe, expect, it } from "vitest";
import {
  applyRounding,
  calculatePrice,
  DEFAULT_ROUNDING,
  gramsToMilligrams,
  type PriceInput,
} from "@/lib/pricing/calculate";

const base: PriceInput = {
  weightG: 2.5,
  pricePerGramIdr: 1_500_000,
  labourFee: { type: "per_gram", value: 150_000 },
  rounding: DEFAULT_ROUNDING,
};

describe("calculatePrice: formula", () => {
  it("is weight × price per gram + labour fee", () => {
    const result = calculatePrice(base);
    expect(result.goldValueIdr).toBe(3_750_000);
    expect(result.labourFeeIdr).toBe(375_000);
    expect(result.subtotalIdr).toBe(4_125_000);
    expect(result.totalIdr).toBe(4_125_000);
    expect(result.roundingAdjustmentIdr).toBe(0);
  });

  it("always returns a breakdown that adds up", () => {
    const result = calculatePrice({ ...base, weightG: 3.337, pricePerGramIdr: 1_487_300 });
    expect(result.goldValueIdr + result.labourFeeIdr).toBe(result.subtotalIdr);
    expect(result.subtotalIdr + result.roundingAdjustmentIdr).toBe(result.totalIdr);
  });

  it("accepts the numeric string Postgres returns", () => {
    expect(calculatePrice({ ...base, weightG: "2.500" })).toEqual(calculatePrice(base));
  });
});

describe("calculatePrice: labour fee types", () => {
  it("per_gram multiplies the rate by the weight", () => {
    const result = calculatePrice({
      ...base,
      weightG: 1.25,
      labourFee: { type: "per_gram", value: 100_000 },
    });
    expect(result.labourFeeIdr).toBe(125_000);
  });

  it("fixed ignores the weight", () => {
    const light = calculatePrice({ ...base, weightG: 0.5, labourFee: { type: "fixed", value: 250_000 } });
    const heavy = calculatePrice({ ...base, weightG: 50, labourFee: { type: "fixed", value: 250_000 } });
    expect(light.labourFeeIdr).toBe(250_000);
    expect(heavy.labourFeeIdr).toBe(250_000);
  });

  it("percent is taken from the gold value, not the total", () => {
    const result = calculatePrice({ ...base, labourFee: { type: "percent", value: 10 } });
    expect(result.goldValueIdr).toBe(3_750_000);
    expect(result.labourFeeIdr).toBe(375_000);
  });

  it("percent supports two decimals", () => {
    const result = calculatePrice({
      ...base,
      weightG: 1,
      pricePerGramIdr: 2_000_000,
      labourFee: { type: "percent", value: 7.25 },
    });
    expect(result.labourFeeIdr).toBe(145_000);
  });

  it("a zero fee is allowed", () => {
    expect(calculatePrice({ ...base, labourFee: { type: "per_gram", value: 0 } }).labourFeeIdr).toBe(0);
  });
});

describe("calculatePrice: rounding", () => {
  const odd: PriceInput = {
    weightG: 1.337,
    pricePerGramIdr: 1_753_900,
    labourFee: { type: "fixed", value: 0 },
    rounding: DEFAULT_ROUNDING,
  };
  // 1.337 g × 1.753.900 = 2.344.964,3 → 2.344.964

  it("default rounds UP to the nearest Rp 1.000", () => {
    const result = calculatePrice(odd);
    expect(result.subtotalIdr).toBe(2_344_964);
    expect(result.totalIdr).toBe(2_345_000);
    expect(result.roundingAdjustmentIdr).toBe(36);
  });

  it("rounds up even when Rp 1 over the step", () => {
    expect(applyRounding(2_345_001, { mode: "up", stepIdr: 1000 })).toBe(2_346_000);
  });

  it("leaves an exact multiple untouched", () => {
    expect(applyRounding(2_345_000, { mode: "up", stepIdr: 1000 })).toBe(2_345_000);
  });

  it("nearest rounds half up", () => {
    expect(applyRounding(2_345_499, { mode: "nearest", stepIdr: 1000 })).toBe(2_345_000);
    expect(applyRounding(2_345_500, { mode: "nearest", stepIdr: 1000 })).toBe(2_346_000);
  });

  it("supports a Rp 5.000 step", () => {
    expect(applyRounding(2_345_100, { mode: "up", stepIdr: 5000 })).toBe(2_350_000);
  });

  it("none returns the exact amount", () => {
    expect(calculatePrice({ ...odd, rounding: { mode: "none", stepIdr: 1000 } }).totalIdr).toBe(2_344_964);
  });
});

describe("calculatePrice: worst-case sizes", () => {
  it("handles a tiny weight (0,1 g)", () => {
    const result = calculatePrice({
      weightG: 0.1,
      pricePerGramIdr: 2_000_000,
      labourFee: { type: "per_gram", value: 150_000 },
      rounding: DEFAULT_ROUNDING,
    });
    expect(result.weightMg).toBe(100);
    expect(result.goldValueIdr).toBe(200_000);
    expect(result.labourFeeIdr).toBe(15_000);
    expect(result.totalIdr).toBe(215_000);
  });

  it("handles the smallest weight the database can store (0,001 g)", () => {
    const result = calculatePrice({
      weightG: 0.001,
      pricePerGramIdr: 2_000_000,
      labourFee: { type: "fixed", value: 0 },
      rounding: DEFAULT_ROUNDING,
    });
    expect(result.goldValueIdr).toBe(2_000);
  });

  it("handles Rp 100 juta+ without losing a Rupiah", () => {
    const result = calculatePrice({
      weightG: 75.125,
      pricePerGramIdr: 2_000_000,
      labourFee: { type: "percent", value: 12.5 },
      rounding: DEFAULT_ROUNDING,
    });
    expect(result.goldValueIdr).toBe(150_250_000);
    expect(result.labourFeeIdr).toBe(18_781_250);
    expect(result.totalIdr).toBe(169_032_000);
  });

  it("is not affected by binary floating point (0,1 + 0,2 style weights)", () => {
    const result = calculatePrice({
      weightG: 0.3,
      pricePerGramIdr: 1_999_999,
      labourFee: { type: "fixed", value: 0 },
      rounding: { mode: "none", stepIdr: 1 },
    });
    // 300 mg × 1.999.999 / 1000 = 599.999,7 → 600.000
    expect(result.goldValueIdr).toBe(600_000);
  });
});

describe("calculatePrice: invalid input is rejected, never guessed", () => {
  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("rejects weight %s", (weightG) => {
    expect(() => calculatePrice({ ...base, weightG })).toThrow(RangeError);
  });

  it("rejects an empty or non-numeric weight string", () => {
    expect(() => calculatePrice({ ...base, weightG: "" })).toThrow(RangeError);
    expect(() => calculatePrice({ ...base, weightG: "abc" })).toThrow(RangeError);
  });

  it("rejects more than 3 decimals of weight", () => {
    expect(() => gramsToMilligrams(1.2345)).toThrow(RangeError);
  });

  it.each([0, -5, 1_500_000.5])("rejects price per gram %s", (pricePerGramIdr) => {
    expect(() => calculatePrice({ ...base, pricePerGramIdr })).toThrow(RangeError);
  });

  it("rejects a negative labour fee", () => {
    expect(() => calculatePrice({ ...base, labourFee: { type: "fixed", value: -1 } })).toThrow(RangeError);
  });

  it("rejects a zero rounding step", () => {
    expect(() => calculatePrice({ ...base, rounding: { mode: "up", stepIdr: 0 } })).toThrow(RangeError);
  });
});
