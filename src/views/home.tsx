import type { Metadata } from "next";
import type { ViewProps } from "./types";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, GemIcon, MessageCircleIcon, ReceiptTextIcon, ScaleIcon } from "lucide-react";
import { Estimator } from "@/components/calculator/estimator";
import { JewelArt, toJewelKind } from "@/components/catalog/jewel-art";
import { ProductCard } from "@/components/catalog/product-card";
import { PriceNotices, PriceTable } from "@/components/price/price-table";
import { JsonLd } from "@/components/seo/json-ld";
import {
  buttonGold,
  buttonOnDark,
  buttonSecondary,
  cardGridColumns,
  container,
  sectionTitle,
} from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary, localePath } from "@/i18n";
import { catalogHref, priceProducts, roundingFromSettings } from "@/lib/catalog";
import {
  getCategories,
  getListedProducts,
  getPriceBoard,
  getPricingSettings,
  getPrimaryStore,
  getSiteSettings,
  heroImage,
} from "@/lib/data/public";
import { formatDateTime, formatIdr } from "@/lib/format";
import { pageMetadata, storeJsonLd } from "@/lib/seo";

type Props = ViewProps;

const WHY_ICONS = [ReceiptTextIcon, GemIcon, ScaleIcon, MessageCircleIcon];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary((await params).locale);
  return pageMetadata(t, "/", { absolute: t.home.metaTitle }, t.home.metaDescription);
}

