"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { buttonPrimary, buttonSecondary, fieldHint, fieldInput, fieldLabel } from "@/components/ui/styles";
import type { Dictionary } from "@/i18n";
import { formatIdr, formatIdrPlain } from "@/lib/format";
import { calculatePrice, type LabourFee, type Rounding } from "@/lib/pricing/calculate";
import { derivePriceBoard, effectiveReference, type DerivedPrice } from "@/lib/pricing/reference";
import { savePricing } from "./actions";

export type PricingFormKarat = {
  id: number;
  code: string;
  purityPercent: number | null;
  buybackPercent: number | null;
  sellIdr: number | null;
  buybackIdr: number | null;
};

export type PricingFormProduct = {
  id: number;
  name: string;
  karatCode: string;
  weightG: number;
  labourFee: LabourFee;
  materialCostIdr: number;
  markupPercent: number | null;
  manualPriceIdr: number | null;
  nowIdr: number | null;
};

type Initial = {
  benchmarkIdr: number;
  adjustmentPercent: number;
  source: string;
  sourceUrl: string;
  retrievedAt: string;
  simulated: boolean;
  perGramStepIdr: number;
  defaultMarkupPercent: number;
  taxPercent: number;
  buybackPercent: number;
  buybackDeductionIdr: number;
};

const digits = (value: string) =>
  value
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 10);
const showAmount = (value: string) => (value === "" ? "" : formatIdrPlain(Number(value)));
const percentText = (value: number | null) => (value === null ? "" : String(value).replace(".", ","));

/** "1,5" or "-2" → number; null when the text is not a number. */
function parsePercent(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (!/^-?\d{1,3}(\.\d{1,3})?$/.test(trimmed)) return null;
  return Number(trimmed);
}

const panel = "bg-card rounded-md border p-[min(1rem,5vw)] md:p-5";

