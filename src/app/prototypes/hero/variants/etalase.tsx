"use client";

/**
 * Direction 2 — "Etalase". Axis: jewellery first.
 * A slim price strip opens the page; the hero sells the collection on a velvet tray.
 */
import { useId, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { fill } from "@/i18n";
import { formatIdr, formatIdrPlain, formatWeight } from "@/lib/format";
import { calculatePrice } from "@/lib/pricing/calculate";
import { cn } from "@/lib/utils";
import { buttonBase, CategorySection, JewelArt, PriceNotices, SiteHeader, WhatsAppButton, type JewelKind } from "../shared";
import type { HeroData, VariantProps } from "../types";

/** Stand-in items so the tray can be judged. Phase 1 replaces these with DEMO products from the database. */
const SAMPLE_ITEMS: { kind: JewelKind; name: string; karat: string; weightG: number }[] = [
  { kind: "cincin", name: "Cincin Polos", karat: "22K", weightG: 3.5 },
  { kind: "kalung", name: "Kalung Rantai dengan Liontin Bulat", karat: "24K", weightG: 10 },
  { kind: "gelang", name: "Gelang Anak", karat: "18K", weightG: 2.25 },
  { kind: "anting", name: "Anting Bulat", karat: "17K", weightG: 1.2 },
];

function PriceStrip({ data }: { data: HeroData }) {
  const { t, rows } = data;
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="bg-strip border-strip-border border-b">
      <div className="page-gutter mx-auto w-full max-w-[72rem] py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm leading-tight font-semibold">
              {t.price.sell} {t.price.perGram}
            </p>
            {data.updatedLabel ? (
              <p className="price text-muted-foreground text-xs">
                {t.price.updated} {data.updatedLabel}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
            className="text-gold-ink -mr-2 inline-flex h-11 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-semibold"
          >
            {open ? t.price.hideAll : t.price.showAll}
            <ChevronDownIcon className={cn("size-4", open && "rotate-180")} aria-hidden="true" />
          </button>
        </div>

        {open ? null : (
          <ul
            // Focusable so keyboard users can scroll the row with the arrow keys.
            tabIndex={0}
            aria-label={`${t.price.sell} ${t.price.perGram}`}
            className="-mx-4 mt-1.5 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
          >
            {rows.map((row) => (
              <li
                key={row.karatCode}
                className="flex h-9 shrink-0 snap-start items-center gap-2 rounded-sm border bg-background px-3"
              >
                <span className="font-display text-gold-ink font-semibold">{row.karatCode}</span>
                <span className="price font-semibold">{formatIdrPlain(row.sellIdr)}</span>
              </li>
            ))}
          </ul>
        )}

        <div id={panelId} hidden={!open} className="mt-2 pb-2">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              {t.price.title}, {t.price.perGram}
            </caption>
            <thead>
              <tr className="text-muted-foreground text-[0.8125rem]">
                <th scope="col" className="pb-1.5 text-left font-medium">
                  {t.price.karat}
                </th>
                <th scope="col" className="pb-1.5 text-right font-medium">
                  {t.price.sell}
                </th>
                <th scope="col" className="pb-1.5 text-right font-medium">
                  {t.price.buyback}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.karatCode} className="border-strip-border border-t">
                  <th scope="row" className="font-display text-gold-ink h-11 text-left text-lg font-semibold">
                    {row.karatCode}
                  </th>
                  <td className="price text-right font-semibold">{formatIdrPlain(row.sellIdr)}</td>
                  <td className="price text-muted-foreground text-right">{formatIdrPlain(row.buybackIdr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2">
            <PriceNotices data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Etalase({ data }: VariantProps) {
  const { t, rows } = data;

  const items = SAMPLE_ITEMS.map((item) => {
    const price = rows.find((row) => row.karatCode === item.karat);
    const estimate = price
      ? calculatePrice({
          weightG: item.weightG,
          pricePerGramIdr: price.sellIdr,
          labourFee: { type: "per_gram", value: 0 },
          rounding: data.rounding,
        }).totalIdr
      : null;
    return { ...item, estimate };
  });

  return (
    <div>
      <PriceStrip data={data} />
      <SiteHeader brand={data.brand} t={t} />

      <section className="page-gutter mx-auto w-full max-w-[72rem] pt-4 pb-8 md:pt-14 md:pb-12">
        <h1 className="max-w-[20ch] text-[2rem] font-semibold md:text-[3.25rem]">{t.home.showcase.title}</h1>
        <p className="text-muted-foreground mt-3 max-w-[34rem] text-lg">{t.home.showcase.lead}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a href="#kategori" className={`${buttonBase} bg-brand text-brand-foreground hover:bg-brand-hover`}>
            {t.cta.catalog}
          </a>
          <WhatsAppButton
            number={data.whatsappNumber}
            message={fill(t.whatsappMessage.price, { brand: data.brand })}
            label={t.cta.whatsapp}
            missingLabel={t.cta.whatsappMissing}
            variant="outline"
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[72rem] md:px-4" aria-labelledby="tray-title">
        <div className="on-dark bg-tray py-5 md:rounded-xl md:px-2">
          <h2 id="tray-title" className="page-gutter text-board-accent text-lg font-semibold">
            {t.home.showcase.trayTitle}
          </h2>
          <ul
            tabIndex={0}
            aria-labelledby="tray-title"
            className="page-gutter mt-3 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] md:grid md:grid-cols-4"
          >
            {items.map((item) => (
              <li
                key={item.name}
                className="text-foreground flex w-40 shrink-0 snap-start flex-col rounded-lg bg-background p-3 md:w-auto"
              >
                <div className="bg-surface-tint relative flex aspect-[4/5] items-center justify-center rounded-md">
                  <JewelArt kind={item.kind} className="size-20" />
                  <span className="bg-notice text-notice-foreground absolute top-2 left-2 rounded-sm px-1.5 py-0.5 text-xs font-semibold">
                    {t.home.showcase.sample}
                  </span>
                </div>
                {/* The wrapper reserves two lines so prices align; the clamp itself stays exactly two lines tall. */}
                <div className="mt-2.5 min-h-[2.25rem]">
                  <h3 className="line-clamp-2 font-sans text-sm leading-[1.125rem] font-semibold">{item.name}</h3>
                </div>
                <p className="price text-muted-foreground mt-1 text-[0.8125rem]">
                  {item.karat}, {formatWeight(item.weightG)}
                </p>
                {item.estimate !== null ? <p className="price mt-1 font-semibold">{formatIdr(item.estimate)}</p> : null}
              </li>
            ))}
          </ul>
          <p className="page-gutter text-board-muted mt-2 text-xs">{t.price.estimateNote}</p>
        </div>
      </section>

      <CategorySection t={t} />
    </div>
  );
}