export default async function HomePage({ params }: Props) {
  const t = getDictionary((await params).locale);
  const h = t.home;
  const to = (path: string) => localePath(t.locale, path);
  const [board, store, settings, pricing, categories, products] = await Promise.all([
    getPriceBoard(),
    getPrimaryStore(),
    getSiteSettings(),
    getPricingSettings(),
    getCategories(),
    getListedProducts(),
  ]);

  const whatsapp = ownerValue(store.whatsapp);
  const rounding = roundingFromSettings(settings);
  const priced = priceProducts(products, { board, rounding, pricing });
  const published = priced.filter((product) => product.status === "published");
  const featured = (
    published.some((product) => product.isFeatured) ? published.filter((product) => product.isFeatured) : published
  ).slice(0, 4);
  const bestsellers = published.filter((product) => product.isBestsellerDemo).slice(0, 6);
  // Only the kinds of jewellery that have something to show get a tile.
  const shownCategories = categories.filter((category) =>
    published.some((product) => product.categorySlug === category.slug),
  );
  const categoryTiles = (shownCategories.length > 0 ? shownCategories : categories).slice(0, 8);

  const address = [ownerValue(store.address), ownerValue(store.city)].filter(Boolean).join(", ");
  const mapsUrl = ownerValue(store.maps_url);
  const reviewUrl = ownerValue(store.google_review_url);
  const updatedLabel = board.updatedAt ? formatDateTime(board.updatedAt, board.timeZone, t.locale) : "";
  const craftPhoto = published.find((product) => product.images.length > 0)?.images[0] ?? null;

  const calculatorCopy = {
    locale: t.locale,
    calculator: t.calculator,
    product: t.product,
    cta: t.cta,
    whatsappMessage: t.whatsappMessage,
  };

  return (
    <>
      <JsonLd data={storeJsonLd(store, t.locale)} />

      {/* 1. Hero: headline and actions on ivory, the campaign photograph beside it. */}
      <section className="border-b">
        <div className="mx-auto grid w-full max-w-[90rem] md:grid-cols-2">
          <div className="page-gutter flex flex-col justify-center py-10 md:py-20 md:pr-12 md:pl-[max(var(--page-gutter),calc((100vw-76rem)/2+var(--page-gutter)))] lg:py-28">
            <p className="eyebrow">{h.heroEyebrow}</p>
            <h1 className="mt-5 text-[2.125rem] leading-[1.08] font-medium md:text-[3rem] lg:text-[3.75rem]">
              {h.heroTitle} <em className="text-gold-ink font-normal">{h.heroTitleAccent}</em>.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-[34rem] text-lg">{h.heroLead}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={to("/katalog")} className={buttonGold}>
                {t.cta.catalog}
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
              <WhatsAppButton
                number={whatsapp}
                message={fill(t.whatsappMessage.price, { brand: store.name })}
                label={t.cta.whatsapp}
                missingLabel={t.cta.whatsappMissing}
                placement="home_hero"
                variant="outline"
              />
            </div>
          </div>
          <div className="bg-surface-muted relative min-h-[18rem] md:min-h-[34rem]">
            {heroImage ? (
              <Image
                src={heroImage.src}
                alt={h.heroImageAlt}
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <JewelArt kind="cincin" className="size-28 md:size-40" />
                <span className="text-muted-foreground text-sm">{h.heroImagePending}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Today's prices, on the charcoal board. */}
      <section className="on-dark bg-board text-board-foreground" aria-labelledby="home-prices">
        <div className={`${container} grid gap-x-16 gap-y-8 py-12 md:grid-cols-[1fr_1.15fr] md:py-20`}>
          <div>
            <p className="eyebrow text-board-accent!">{h.pricesEyebrow}</p>
            <h2 id="home-prices" className={sectionTitle}>
              {t.price.title}
            </h2>
            {board.updatedAt ? (
              <p className="text-board-accent mt-2 text-sm tabular-nums">
                {t.price.updated}: <time dateTime={board.updatedAt}>{updatedLabel}</time>
              </p>
            ) : null}
            <p className="text-board-muted mt-4 max-w-[30rem]">{h.pricesLead}</p>
            {board.referenceIdr ? (
              <dl className="border-board-rule mt-6 max-w-[26rem] border-y py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <dt className="text-board-muted text-sm">{t.price.reference}</dt>
                  <dd className="price font-display text-xl font-semibold">
                    {formatIdr(board.referenceIdr)}
                    <span className="text-board-muted font-sans text-sm font-normal">{t.price.perGramShort}</span>
                  </dd>
                </div>
                <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4">
                  <dt className="sr-only">Status</dt>
                  <dd className="text-board-accent text-sm">{t.price.status[board.status]}</dd>
                </div>
              </dl>
            ) : null}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href={to("/harga-emas")} className={buttonOnDark}>
                {t.price.seeDetail}
              </Link>
            </div>
          </div>
          <div>
            <PriceTable board={board} t={t} tone="dark" />
            <div className="mt-4 empty:hidden">
              <PriceNotices board={board} t={t} tone="dark" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Categories. */}
      <section className={`${container} py-12 md:py-20`} aria-labelledby="home-categories">
        <p className="eyebrow">{h.categoriesEyebrow}</p>
        <h2 id="home-categories" className={sectionTitle}>
          {h.categoriesTitle}
        </h2>
        {/* Columns follow the text size, like the product grid: one per row when text is very large. */}
        <div className="@container mt-8">
          <ul className="grid grid-cols-1 gap-3 @min-[17.5rem]:grid-cols-2 @min-[40rem]:grid-cols-3 @min-[58rem]:grid-cols-5">
            {categoryTiles.map((category) => {
              const photo = published.find(
                (product) => product.categorySlug === category.slug && product.images.length > 0,
              )?.images[0];
              return (
                <li key={category.slug}>
                  <Link
                    href={to(catalogHref({ category: category.slug }))}
                    className="group bg-card hover:border-gold flex h-full flex-col overflow-hidden rounded-md border"
                  >
                    <span className="bg-surface-tint relative flex aspect-[4/3] items-center justify-center overflow-hidden">
                      {photo ? (
                        <Image
                          src={photo.url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 15rem, 50vw"
                          className="object-cover transition-transform duration-500 ease-out-strong motion-safe:group-hover:scale-[1.04]"
                        />
                      ) : (
                        <JewelArt kind={toJewelKind(category.slug)} className="size-14" />
                      )}
                    </span>
                    <span className="flex items-center justify-between gap-2 px-3 py-3 font-semibold break-words">
                      {category.name}
                      <ArrowRightIcon className="text-gold-ink size-4 shrink-0" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 4. Featured and recommended. */}
      <section className="bg-card border-y" aria-labelledby="home-featured">
        <div className={`${container} py-12 md:py-20`}>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <p className="eyebrow">{h.featuredEyebrow}</p>
              <h2 id="home-featured" className={sectionTitle}>
                {h.featuredTitle}
              </h2>
            </div>
            <Link
              href={to("/katalog")}
              className="hover:text-gold-ink inline-flex min-h-11 shrink-0 items-center gap-1.5 font-semibold underline-offset-4 hover:underline"
            >
              {t.common.seeAll}
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="@container mt-8">
              <ul className={cardGridColumns}>
                {featured.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} t={t} sizes="(min-width: 768px) 25vw, 50vw" />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground mt-6">{h.featuredEmpty}</p>
          )}
          {featured.some((product) => product.isConcept) ? (
            <p className="text-muted-foreground mt-6 text-sm">{t.catalog.conceptNotice}</p>
          ) : null}
        </div>
      </section>

      {/* 5. Bestseller showcase. Shown only with demonstration products; the ranking is simulated. */}
      {bestsellers.length > 0 ? (
        <section className={`${container} py-12 md:py-20`} aria-labelledby="home-bestsellers">
          <p className="eyebrow">{h.bestsellerEyebrow}</p>
          <h2 id="home-bestsellers" className={sectionTitle}>
            {h.bestsellerTitle}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-[44rem] text-sm">{h.bestsellerNote}</p>
          <ol
            tabIndex={0}
            aria-labelledby="home-bestsellers"
            className="mx-[calc(var(--page-gutter)*-1)] mt-8 flex snap-x gap-4 overflow-x-auto px-(--page-gutter) pb-3"
          >
            {/* The rank sits in each item's top padding, so the card can still fill the full height of the row. */}
            {bestsellers.map((product, index) => (
              <li key={product.id} className="relative w-[min(15rem,72vw)] shrink-0 snap-start pt-10">
                <p
                  className="font-display text-gold-ink absolute top-0 left-0 text-2xl tabular-nums"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </p>
                <ProductCard product={product} t={t} sizes="15rem" />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* 6. Calculator. */}
      {board.rows.length > 0 ? (
        <section className="bg-surface-muted" aria-labelledby="home-calculator">
          <div className={`${container} grid items-start gap-x-16 gap-y-8 py-12 md:grid-cols-[1fr_1.1fr] md:py-20`}>
            <div>
              <p className="eyebrow">{h.calculatorEyebrow}</p>
              <h2 id="home-calculator" className={sectionTitle}>
                {h.calculatorTitle}
              </h2>
              <p className="text-muted-foreground mt-4 max-w-[30rem]">{h.calculatorLead}</p>
              <p className="border-gold mt-6 max-w-[30rem] border-l-2 pl-4 text-sm">{t.price.referenceNote}</p>
              <Link href={to("/kalkulator")} className={`${buttonSecondary} mt-6`}>
                {h.calculatorMore}
              </Link>
            </div>
            <Estimator
              mode="buy"
              rows={board.rows}
              rounding={rounding}
              defaultFee={{ type: settings.default_labour_fee_type, value: Number(settings.default_labour_fee_value) }}
              markupPercent={pricing.defaultMarkupPercent}
              taxPercent={pricing.taxPercent}
              brand={store.name}
              whatsappNumber={whatsapp}
              t={calculatorCopy}
            />
          </div>
        </section>
      ) : null}

      {/* 7. Why Sinar Mas. */}
      <section className={`${container} py-12 md:py-20`} aria-labelledby="home-why">
        <p className="eyebrow">{h.whyEyebrow}</p>
        <h2 id="home-why" className={sectionTitle}>
          {h.whyTitle}
        </h2>
        <ul className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {h.whyItems.map((item, index) => {
            const Icon = WHY_ICONS[index % WHY_ICONS.length];
            return (
              <li key={item.title} className="border-gold border-t pt-5">
                <Icon className="text-gold-ink size-6" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-medium">{item.title}</h3>
                <p className="text-muted-foreground mt-2">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 8. Craftsmanship and quality. */}
      <section className="bg-card border-y" aria-labelledby="home-craft">
        <div className="mx-auto grid w-full max-w-[90rem] md:grid-cols-2">
          <div className="bg-surface-tint relative min-h-[16rem] md:min-h-[30rem]">
            {craftPhoto ? (
              <Image
                src={craftPhoto.url}
                alt={h.craftImageAlt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <JewelArt kind="mas-kawin" className="size-28 md:size-36" />
              </div>
            )}
          </div>
          <div className="page-gutter py-12 md:py-20 md:pr-[max(var(--page-gutter),calc((100vw-76rem)/2+var(--page-gutter)))] md:pl-12">
            <p className="eyebrow">{h.craftEyebrow}</p>
            <h2 id="home-craft" className={sectionTitle}>
              {h.craftTitle}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-[34rem]">{h.craftLead}</p>
            <dl className="mt-6 max-w-[34rem] divide-y border-y">
              {h.craftItems.map((item) => (
                <div key={item.title} className="py-4">
                  <dt className="font-display text-lg font-medium">{item.title}</dt>
                  <dd className="text-muted-foreground mt-1">{item.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* 9. Before you buy: the guides on the trust page. */}
      <section className={`${container} py-12 md:py-20`} aria-labelledby="home-trust">
        <h2 id="home-trust" className="text-[1.75rem] font-medium md:text-[2.25rem]">
          {h.trustTitle}
        </h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {h.trustItems.map((item) => (
            <li key={item.anchor}>
              <Link
                href={to(`/kepercayaan#${item.anchor}`)}
                className="bg-card hover:border-gold flex h-full flex-col rounded-md border p-5"
              >
                <span className="font-display text-xl font-medium">{item.title}</span>
                <span className="text-muted-foreground mt-2">{item.body}</span>
                <ArrowRightIcon className="text-gold-ink mt-auto size-4 translate-y-2" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 10. Store information. */}
      <section className="bg-surface-muted" aria-labelledby="home-store">
        <div className={`${container} py-12 md:py-20`}>
          <p className="eyebrow">{h.storeEyebrow}</p>
          <h2 id="home-store" className={sectionTitle}>
            {h.storeTitle}
          </h2>
          <p className="mt-4 max-w-[60ch] break-words">{address || t.store.pending}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <WhatsAppButton
              number={whatsapp}
              message={fill(t.whatsappMessage.general, { brand: store.name })}
              label={t.cta.whatsapp}
              missingLabel={t.cta.whatsappMissing}
              placement="home_store"
            />
            <Link href={to("/toko")} className={buttonSecondary}>
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
        </div>
      </section>
    </>
  );
}
