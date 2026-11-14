import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { JewelArt, toJewelKind } from "@/components/catalog/jewel-art";
import { ProductCard } from "@/components/catalog/product-card";
import { PriceNotices, PriceTable } from "@/components/price/price-table";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonOnDark, buttonSecondary, container } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary } from "@/i18n";
import { catalogHref, priceProducts, roundingFromSettings } from "@/lib/catalog";
import { getCatalogProducts, getCategories, getPriceBoard, getPrimaryStore, getSiteSettings } from "@/lib/data/public";
import { formatDateTime } from "@/lib/format";
import { storeJsonLd } from "@/lib/seo";

const t = getDictionary();

export const metadata: Metadata = {
  title: { absolute: t.home.metaTitle },
  description: t.home.metaDescription,
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [board, store, settings, categories, products] = await Promise.all([
    getPriceBoard(),
    getPrimaryStore(),
    getSiteSettings(),
    getCategories(),
    getCatalogProducts(),
  ]);

  const whatsapp = ownerValue(store.whatsapp);
  const priced = priceProducts(products, board, roundingFromSettings(settings));
  const published = priced.filter((product) => product.status === "published");
  const featured = (published.some((product) => product.isFeatured)
    ? published.filter((product) => product.isFeatured)
    : published
  ).slice(0, 4);

  const address = [ownerValue(store.address), ownerValue(store.city)].filter(Boolean).join(", ");
  const mapsUrl = ownerValue(store.maps_url);
  const reviewUrl = ownerValue(store.google_review_url);

  return (
    <>
      <JsonLd data={storeJsonLd(store)} />

      {/* Hero: the shop's price board. Continues the header's maroon surface. */}
      <div className="on-dark bg-board text-board-foreground">
        <section className={`${container} grid gap-x-14 pt-3 pb-8 md:grid-cols-2 md:pt-12 md:pb-16`}>
          <div>
            <h1 className="text-[1.875rem] font-semibold md:text-[2.5rem]">{t.price.title}</h1>
            {board.updatedAt ? (
              <p className="price text-board-accent mt-1.5 text-sm">
                {t.price.updated}:{" "}
                <time dateTime={board.updatedAt}>{formatDateTime(board.updatedAt, board.timeZone)}</time>
              </p>
            ) : null}
            <p className="text-board-muted mt-4 hidden max-w-[28rem] text-lg md:block">{t.home.lead}</p>
          </div>

          <div className="mt-4 md:row-span-2 md:mt-0">
            <PriceTable board={board} t={t} tone="dark" />
          </div>

          <div className="mt-5 space-y-4 md:mt-8 md:self-end">
            <div className="flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton
                number={whatsapp}
                message={fill(t.whatsappMessage.price, { brand: store.name })}
                label={t.cta.whatsapp}
                missingLabel={t.cta.whatsappMissing}
                placement="home_hero"
              />
              <Link href="/katalog" className={buttonOnDark}>
                {t.cta.jewellery}
              </Link>
            </div>
            <PriceNotices board={board} t={t} tone="dark" />
            <p className="text-board-muted md:hidden">{t.home.lead}</p>
          </div>
        </section>
      </div>

      <section className={`${container} py-10`} aria-labelledby="home-categories">
        <h2 id="home-categories" className="text-2xl font-semibold">
          {t.home.categoriesTitle}
        </h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={catalogHref({ category: category.slug })}
                className="bg-surface-muted hover:bg-surface-tint flex h-full flex-col items-center gap-2 rounded-lg px-3 py-5 text-center"
              >
                <JewelArt kind={toJewelKind(category.slug)} className="size-14" />
                <span className="font-semibold">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${container} pb-10`} aria-labelledby="home-featured">
        <div className="flex items-end justify-between gap-4">
          <h2 id="home-featured" className="text-2xl font-semibold">
            {t.home.featuredTitle}
          </h2>
          <Link href="/katalog" className="text-brand inline-flex min-h-11 shrink-0 items-center gap-1 font-semibold">
            {t.common.seeAll}
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {featured.length > 0 ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {featured.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} t={t} sizes="(min-width: 768px) 25vw, 50vw" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground mt-4">{t.home.featuredEmpty}</p>
        )}
      </section>

      <section className="bg-surface-muted" aria-labelledby="home-trust">
        <div className={`${container} py-10`}>
          <h2 id="home-trust" className="text-2xl font-semibold">
            {t.home.trustTitle}
          </h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {t.home.trustItems.map((item) => (
              <li key={item.anchor}>
                <Link
                  href={`/kepercayaan#${item.anchor}`}
                  className="hover:border-brand flex h-full flex-col rounded-lg border bg-background p-4"
                >
                  <span className="font-display text-lg font-semibold">{item.title}</span>
                  <span className="text-muted-foreground mt-1">{item.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={`${container} py-10`} aria-labelledby="home-store">
        <h2 id="home-store" className="text-2xl font-semibold">
          {t.home.storeTitle}
        </h2>
        <p className="mt-3 max-w-[60ch] break-words">{address || t.store.pending}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <WhatsAppButton
            number={whatsapp}
            message={fill(t.whatsappMessage.general, { brand: store.name })}
            label={t.cta.whatsapp}
            missingLabel={t.cta.whatsappMissing}
            placement="home_store"
          />
          <Link href="/toko" className={buttonSecondary}>
            {t.store.hours}
          </Link>
          {mapsUrl ? (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={buttonSecondary}>
              {t.cta.directions}
            </a>
          ) : null}
          {reviewUrl ? (
            <a href={reviewUrl} target="_blank" rel="noopener noreferrer" className={buttonSecondary}>
              {t.cta.reviews}
            </a>
          ) : null}
        </div>
      </section>
    </>
  );
}
