import { describe, expect, it } from "vitest";
import { calculatePrice, DEFAULT_ROUNDING } from "@/lib/pricing/calculate";
import {
  buybackPerGram,
  calculateBuyback,
  DEFAULT_PURITY_PERCENT,
  derivePriceBoard,
  effectiveReference,
  perGramFromReference,
} from "@/lib/pricing/reference";
import { buybackRule, DEFAULT_PRICING_SETTINGS, readPricingSettings, referenceStatus } from "@/lib/pricing/settings";

const REFERENCE = 2_298_000;
const rule = buybackRule(DEFAULT_PRICING_SETTINGS);

describe("24K reference", () => {
  it("applies the manual adjustment and rounds to the step", () => {
    expect(effectiveReference(2_298_000, 0, 1000)).toBe(2_298_000);
    expect(effectiveReference(2_298_000, 1.5, 1000)).toBe(2_332_000); // 2.332.470
    expect(effectiveReference(2_522_000, -8.9, 1000)).toBe(2_298_000); // 2.297.542
  });

  it("rejects an adjustment outside −50 … 50 %", () => {
    expect(() => effectiveReference(2_298_000, 60, 1000)).toThrow(RangeError);
  });
});

describe("price per gram from purity", () => {
  it.each([
    ["24K", 2_296_000], // 2.295.702
    ["22K", 2_105_000], // 2.104.968
    ["21K", 2_011_000], // 2.010.750
    ["18K", 1_724_000], // 1.723.500 rounds half up
    ["17K", 1_627_000], // 1.626.984
    ["14K", 1_344_000], // 1.344.330
    ["10K", 958_000], // 958.266
  ])("%s", (code, expected) => {
    expect(perGramFromReference(REFERENCE, DEFAULT_PURITY_PERCENT[code], 1000)).toBe(expected);
  });

  it("follows the reference: +10 % reference gives +10 % per gram, within one step", () => {
    const before = perGramFromReference(2_000_000, 75, 1000);
    const after = perGramFromReference(2_200_000, 75, 1000);
    expect(before).toBe(1_500_000);
    expect(after).toBe(1_650_000);
  });

  it("derives the whole board and skips karats without a purity", () => {
    const board = derivePriceBoard(
      REFERENCE,
      [
        { code: "24K", purityPercent: 99.9 },
        { code: "18K", purityPercent: 75 },
        { code: "9K", purityPercent: null },
        { code: "REF", purityPercent: 100 },
      ],
      rule,
    );
    expect(board).toEqual([
      {
        karatCode: "24K",
        purityPercent: 99.9,
        sellIdr: 2_296_000,
        buybackIdr: 2_181_000,
      }, // 95 %
      {
        karatCode: "18K",
        purityPercent: 75,
        sellIdr: 1_724_000,
        buybackIdr: 1_552_000,
      }, // 90 %
    ]);
  });
});

describe("buyback", () => {
  it("is a percentage of the per-gram price", () => {
    expect(buybackPerGram(1_724_000, 90, 1000)).toBe(1_552_000); // 1.551.600
  });

  it("is weight × buyback per gram − deductions, rounded down", () => {
    const result = calculateBuyback({
      weightG: 3.2,
      buybackPerGramIdr: 1_552_000,
      deductionIdr: 50_000,
    });
    expect(result.grossIdr).toBe(4_966_400);
    expect(result.totalIdr).toBe(4_916_000);
  });

  it("never goes below zero", () => {
    expect(
      calculateBuyback({
        weightG: 0.1,
        buybackPerGramIdr: 958_000,
        deductionIdr: 500_000,
      }).totalIdr,
    ).toBe(0);
  });
});

describe("retail estimate with material, markup and tax", () => {
  const base = {
    weightG: 3.2,
    pricePerGramIdr: 1_724_000,
    labourFee: { type: "fixed", value: 650_000 } as const,
    rounding: DEFAULT_ROUNDING,
  };

  it("adds each part once", () => {
    const result = calculatePrice({
      ...base,
      materialCostIdr: 150_000,
      markupPercent: 8,
    });
    expect(result.goldValueIdr).toBe(5_516_800);
    expect(result.labourFeeIdr).toBe(650_000);
    expect(result.materialCostIdr).toBe(150_000);
    expect(result.markupIdr).toBe(505_344); // 8 % of 6.316.800
    expect(result.taxIdr).toBe(0);
    expect(result.subtotalIdr).toBe(6_822_144);
    expect(result.totalIdr).toBe(6_823_000);
    expect(result.goldValueIdr + result.labourFeeIdr + result.materialCostIdr + result.markupIdr + result.taxIdr).toBe(
      result.subtotalIdr,
    );
  });

  it("charges tax on the amount including markup", () => {
    const result = calculatePrice({
      ...base,
      markupPercent: 10,
      taxPercent: 1.1,
    });
    expect(result.markupIdr).toBe(616_680);
    expect(result.taxIdr).toBe(74_618); // 1,1 % of 6.783.480
  });

  it("is unchanged from the plain formula when the new parts are left out", () => {
    const result = calculatePrice(base);
    expect(result.subtotalIdr).toBe(6_166_800);
    expect(result.markupIdr + result.taxIdr + result.materialCostIdr).toBe(0);
  });
});

describe("pricing settings", () => {
  it("falls back to the defaults for a missing or empty value", () => {
    expect(readPricingSettings(undefined)).toEqual(DEFAULT_PRICING_SETTINGS);
    expect(readPricingSettings({})).toEqual(DEFAULT_PRICING_SETTINGS);
  });

  it("keeps valid fields and replaces invalid ones", () => {
    const settings = readPricingSettings({
      benchmarkIdr: 2_400_000,
      buybackPercent: 140,
      simulated: false,
    });
    expect(settings.benchmarkIdr).toBe(2_400_000);
    expect(settings.buybackPercent).toBe(DEFAULT_PRICING_SETTINGS.buybackPercent);
    expect(settings.simulated).toBe(false);
  });

  it("labels the reference", () => {
    expect(referenceStatus(true, true)).toBe("demo");
    expect(referenceStatus(false, true)).toBe("outdated");
    expect(referenceStatus(false, false)).toBe("current");
  });
});
