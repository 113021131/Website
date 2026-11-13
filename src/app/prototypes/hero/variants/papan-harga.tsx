"use client";

/**
 * Direction 1 — "Papan Harga". Axis: information first.
 * The hero IS the shop's price board: every karat, both prices, no scrolling.
 */
import { fill } from "@/i18n";
import { formatIdrPlain } from "@/lib/format";
import { buttonBase, CategorySection, PriceNotices, SiteHeader, WhatsAppButton } from "../shared";
import type { VariantProps } from "../types";

export function PapanHarga({ data }: VariantProps) {
  const { t, rows } = data;

  return (
    <div>
      <div className="on-dark bg-board text-board-foreground">
        <SiteHeader brand={data.brand} t={t} tone="dark" />

        <section className="page-gutter mx-auto grid w-full max-w-[72rem] gap-x-14 pt-3 pb-8 md:grid-cols-2 md:pt-12 md:pb-16">
          <div>
            <h1 className="text-[1.875rem] font-semibold md:text-[2.5rem]">{t.price.title}</h1>
            {data.updatedLabel ? (
              <p className="price text-board-accent mt-1.5 text-sm">
                {t.price.updated}: {data.updatedLabel}
              </p>
            ) : null}
            <p className="text-board-muted mt-4 hidden max-w-[28rem] text-lg md:block">{t.home.board.lead}</p>
          </div>

          <div className="mt-4 md:row-span-2 md:mt-0">
            <table className="w-full border-collapse">
              <caption className="sr-only">
                {t.price.title}, {t.price.perGram}
              </caption>
              <thead>
                <tr className="text-board-muted text-[0.8125rem]">
                  <th scope="col" className="pb-2 text-left font-medium">
                    {t.price.karat}
                  </th>
                  <th scope="col" className="pb-2 text-right font-medium">
                    {t.price.sell}
                  </th>
                  <th scope="col" className="pb-2 text-right font-medium">
                    {t.price.buyback}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.karatCode} className="border-board-rule border-t">
                    <th scope="row" className="font-display text-board-accent h-[2.875rem] text-left text-xl font-semibold">
                      {row.karatCode}
                    </th>
                    <td className="price text-right text-lg font-semibold">{formatIdrPlain(row.sellIdr)}</td>
                    <td className="price text-board-muted text-right text-lg">{formatIdrPlain(row.buybackIdr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-board-muted border-board-rule border-t pt-2 text-xs">{t.price.unit}</p>
          </div>

          <div className="mt-5 space-y-4 md:mt-8 md:self-end">
            <div className="flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton
                number={data.whatsappNumber}
                message={fill(t.whatsappMessage.price, { brand: data.brand })}
                label={t.cta.whatsapp}
                missingLabel={t.cta.whatsappMissing}
              />
              <a href="#kategori" className={`${buttonBase} border-board-accent hover:bg-brand-hover border`}>
                {t.cta.jewellery}
              </a>
            </div>
            <PriceNotices data={data} tone="dark" />
            <p className="text-board-muted md:hidden">{t.home.board.lead}</p>
          </div>
        </section>
      </div>

      <CategorySection t={t} />
    </div>
  );
}