export function PricingForm({
  canEdit,
  initial,
  karats,
  products,
  rounding,
  t,
}: {
  canEdit: boolean;
  initial: Initial;
  karats: PricingFormKarat[];
  products: PricingFormProduct[];
  rounding: Rounding;
  t: Dictionary["admin"]["pricing"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [benchmark, setBenchmark] = useState(String(initial.benchmarkIdr));
  const [adjustment, setAdjustment] = useState(percentText(initial.adjustmentPercent));
  const [source, setSource] = useState(initial.source);
  const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl);
  const [simulated, setSimulated] = useState(initial.simulated);
  const [step, setStep] = useState(String(initial.perGramStepIdr));
  const [markup, setMarkup] = useState(percentText(initial.defaultMarkupPercent));
  const [tax, setTax] = useState(percentText(initial.taxPercent));
  const [buyback, setBuyback] = useState(percentText(initial.buybackPercent));
  const [deduction, setDeduction] = useState(String(initial.buybackDeductionIdr));
  const [purity, setPurity] = useState<Record<number, string>>(() =>
    Object.fromEntries(karats.map((karat) => [karat.id, percentText(karat.purityPercent)])),
  );
  const [karatBuyback, setKaratBuyback] = useState<Record<number, string>>(() =>
    Object.fromEntries(karats.map((karat) => [karat.id, percentText(karat.buybackPercent)])),
  );
  const [warnings, setWarnings] = useState<string[] | null>(null);
  const [error, setError] = useState("");

  const changed =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setWarnings(null);
      setter(value);
    };

  // Everything below is recalculated on every keystroke from the same functions the site uses.
  const values = {
    benchmarkIdr: Number(benchmark),
    adjustmentPercent: parsePercent(adjustment),
    perGramStepIdr: Number(step),
    defaultMarkupPercent: parsePercent(markup),
    taxPercent: parsePercent(tax),
    buybackPercent: parsePercent(buyback),
    buybackDeductionIdr: Number(deduction || "0"),
  };
  const karatValues = karats.map((karat) => ({
    id: karat.id,
    code: karat.code,
    purityPercent: parsePercent(purity[karat.id] ?? ""),
    buybackPercent: (karatBuyback[karat.id] ?? "").trim() === "" ? null : parsePercent(karatBuyback[karat.id]),
    buybackInvalid: (karatBuyback[karat.id] ?? "").trim() !== "" && parsePercent(karatBuyback[karat.id]) === null,
  }));

  let referenceIdr: number | null = null;
  let derived: DerivedPrice[] = [];
  try {
    if (values.adjustmentPercent !== null && values.buybackPercent !== null) {
      referenceIdr = effectiveReference(values.benchmarkIdr, values.adjustmentPercent, values.perGramStepIdr);
      derived = derivePriceBoard(
        referenceIdr,
        karatValues.map((karat) => ({
          code: karat.code,
          purityPercent: karat.purityPercent,
        })),
        {
          buybackPercent: values.buybackPercent,
          buybackPercentByKarat: Object.fromEntries(
            karatValues.flatMap((karat) => (karat.buybackPercent !== null ? [[karat.code, karat.buybackPercent]] : [])),
          ),
          perGramStepIdr: values.perGramStepIdr,
        },
      );
    }
  } catch {
    referenceIdr = null;
    derived = [];
  }

  function previewPrice(product: PricingFormProduct): number | null {
    if (product.manualPriceIdr !== null) return product.manualPriceIdr;
    const row = derived.find((entry) => entry.karatCode === product.karatCode);
    if (!row || values.defaultMarkupPercent === null || values.taxPercent === null) return null;
    try {
      return calculatePrice({
        weightG: product.weightG,
        pricePerGramIdr: row.sellIdr,
        labourFee: product.labourFee,
        materialCostIdr: product.materialCostIdr,
        markupPercent: product.markupPercent ?? values.defaultMarkupPercent,
        taxPercent: values.taxPercent,
        rounding,
      }).totalIdr;
    } catch {
      return null;
    }
  }

  function submit(confirmed: boolean) {
    const invalid =
      referenceIdr === null ||
      values.adjustmentPercent === null ||
      values.defaultMarkupPercent === null ||
      values.taxPercent === null ||
      values.buybackPercent === null ||
      karatValues.some((karat) => karat.purityPercent === null || karat.purityPercent <= 0 || karat.buybackInvalid);
    if (invalid) {
      setError(t.invalid);
      return;
    }
    setError("");

    startTransition(async () => {
      const result = await savePricing({
        confirmed,
        benchmarkIdr: values.benchmarkIdr,
        adjustmentPercent: values.adjustmentPercent ?? 0,
        source: source.trim(),
        sourceUrl: sourceUrl.trim(),
        simulated,
        perGramStepIdr: values.perGramStepIdr,
        defaultMarkupPercent: values.defaultMarkupPercent ?? 0,
        taxPercent: values.taxPercent ?? 0,
        buybackPercent: values.buybackPercent ?? 0,
        buybackDeductionIdr: values.buybackDeductionIdr,
        karats: karatValues.map((karat) => ({
          id: karat.id,
          purityPercent: karat.purityPercent ?? 0,
          buybackPercent: karat.buybackPercent,
        })),
      });
      if (result.status === "confirm") {
        setWarnings(result.warnings);
      } else if (result.status === "saved") {
        setWarnings(null);
        toast.success(result.message);
        router.refresh();
      } else if (result.status === "unchanged") {
        setWarnings(null);
        toast.info(result.message);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit(false);
      }}
      className="space-y-4"
    >
      {/* min-w-0: a fieldset is otherwise as wide as its widest table, which pushes the page sideways on a phone. */}
      <fieldset disabled={!canEdit || pending} className="min-w-0 space-y-4">
        <section className={panel} aria-labelledby="pricing-reference">
          <h2 id="pricing-reference" className="text-lg font-semibold">
            {t.referenceTitle}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pricing-benchmark" className={fieldLabel}>
                {t.benchmark}
              </label>
              <input
                id="pricing-benchmark"
                inputMode="numeric"
                autoComplete="off"
                value={showAmount(benchmark)}
                onChange={(event) => changed(setBenchmark)(digits(event.target.value))}
                className={`${fieldInput} price text-lg font-semibold`}
              />
              <p className={fieldHint}>{t.benchmarkHint}</p>
            </div>
            <div>
              <label htmlFor="pricing-adjustment" className={fieldLabel}>
                {t.adjustment}
              </label>
              <input
                id="pricing-adjustment"
                inputMode="decimal"
                autoComplete="off"
                value={adjustment}
                onChange={(event) => changed(setAdjustment)(event.target.value)}
                className={fieldInput}
              />
              <p className={fieldHint}>{t.adjustmentHint}</p>
            </div>
          </div>
          <p className="border-gold mt-4 flex flex-wrap items-baseline justify-between gap-x-4 border-l-2 pl-3">
            <span className="font-semibold">{t.effective}</span>
            <output
              htmlFor="pricing-benchmark pricing-adjustment"
              className="price font-display text-2xl font-semibold"
            >
              {referenceIdr !== null ? `${formatIdr(referenceIdr)}/gram` : "–"}
            </output>
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pricing-source" className={fieldLabel}>
                {t.source}
              </label>
              <input
                id="pricing-source"
                maxLength={200}
                autoComplete="off"
                value={source}
                onChange={(event) => changed(setSource)(event.target.value)}
                className={fieldInput}
              />
            </div>
            <div>
              <label htmlFor="pricing-source-url" className={fieldLabel}>
                {t.sourceUrl}
              </label>
              <input
                id="pricing-source-url"
                type="url"
                inputMode="url"
                maxLength={500}
                autoComplete="off"
                value={sourceUrl}
                onChange={(event) => changed(setSourceUrl)(event.target.value)}
                className={fieldInput}
              />
            </div>
          </div>
          {initial.retrievedAt ? (
            <p className={fieldHint}>
              {t.retrievedAt}: {initial.retrievedAt}
            </p>
          ) : null}
          <label className="mt-3 flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={simulated}
              onChange={(event) => changed(setSimulated)(event.target.checked)}
              className="size-5 shrink-0"
            />
            <span>{t.simulated}</span>
          </label>
        </section>

        <section className={panel} aria-labelledby="pricing-purity">
          <h2 id="pricing-purity" className="text-lg font-semibold">
            {t.purityTitle}
          </h2>
          <p className={fieldHint}>{t.purityLead}</p>
          <div tabIndex={0} role="region" aria-labelledby="pricing-purity" className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[30rem] border-collapse text-sm">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Kadar
                  </th>
                  <th scope="col" className="px-2 py-2 font-medium">
                    {t.purityColumn}
                  </th>
                  <th scope="col" className="px-2 py-2 font-medium">
                    {t.buybackPercentColumn}
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">
                    {t.sellColumn}
                  </th>
                  <th scope="col" className="py-2 pl-2 text-right font-medium">
                    {t.buybackColumn}
                  </th>
                </tr>
              </thead>
              <tbody>
                {karats.map((karat) => {
                  const row = derived.find((entry) => entry.karatCode === karat.code);
                  return (
                    <tr key={karat.id} className="border-t">
                      <th scope="row" className="font-display py-2 pr-3 text-left text-lg font-semibold">
                        {karat.code}
                      </th>
                      <td className="px-2 py-2">
                        <input
                          aria-label={`${t.purityColumn} ${karat.code}`}
                          inputMode="decimal"
                          autoComplete="off"
                          value={purity[karat.id] ?? ""}
                          onChange={(event) =>
                            changed(setPurity)({
                              ...purity,
                              [karat.id]: event.target.value,
                            })
                          }
                          className={`${fieldInput} mt-0 w-24`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          aria-label={`${t.buybackPercentColumn} ${karat.code}`}
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder={buyback}
                          value={karatBuyback[karat.id] ?? ""}
                          onChange={(event) =>
                            changed(setKaratBuyback)({
                              ...karatBuyback,
                              [karat.id]: event.target.value,
                            })
                          }
                          className={`${fieldInput} mt-0 w-24`}
                        />
                      </td>
                      <td className="price px-2 py-2 text-right font-semibold">
                        {row ? formatIdrPlain(row.sellIdr) : "–"}
                        {karat.sellIdr !== null && row && karat.sellIdr !== row.sellIdr ? (
                          <span className="text-muted-foreground block text-xs font-normal line-through">
                            {formatIdrPlain(karat.sellIdr)}
                          </span>
                        ) : null}
                      </td>
                      <td className="price py-2 pl-2 text-right">
                        {row ? formatIdrPlain(row.buybackIdr) : "–"}
                        {karat.buybackIdr !== null && row && karat.buybackIdr !== row.buybackIdr ? (
                          <span className="text-muted-foreground block text-xs line-through">
                            {formatIdrPlain(karat.buybackIdr)}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className={panel} aria-labelledby="pricing-rules">
          <h2 id="pricing-rules" className="text-lg font-semibold">
            {t.rulesTitle}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pricing-markup" className={fieldLabel}>
                {t.markup}
              </label>
              <input
                id="pricing-markup"
                inputMode="decimal"
                autoComplete="off"
                value={markup}
                onChange={(event) => changed(setMarkup)(event.target.value)}
                className={fieldInput}
              />
              <p className={fieldHint}>{t.markupHint}</p>
            </div>
            <div>
              <label htmlFor="pricing-tax" className={fieldLabel}>
                {t.tax}
              </label>
              <input
                id="pricing-tax"
                inputMode="decimal"
                autoComplete="off"
                value={tax}
                onChange={(event) => changed(setTax)(event.target.value)}
                className={fieldInput}
              />
              <p className={fieldHint}>{t.taxHint}</p>
            </div>
            <div>
              <label htmlFor="pricing-buyback" className={fieldLabel}>
                {t.buybackPercent}
              </label>
              <input
                id="pricing-buyback"
                inputMode="decimal"
                autoComplete="off"
                value={buyback}
                onChange={(event) => changed(setBuyback)(event.target.value)}
                className={fieldInput}
              />
            </div>
            <div>
              <label htmlFor="pricing-deduction" className={fieldLabel}>
                {t.buybackDeduction}
              </label>
              <input
                id="pricing-deduction"
                inputMode="numeric"
                autoComplete="off"
                value={showAmount(deduction)}
                onChange={(event) => changed(setDeduction)(digits(event.target.value))}
                className={`${fieldInput} price`}
              />
            </div>
            <div>
              <label htmlFor="pricing-step" className={fieldLabel}>
                {t.step}
              </label>
              <select
                id="pricing-step"
                value={step}
                onChange={(event) => changed(setStep)(event.target.value)}
                className={`${fieldInput} appearance-auto`}
              >
                {[1, 100, 500, 1000, 5000].map((option) => (
                  <option key={option} value={option}>
                    {formatIdrPlain(option)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className={fieldLabel}>{t.labour}</p>
              <p className={fieldHint}>{t.labourHint}</p>
            </div>
          </div>
        </section>
      </fieldset>

      {products.length > 0 ? (
        <section className={panel} aria-labelledby="pricing-preview">
          <h2 id="pricing-preview" className="text-lg font-semibold">
            {t.previewTitle}
          </h2>
          <p className={fieldHint}>{t.previewLead}</p>
          <div tabIndex={0} role="region" aria-labelledby="pricing-preview" className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[26rem] border-collapse text-sm">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    {t.previewProduct}
                  </th>
                  <th scope="col" className="px-2 py-2 text-right font-medium">
                    {t.previewNow}
                  </th>
                  <th scope="col" className="py-2 pl-2 text-right font-medium">
                    {t.previewAfter}
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const after = previewPrice(product);
                  return (
                    <tr key={product.id} className="border-t">
                      <th scope="row" className="py-2 pr-3 text-left font-normal">
                        {product.name}
                        <span className="text-muted-foreground block text-xs">{product.karatCode}</span>
                      </th>
                      <td className="price px-2 py-2 text-right">
                        {product.nowIdr !== null ? formatIdrPlain(product.nowIdr) : "–"}
                      </td>
                      <td className="price py-2 pl-2 text-right font-semibold">
                        {after !== null ? formatIdrPlain(after) : "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <p role="alert" className="text-destructive min-h-6 text-sm">
        {error}
      </p>

      {!canEdit ? (
        <p className="bg-notice text-notice-foreground rounded-sm px-3 py-2">{t.ownerOnly}</p>
      ) : warnings ? (
        <div
          role="alertdialog"
          aria-labelledby="pricing-confirm"
          tabIndex={-1}
          ref={(element) => element?.focus()}
          className="bg-notice text-notice-foreground rounded-md p-4"
        >
          <h2 id="pricing-confirm" className="text-lg font-semibold">
            {t.confirmTitle}
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="button" disabled={pending} onClick={() => submit(true)} className={buttonPrimary}>
              {pending ? t.saving : t.confirm}
            </button>
            <button type="button" disabled={pending} onClick={() => setWarnings(null)} className={buttonSecondary}>
              {t.cancel}
            </button>
          </div>
        </div>
      ) : (
        <button type="submit" disabled={pending} className={`${buttonPrimary} w-full sm:w-auto`}>
          {pending ? t.saving : t.save}
        </button>
      )}
    </form>
  );
}
