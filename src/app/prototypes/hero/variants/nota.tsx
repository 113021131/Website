"use client";

/**
 * Direction 3 — "Nota". Axis: do something.
 * The hero is a working slip modelled on the surat emas: pick a karat, type a
 * weight, get an estimate, send it to the shop on WhatsApp.
 */
import { useId, useState } from "react";
import { fill } from "@/i18n";
import { formatIdr, formatWeight, parseWeightInput } from "@/lib/format";
import { calculatePrice } from "@/lib/pricing/calculate";
import { cn } from "@/lib/utils";
import { CategorySection, PriceNotices, SiteHeader, WhatsAppButton } from "../shared";
import type { VariantProps } from "../types";

function Leader() {
  return <span aria-hidden="true" className="border-nota-leader mb-1 flex-1 border-b-2 border-dotted" />;
}

export function Nota({ data }: VariantProps) {
  const { t, rows } = data;
  const e = t.home.estimator;

  const defaultKarat = rows.find((row) => row.karatCode === "22K")?.karatCode ?? rows[0]?.karatCode ?? "";
  const [karat, setKarat] = useState(defaultKarat);
  const [weightText, setWeightText] = useState("");
  const groupName = useId();
  const weightId = useId();
  const hintId = useId();

  const selected = rows.find((row) => row.karatCode === karat);
  const weightG = parseWeightInput(weightText);
  const hasError = weightText.trim() !== "" && weightG === null;

  const estimate =
    selected && weightG !== null
      ? calculatePrice({
          weightG,
          pricePerGramIdr: selected.sellIdr,
          labourFee: { type: "fixed", value: 0 },
          rounding: data.rounding,
        })
      : null;

  const message =
    estimate && selected && weightG !== null
      ? fill(t.whatsappMessage.estimate, {
          brand: data.brand,
          karat: selected.karatCode,
          weight: formatWeight(weightG),
          amount: formatIdr(estimate.totalIdr),
          updated: data.updatedLabel ?? "",
        })
      : fill(t.whatsappMessage.price, { brand: data.brand });

  return (
    <div>
      <div className="bg-surface-muted">
        <SiteHeader brand={data.brand} t={t} />

        <section className="page-gutter mx-auto grid w-full max-w-[72rem] gap-x-14 gap-y-5 pt-3 pb-10 md:grid-cols-[1fr_26rem] md:items-start md:pt-12 md:pb-16">
          <div>
            <h1 className="max-w-[16ch] text-[1.875rem] font-semibold md:text-[3rem]">{e.title}</h1>
            <p className="text-muted-foreground mt-3 max-w-[30rem] md:text-lg">{e.lead}</p>
          </div>

          <div className="border-t-brand rounded-sm border border-t-4 bg-background p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <h2 className="text-lg font-semibold">{e.panelTitle}</h2>
              {data.updatedLabel ? (
                <p className="price border-gold-ink text-gold-ink rounded-sm border px-2 py-0.5 text-xs font-semibold">
                  {t.price.updated} {data.updatedLabel}
                </p>
              ) : null}
            </div>

            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">{e.karatLabel}</legend>
              <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                {rows.map((row) => (
                  <label key={row.karatCode} className="relative">
                    <input
                      type="radio"
                      name={groupName}
                      value={row.karatCode}
                      checked={row.karatCode === karat}
                      onChange={() => setKarat(row.karatCode)}
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "font-display border-input flex h-12 items-center justify-center rounded-md border text-base font-semibold",
                        "peer-checked:border-brand peer-checked:bg-brand peer-checked:text-brand-foreground",
                        "peer-focus-visible:outline-ring peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
                      )}
                    >
                      {row.karatCode}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {selected ? (
              <dl className="mt-4 space-y-2">
                <div className="flex items-end gap-2">
                  <dt>{t.price.sell}</dt>
                  <Leader />
                  <dd className="price font-semibold">
                    {formatIdr(selected.sellIdr)}
                    <span className="text-muted-foreground text-sm font-normal"> {t.price.perGramShort}</span>
                  </dd>
                </div>
                <div className="flex items-end gap-2">
                  <dt>{t.price.buyback}</dt>
                  <Leader />
                  <dd className="price font-semibold">
                    {formatIdr(selected.buybackIdr)}
                    <span className="text-muted-foreground text-sm font-normal"> {t.price.perGramShort}</span>
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground mt-4">{t.price.empty}</p>
            )}

            <div className="mt-5">
              <label htmlFor={weightId} className="text-sm font-semibold">
                {e.weightLabel}
              </label>
              <input
                id={weightId}
                name="berat"
                inputMode="decimal"
                autoComplete="off"
                enterKeyHint="done"
                value={weightText}
                onChange={(event) => setWeightText(event.target.value)}
                aria-describedby={hintId}
                aria-invalid={hasError}
                className={cn(
                  "price border-input mt-1.5 block h-12 w-full rounded-md border bg-background px-3 text-lg font-semibold",
                  "focus-visible:border-brand",
                  hasError && "border-destructive",
                )}
              />
              <p id={hintId} className={cn("mt-1.5 text-sm", hasError ? "text-destructive" : "text-muted-foreground")}>
                {hasError ? e.weightError : e.weightHint}
              </p>
            </div>

            <div className="mt-4 border-t-2 border-dashed pt-4" aria-live="polite">
              <p className="text-sm font-semibold">{e.result}</p>
              {estimate && selected && weightG !== null ? (
                <>
                  <p className="font-display price mt-0.5 text-[2.25rem] leading-10 font-semibold">
                    {formatIdr(estimate.totalIdr)}
                  </p>
                  <p className="price text-muted-foreground mt-1 text-sm">
                    {formatWeight(weightG)} × {formatIdr(selected.sellIdr)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">{e.excludes}</p>
                </>
              ) : (
                <p className="text-muted-foreground mt-1 flex min-h-10 items-center">{e.resultEmpty}</p>
              )}
            </div>

            <WhatsAppButton
              number={data.whatsappNumber}
              message={message}
              label={t.cta.whatsapp}
              missingLabel={t.cta.whatsappMissing}
              className="mt-4 w-full"
            />

            <div className="mt-3">
              <PriceNotices data={data} />
            </div>
          </div>
        </section>
      </div>

      <CategorySection t={t} />
    </div>
  );
}
