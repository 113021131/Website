"use client";

import { useId, useState } from "react";
import { fieldError, fieldHint, fieldInput, fieldLabel } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { fill, type Dictionary } from "@/i18n";
import type { PriceRow } from "@/lib/data/public";
import { formatIdr, formatWeight, parseWeightInput } from "@/lib/format";
import { calculatePrice, type LabourFeeType, type Rounding } from "@/lib/pricing/calculate";
import { cn } from "@/lib/utils";

type Copy = Pick<Dictionary, "calculator" | "product" | "cta" | "whatsappMessage">;

function parseFee(text: string): number | null {
  if (text.trim() === "") return 0;
  const number = Number(text.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(number) && number >= 0 ? number : null;
}

/**
 * One estimator card.
 *   "buy":  weight × selling price + making fee, rounded by the shop's rule.
 *   "sell": weight × buyback price. No fee and no rounding up: this is money the
 *           customer receives, so the estimate must not overstate it.
 */
export function Estimator({
  mode,
  rows,
  rounding,
  defaultFee,
  brand,
  whatsappNumber,
  t,
}: {
  mode: "buy" | "sell";
  rows: PriceRow[];
  rounding: Rounding;
  defaultFee: { type: LabourFeeType; value: number };
  brand: string;
  whatsappNumber: string | null;
  t: Copy;
}) {
  const c = t.calculator;
  const ids = useId();
  const [karat, setKarat] = useState(rows.find((row) => row.karatCode === "22K")?.karatCode ?? rows[0]?.karatCode ?? "");
  const [weightText, setWeightText] = useState("");
  const [feeType, setFeeType] = useState<LabourFeeType>(defaultFee.type);
  const [feeText, setFeeText] = useState(defaultFee.value > 0 ? String(defaultFee.value) : "");

  const row = rows.find((entry) => entry.karatCode === karat);
  const weightG = parseWeightInput(weightText);
  const weightInvalid = weightText.trim() !== "" && weightG === null;
  const fee = parseFee(feeText);
  const feeInvalid = mode === "buy" && (fee === null || (feeType === "percent" && fee > 100));

  let estimate = null;
  if (row && weightG !== null && !feeInvalid) {
    try {
      estimate = calculatePrice({
        weightG,
        pricePerGramIdr: mode === "buy" ? row.sellIdr : row.buybackIdr,
        labourFee: mode === "buy" ? { type: feeType, value: fee ?? 0 } : { type: "fixed", value: 0 },
        rounding: mode === "buy" ? rounding : { mode: "none", stepIdr: 1 },
      });
    } catch {
      estimate = null;
    }
  }

  const message =
    estimate && row && weightG !== null
      ? fill(mode === "buy" ? c.whatsappBuy : c.whatsappSell, {
          brand,
          karat: row.karatCode,
          weight: formatWeight(weightG),
          amount: formatIdr(estimate.totalIdr),
        })
      : fill(t.whatsappMessage.price, { brand });

  return (
    <section aria-labelledby={`${ids}-title`} className="@container border-t-brand rounded-sm border border-t-4 bg-background p-[min(1rem,5vw)] md:p-6">
      <h2 id={`${ids}-title`} className="text-xl font-semibold">
        {mode === "buy" ? c.buyTab : c.sellTab}
      </h2>

      <fieldset className="mt-4">
        <legend className={fieldLabel}>{c.karat}</legend>
        {/* Equal columns that fit five karats on a 360 px phone and wrap evenly if the shop adds more. */}
        <div className="mt-1.5 grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-1.5">
          {rows.map((entry) => (
            <label key={entry.karatCode} className="relative">
              <input
                type="radio"
                name={`${ids}-karat`}
                value={entry.karatCode}
                checked={entry.karatCode === karat}
                onChange={() => setKarat(entry.karatCode)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "font-display border-input flex min-h-12 items-center justify-center rounded-md border px-2 font-semibold",
                  "peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground",
                  "peer-focus-visible:outline-ring peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
                )}
              >
                {entry.karatCode}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4">
        <label htmlFor={`${ids}-weight`} className={fieldLabel}>
          {c.weight}
        </label>
        <input
          id={`${ids}-weight`}
          name={`${mode}-weight`}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={weightText}
          onChange={(event) => setWeightText(event.target.value)}
          aria-describedby={`${ids}-weight-hint`}
          aria-invalid={weightInvalid || undefined}
          className={`${fieldInput} price text-lg font-semibold`}
        />
        <p id={`${ids}-weight-hint`} className={weightInvalid ? fieldError : fieldHint}>
          {weightInvalid ? c.weightError : c.weightHint}
        </p>
      </div>

      {mode === "buy" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${ids}-fee-type`} className={fieldLabel}>
              {c.feeType}
            </label>
            <select
              id={`${ids}-fee-type`}
              name="fee-type"
              value={feeType}
              onChange={(event) => setFeeType(event.target.value as LabourFeeType)}
              className={fieldInput}
            >
              {Object.entries(c.feeTypes).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${ids}-fee`} className={fieldLabel}>
              {c.feeValue}
            </label>
            <input
              id={`${ids}-fee`}
              name="fee-value"
              inputMode="decimal"
              autoComplete="off"
              value={feeText}
              onChange={(event) => setFeeText(event.target.value)}
              aria-describedby={`${ids}-fee-hint`}
              aria-invalid={feeInvalid || undefined}
              className={`${fieldInput} price`}
            />
          </div>
          <p id={`${ids}-fee-hint`} className={cn(feeInvalid ? fieldError : fieldHint, "mt-0 sm:col-span-2")}>
            {feeInvalid ? c.feeError : c.feeHint}
          </p>
        </div>
      ) : null}

      <div className="mt-4 border-t-2 border-dashed pt-4" aria-live="polite">
        <p className="text-sm font-semibold">{mode === "buy" ? c.resultBuy : c.resultSell}</p>
        {estimate && row && weightG !== null ? (
          <>
            <p className="font-display price price-fit mt-0.5 font-semibold [--price-fit-max:2rem]">{formatIdr(estimate.totalIdr)}</p>
            <dl className="text-muted-foreground mt-2 space-y-1 text-sm">
              <div className="flex flex-wrap justify-between gap-x-3">
                <dt>
                  {t.product.goldValue}{" "}
                  <span className="price">
                    ({formatWeight(weightG)} × {formatIdr(estimate.pricePerGramIdr)})
                  </span>
                </dt>
                <dd className="price">{formatIdr(estimate.goldValueIdr)}</dd>
              </div>
              {mode === "buy" ? (
                <div className="flex flex-wrap justify-between gap-x-3">
                  <dt>{t.product.labour}</dt>
                  <dd className="price">{formatIdr(estimate.labourFeeIdr)}</dd>
                </div>
              ) : null}
              {estimate.roundingAdjustmentIdr !== 0 ? (
                <div className="flex flex-wrap justify-between gap-x-3">
                  <dt>{t.product.rounding}</dt>
                  <dd className="price">{formatIdr(estimate.roundingAdjustmentIdr)}</dd>
                </div>
              ) : null}
            </dl>
          </>
        ) : (
          <p className="text-muted-foreground mt-1 flex min-h-10 items-center">{c.emptyResult}</p>
        )}
        <p className="text-muted-foreground mt-3 text-sm">{mode === "buy" ? c.buyNote : c.sellNote}</p>
      </div>

      <WhatsAppButton
        number={whatsappNumber}
        message={message}
        label={t.cta.whatsapp}
        missingLabel={t.cta.whatsappMissing}
        placement={`calculator_${mode}`}
        variant={mode === "buy" ? "solid" : "outline"}
        className="mt-4 w-full"
      />
    </section>
  );
}
