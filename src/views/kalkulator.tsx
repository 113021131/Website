import type { Metadata } from "next";
import type { ViewProps } from "./types";
import { Estimator } from "@/components/calculator/estimator";
import { PriceNotices } from "@/components/price/price-table";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { container } from "@/components/ui/styles";
import { ownerValue } from "@/config/owner";
import { getDictionary } from "@/i18n";
import { roundingFromSettings } from "@/lib/catalog";
import { getPriceBoard, getPrimaryStore, getSiteSettings } from "@/lib/data/public";
import { formatDateTime } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = ViewProps;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary((await params).locale);
  return pageMetadata(t, "/kalkulator", t.calculator.metaTitle, t.calculator.metaDescription);
}

export default async function CalculatorPage({ params }: Props) {
  const t = getDictionary((await params).locale);
  const c = t.calculator;
  const [board, store, settings] = await Promise.all([getPriceBoard(), getPrimaryStore(), getSiteSettings()]);

  // Only what the client component needs crosses to the browser.
  const copy = { calculator: t.calculator, product: t.product, cta: t.cta, whatsappMessage: t.whatsappMessage };
  const shared = {
    rows: board.rows,
    rounding: roundingFromSettings(settings),
    defaultFee: { type: settings.default_labour_fee_type, value: Number(settings.default_labour_fee_value) },
    brand: store.name,
    whatsappNumber: ownerValue(store.whatsapp),
    t: copy,
  };

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: t.common.home, path: "/" },
            { name: t.nav.calculator, path: "/kalkulator" },
          ],
          t.locale,
        )}
      />
      <PageHero title={c.title} lead={c.lead}>
        {board.updatedAt ? (
          <p className="border-board-accent text-board-accent mt-4 inline-block rounded-sm border px-2.5 py-1 text-sm font-semibold tabular-nums">
          {t.price.updated}: <time dateTime={board.updatedAt}>{formatDateTime(board.updatedAt, board.timeZone, t.locale)}</time>
        </p>
        ) : null}
        <div className="mt-4 max-w-xl empty:hidden">
          <PriceNotices board={board} t={t} tone="dark" />
        </div>
      </PageHero>
      <div className={`${container} py-8 md:py-12`}>
      {board.rows.length > 0 ? (
        <div className="grid items-start gap-5 md:grid-cols-2">
          <Estimator mode="buy" {...shared} />
          <Estimator mode="sell" {...shared} />
        </div>
      ) : (
        <p>{t.price.empty}</p>
      )}
      </div>
    </>
  );
}
