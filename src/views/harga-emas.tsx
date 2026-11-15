import type { Metadata } from "next";
import type { ViewProps } from "./types";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { PricePageView } from "@/components/page-view";
import { PriceHistoryChart } from "@/components/price/price-history-chart";
import { PriceNotices, PriceTable } from "@/components/price/price-table";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonOnDark, container } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary, localePath } from "@/i18n";
import { roundingFromSettings } from "@/lib/catalog";
import { getPriceHistory } from "@/lib/data/content";
import { getPriceBoard, getPrimaryStore, getSiteSettings } from "@/lib/data/public";
import { formatDateTime, formatIdr, formatWeight } from "@/lib/format";
import { calculatePrice } from "@/lib/pricing/calculate";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

type Props = ViewProps;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary((await params).locale);
  return pageMetadata(t, "/harga-emas", t.pricePage.metaTitle, t.pricePage.metaDescription);
}

/** A ruled line of the worked example: label, dotted leader, value. */
function SlipRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex items-end gap-2 border-t-2 border-dashed pt-2.5" : "flex items-end gap-2"}>
      {/* The dotted leader lives inside the term, so the list stays a valid term/value pair. */}
      <dt className={strong ? "flex flex-1 items-end gap-2 font-semibold" : "flex flex-1 items-end gap-2"}>
        {label}
        <span aria-hidden="true" className="border-nota-leader mb-1.5 min-w-4 flex-1 border-b-2 border-dotted" />
      </dt>
      <dd className={strong ? "font-display price text-xl font-semibold" : "price font-semibold"}>{value}</dd>
    </div>
  );
}

export default async function GoldPricePage({ params }: Props) {
  const t = getDictionary((await params).locale);
  const p = t.pricePage;
  const to = (path: string) => localePath(t.locale, path);
  const [board, store, settings, history] = await Promise.all([
    getPriceBoard(),
    getPrimaryStore(),
    getSiteSettings(),
    getPriceHistory(),
  ]);

  // A worked example from today's real numbers, so the formula is not abstract.
  const exampleRow = board.rows.find((row) => row.karatCode === "22K") ?? board.rows[0];
  const exampleWeight = 3.5;
  const example = exampleRow
    ? calculatePrice({
        weightG: exampleWeight,
        pricePerGramIdr: exampleRow.sellIdr,
        labourFee: { type: "fixed", value: 0 },
        rounding: roundingFromSettings(settings),
      })
    : null;

  return (
    <>
      <PricePageView />
      <JsonLd data={faqJsonLd(p.faq)} />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: t.common.home, path: "/" },
            { name: t.nav.prices, path: "/harga-emas" },
          ],
          t.locale,
        )}
      />

      {/* The price board, on the same maroon surface as the header and the home page. */}
      <div className="on-dark bg-board text-board-foreground">
        <section
          aria-labelledby="price-title"
          className={`${container} grid gap-x-16 pt-3 pb-9 md:grid-cols-[1fr_minmax(0,29rem)] md:items-start md:pt-14 md:pb-16`}
        >
          <div>
            <h1 id="price-title" className="text-[1.875rem] font-semibold md:text-[2.75rem]">
              {t.price.title}
            </h1>
            {board.updatedAt ? (
              <p className="price border-board-accent text-board-accent mt-3 inline-block rounded-sm border px-2.5 py-1 text-sm font-semibold">
                {t.price.updated}:{" "}
                <time dateTime={board.updatedAt}>{formatDateTime(board.updatedAt, board.timeZone, t.locale)}</time>
              </p>
            ) : null}
            <p className="text-board-muted mt-4 hidden max-w-[30rem] text-lg md:block">{p.lead}</p>
          </div>

          <div className="mt-5 md:row-span-2 md:mt-0 md:rounded-lg md:bg-brand-deep md:p-7">
            <PriceTable board={board} t={t} tone="dark" />
          </div>

          <div className="mt-5 max-w-[32rem] space-y-5 md:mt-7">
            <div className="flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton
                number={ownerValue(store.whatsapp)}
                message={fill(t.whatsappMessage.price, { brand: store.name })}
                label={t.cta.whatsapp}
                missingLabel={t.cta.whatsappMissing}
                placement="price_page"
              />
              <Link href={to("/katalog")} className={buttonOnDark}>
                {t.cta.catalog}
              </Link>
            </div>
            <PriceNotices board={board} t={t} tone="dark" />
            <ul className="text-board-muted border-board-rule space-y-1.5 border-t pt-4 text-sm">
              <li>{p.sellExplain}</li>
              <li>{p.buybackExplain}</li>
            </ul>
          </div>
        </section>
      </div>

      <div className={`${container} grid items-start gap-5 py-8 md:py-12 lg:grid-cols-[1.4fr_1fr]`}>
        {history.length > 0 ? <PriceHistoryChart history={history} locale={t.locale} t={t.chart} /> : null}

        {/* How a price is worked out, written like the slip a customer gets in the shop. */}
        <section aria-labelledby="formula-title" className="border-t-brand rounded-sm border border-t-4 bg-background p-4 md:p-6">
          <h2 id="formula-title" className="text-2xl font-semibold">
            {p.formulaTitle}
          </h2>
          <p className="bg-surface-tint mt-4 rounded-sm px-3.5 py-3 font-semibold">{p.formula}</p>

          {example && exampleRow ? (
            <>
              <h3 className="text-muted-foreground mt-6 font-sans text-sm font-semibold">{p.exampleTitle}</h3>
              <dl className="mt-2 space-y-2.5">
                <SlipRow label={p.calcWeight} value={formatWeight(exampleWeight)} />
                <SlipRow label={fill(p.calcPrice, { karat: exampleRow.karatCode })} value={formatIdr(exampleRow.sellIdr)} />
                <SlipRow label={p.calcGold} value={formatIdr(example.totalIdr)} strong />
              </dl>
              <p className="text-muted-foreground mt-2 text-sm">
                + {p.calcFee.toLowerCase()}, {p.calcFeeValue}
              </p>
            </>
          ) : null}

          <p className="mt-5">{p.formulaBody}</p>
          <Link
            href={to("/kalkulator")}
            className="text-brand mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold underline-offset-4 hover:underline"
          >
            {p.tryCalculator}
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
          <p className="text-muted-foreground mt-3 border-t pt-3 text-sm">{p.disclaimer}</p>
        </section>
      </div>

      <section className="bg-surface-muted" aria-labelledby="price-faq">
        <div className={`${container} py-10 md:py-14`}>
          <h2 id="price-faq" className="text-2xl font-semibold">
            {p.faqTitle}
          </h2>
          <dl className="mt-6 grid gap-x-14 gap-y-7 md:grid-cols-2">
            {p.faq.map((item) => (
              <div key={item.q} className="border-gold border-l-2 pl-4">
                <dt className="font-display text-lg font-semibold">{item.q}</dt>
                <dd className="mt-1.5">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
