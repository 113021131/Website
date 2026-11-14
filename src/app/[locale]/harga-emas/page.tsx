import type { Metadata } from "next";
import Link from "next/link";
import { PricePageView } from "@/components/page-view";
import { PriceNotices, PriceTable } from "@/components/price/price-table";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonSecondary, container } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary, localePath } from "@/i18n";
import { roundingFromSettings } from "@/lib/catalog";
import { getPriceBoard, getPrimaryStore, getSiteSettings } from "@/lib/data/public";
import { formatDateTime, formatIdr, formatWeight } from "@/lib/format";
import { calculatePrice } from "@/lib/pricing/calculate";
import { breadcrumbJsonLd, faqJsonLd, pageMetadata } from "@/lib/seo";

type Props = PageProps<"/[locale]/harga-emas">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary((await params).locale);
  return pageMetadata(t, "/harga-emas", t.pricePage.metaTitle, t.pricePage.metaDescription);
}

export default async function GoldPricePage({ params }: Props) {
  const t = getDictionary((await params).locale);
  const p = t.pricePage;
  const to = (path: string) => localePath(t.locale, path);
  const [board, store, settings] = await Promise.all([getPriceBoard(), getPrimaryStore(), getSiteSettings()]);

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
        data={breadcrumbJsonLd([
          { name: t.common.home, path: "/" },
          { name: t.nav.prices, path: "/harga-emas" },
        ], t.locale)}
      />

      <div className={`${container} grid gap-x-14 gap-y-8 py-8 md:grid-cols-[1.1fr_1fr] md:py-12`}>
        <section aria-labelledby="price-title">
          <h1 id="price-title" className="text-[1.875rem] font-semibold md:text-[2.5rem]">
            {t.price.title}
          </h1>
          {board.updatedAt ? (
            <p className="price text-gold-ink mt-1.5 text-sm font-semibold">
              {t.price.updated}: <time dateTime={board.updatedAt}>{formatDateTime(board.updatedAt, board.timeZone, t.locale)}</time>
            </p>
          ) : null}
          <p className="text-muted-foreground mt-3 max-w-[60ch]">{p.lead}</p>

          <div className="mt-5">
            <PriceTable board={board} t={t} />
          </div>
          <div className="mt-4 space-y-4">
            <PriceNotices board={board} t={t} />
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>{p.sellExplain}</li>
              <li>{p.buybackExplain}</li>
            </ul>
            <div className="flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton
                number={ownerValue(store.whatsapp)}
                message={fill(t.whatsappMessage.price, { brand: store.name })}
                label={t.cta.whatsapp}
                missingLabel={t.cta.whatsappMissing}
                placement="price_page"
              />
              <Link href={to("/katalog")} className={buttonSecondary}>
                {t.cta.catalog}
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="formula-title" className="md:pt-2">
          <h2 id="formula-title" className="text-2xl font-semibold">
            {p.formulaTitle}
          </h2>
          <p className="border-l-gold bg-surface-tint mt-4 rounded-sm border-l-4 px-4 py-3 font-semibold">{p.formula}</p>
          <p className="mt-4 max-w-[60ch]">{p.formulaBody}</p>
          {example && exampleRow ? (
            <p className="mt-4 max-w-[60ch]">
              <span className="font-semibold">{p.exampleTitle}: </span>
              {fill(p.example, {
                karat: exampleRow.karatCode,
                weight: formatWeight(exampleWeight),
                price: formatIdr(exampleRow.sellIdr),
                total: formatIdr(example.totalIdr),
              })}
            </p>
          ) : null}
          <p className="text-muted-foreground mt-4 max-w-[60ch] text-sm">{p.disclaimer}</p>
        </section>
      </div>

      <section className="bg-surface-muted" aria-labelledby="price-faq">
        <div className={`${container} py-10`}>
          <h2 id="price-faq" className="text-2xl font-semibold">
            {p.faqTitle}
          </h2>
          <dl className="mt-5 max-w-[70ch] space-y-5">
            {p.faq.map((item) => (
              <div key={item.q}>
                <dt className="font-display text-lg font-semibold">{item.q}</dt>
                <dd className="mt-1">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
