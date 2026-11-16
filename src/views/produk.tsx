import type { Metadata } from "next";
import type { SlugViewProps } from "./types";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayCircleIcon } from "lucide-react";
import { JewelArt, toJewelKind } from "@/components/catalog/jewel-art";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductPhoto } from "@/components/catalog/product-photo";
import { ShareButton } from "@/components/product/share-button";
import { MediaTabs } from "@/components/product/media-tabs";
import { ReserveForm } from "@/components/product/reserve-form";
import { TryOnSlot } from "@/components/product/slots";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonSecondary, container, cardGridColumns } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary, localePath } from "@/i18n";
import { catalogHref, estimateProduct, priceProducts, roundingFromSettings, similarProducts } from "@/lib/catalog";
import {
  getCatalogProducts,
  getPriceBoard,
  getPrimaryStore,
  getProductBySlug,
  getSiteSettings,
  readFeatureFlags,
} from "@/lib/data/public";
import { formatDateTime, formatIdr, formatWeight } from "@/lib/format";
import { absoluteUrl, breadcrumbJsonLd, localeAlternates, productJsonLd } from "@/lib/seo";

type Props = SlugViewProps;

export async function generateStaticParams() {
  const products = await getCatalogProducts();
  // Cache Components needs at least one entry; an unknown slug simply renders "not found".
  return products.length > 0 ? products.map((product) => ({ slug: product.slug })) : [{ slug: "-" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = getDictionary(locale);
  const product = await getProductBySlug(slug);
  if (!product) return { title: t.product.notFoundTitle, robots: { index: false } };

  const description =
    product.description?.slice(0, 155) ??
    `${product.name}, emas ${product.karatCode}, ${formatWeight(product.weightG)}.`;
  return {
    title: product.name,
    description,
    alternates: localeAlternates(t.locale, `/katalog/${product.slug}`),
    openGraph: {
      title: product.name,
      description,
      url: localePath(t.locale, `/katalog/${product.slug}`),
      ...(product.images[0] ? { images: [{ url: product.images[0].url }] } : {}),
    },
  };
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

async function ProductDetail({ params }: Pick<Props, "params">) {
  const { slug, locale } = await params;
  const t = getDictionary(locale);
  const p = t.product;
  const to = (path: string) => localePath(t.locale, path);
  const [product, board, settings, store, all] = await Promise.all([
    getProductBySlug(slug),
    getPriceBoard(),
    getSiteSettings(),
    getPrimaryStore(),
    getCatalogProducts(),
  ]);
  if (!product) notFound();

  const rounding = roundingFromSettings(settings);
  const estimate = estimateProduct(product, board, rounding);
  const priced = { ...product, estimate };
  const flags = readFeatureFlags(settings);
  const updatedLabel = board.updatedAt ? formatDateTime(board.updatedAt, board.timeZone, t.locale) : "";
  const unavailable = product.status !== "published";
  const similar = similarProducts(priceProducts(all, board, rounding), product);
  const url = absoluteUrl(to(`/katalog/${product.slug}`));

  const message = estimate
    ? fill(t.whatsappMessage.product, {
        brand: store.name,
        name: product.name,
        karat: product.karatCode,
        weight: formatWeight(product.weightG),
        amount: formatIdr(estimate.totalIdr),
        updated: updatedLabel,
        url,
      })
    : fill(t.whatsappMessage.productOnRequest, {
        brand: store.name,
        name: product.name,
        karat: product.karatCode,
        weight: formatWeight(product.weightG),
        url,
      });

  const crumbs = [
    { name: t.common.home, path: "/" },
    { name: t.nav.catalog, path: "/katalog" },
    ...(product.categorySlug && product.categoryName
      ? [{ name: product.categoryName, path: catalogHref({ category: product.categorySlug }) }]
      : []),
  ];

  // 1. Photos: swipe on a phone, tap to open full size. Real photos are the truth.
  const gallery =
    product.images.length > 0 ? (
            <ul
              tabIndex={0}
              aria-label={p.gallery}
              // Phone: swipe through the photos. Wide screen: every photo stacked, nothing hidden off to the side.
              className="mx-[calc(var(--page-gutter)*-1)] flex snap-x snap-mandatory gap-2 overflow-x-auto px-(--page-gutter) pb-2 [scrollbar-width:none] md:mx-0 md:grid md:gap-3 md:overflow-visible md:px-0 md:pb-0"
            >
              {product.images.map((image, index) => (
                <li
                  key={image.url}
                  className="bg-surface-tint relative aspect-[4/5] w-[88%] shrink-0 snap-center overflow-hidden rounded-lg md:w-full"
                >
                  <a href={image.url} target="_blank" rel="noopener noreferrer" className="block h-full">
                    <ProductPhoto
                      src={image.url}
                      alt={image.alt || fill(p.photoOf, { name: product.name })}
                      priority={index === 0}
                      sizes="(min-width: 768px) 36rem, 88vw"
                      className="object-cover"
                      kind={toJewelKind(product.categorySlug)}
                      fallbackLabel={t.catalog.noPhoto}
                      size="large"
                    />
                  </a>
                  {product.images.length > 1 ? (
                    <span className="bg-foreground/75 absolute right-2 bottom-2 rounded-sm px-1.5 py-0.5 text-xs text-background md:hidden">
                      {fill(p.photoCount, { index: String(index + 1), total: String(product.images.length) })}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-surface-tint flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-lg">
              <JewelArt kind={toJewelKind(product.categorySlug)} className="size-24" />
              <span className="text-muted-foreground text-sm">{t.catalog.noPhoto}</span>
            </div>
          );

  return (
    <>
      <JsonLd data={productJsonLd(priced, store.name, t.locale)} />
      <JsonLd data={breadcrumbJsonLd([...crumbs, { name: product.name, path: `/katalog/${product.slug}` }], t.locale)} />

      {/* The breadcrumb sits on the maroon surface, continuing the header the way every
          other page's title band does, while the photo stays the first thing on the page. */}
      <div className="on-dark bg-board text-board-muted">
        <nav aria-label={t.common.breadcrumb} className={`${container} text-sm`}>
          <ol className="flex flex-wrap items-center gap-x-1.5">
            {crumbs.map((crumb) => (
              <li key={crumb.path} className="flex items-center gap-x-1.5">
                <Link
                  href={to(crumb.path)}
                  className="hover:text-board-foreground flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  {crumb.name}
                </Link>
                <span aria-hidden="true">/</span>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Wide screen: photos then the "good to know" box on the left, details on the right.
          Phone: photos, details, then the box, in reading order. */}
      <div
        className={`${container} grid gap-x-12 gap-y-6 pt-5 pb-10 md:grid-cols-2 md:grid-rows-[auto_1fr] md:pt-10 md:pb-14`}
      >
        {/* 1 and 2. Photos, with a 3D preview tab when the product has a model. */}
        <div className="min-w-0">
          {flags.viewer_3d && product.modelGlbUrl ? (
            <MediaTabs
              photos={gallery}
              modelSrc={product.modelGlbUrl}
              iosSrc={product.modelUsdzUrl}
              poster={product.images[0]?.url ?? null}
              productName={product.name}
              slug={product.slug}
              labels={{ photos: p.photos, model: p.preview3d, note: p.preview3dNote, loading: p.load3d }}
            />
          ) : (
            gallery
          )}
          {product.videoUrl ? (
            <a href={product.videoUrl} target="_blank" rel="noopener noreferrer" className={`${buttonSecondary} mt-3 w-full`}>
              <PlayCircleIcon className="size-5" aria-hidden="true" />
              {p.video}
            </a>
          ) : null}
          {/* 3. Reserved for "Coba Pakai"; renders nothing until a vendor is integrated and enabled. */}
          <TryOnSlot product={product} flags={flags} t={t} />
        </div>

        {/* 4. Name, karat, weight, sizes, today's estimate with its breakdown. */}
        <div className="min-w-0 md:row-span-2">
          <div className="flex flex-wrap gap-1.5">
            {product.status === "sold" ? <Badge tone="dark">{t.catalog.sold}</Badge> : null}
            {product.status === "out_of_stock" ? <Badge tone="dark">{t.catalog.outOfStock}</Badge> : null}
            {product.isDemo ? <Badge tone="notice">{t.catalog.demo}</Badge> : null}
          </div>
          <h1 className="mt-2 text-[1.625rem] font-semibold break-words md:text-[2rem]">{product.name}</h1>

          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
            <dt className="text-muted-foreground">{p.karat}</dt>
            <dd className="font-semibold">{product.karatLabel}</dd>
            <dt className="text-muted-foreground">{p.weight}</dt>
            <dd className="price font-semibold">{formatWeight(product.weightG)}</dd>
            {product.sizeOptions.length > 0 ? (
              <>
                <dt className="text-muted-foreground">{p.sizes}</dt>
                <dd className="font-semibold break-words">{product.sizeOptions.join(", ")}</dd>
              </>
            ) : null}
          </dl>

          {unavailable ? (
            <p className="bg-notice text-notice-foreground mt-5 rounded-sm px-3 py-2">{p.unavailable}</p>
          ) : null}

          <section aria-labelledby="estimate-title" className="@container mt-5 rounded-sm border border-t-4 border-t-brand p-4">
            <h2 id="estimate-title" className="text-lg font-semibold">
              {p.estimateTitle}
            </h2>
            {estimate ? (
              <>
                <dl className="mt-3 space-y-1.5">
                  <BreakdownRow
                    label={p.goldValue}
                    detail={`${formatWeight(product.weightG)} × ${formatIdr(estimate.pricePerGramIdr)}`}
                    amount={estimate.goldValueIdr}
                  />
                  <BreakdownRow label={p.labour} amount={estimate.labourFeeIdr} />
                  {estimate.roundingAdjustmentIdr !== 0 ? (
                    <BreakdownRow label={p.rounding} amount={estimate.roundingAdjustmentIdr} />
                  ) : null}
                </dl>
                <p className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 border-t-2 border-dashed pt-3">
                  <span className="font-semibold">{p.total}</span>
                  <span className="font-display price price-fit font-semibold">
                    {formatIdr(estimate.totalIdr)}
                  </span>
                </p>
                <p className="text-muted-foreground mt-2 text-sm">{fill(p.estimateNote, { updated: updatedLabel })}</p>
              </>
            ) : (
              <p className="mt-2">{p.onRequestBody}</p>
            )}
          </section>

          {/* 5. Actions. */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton
              number={ownerValue(store.whatsapp)}
              message={message}
              label={t.cta.whatsapp}
              missingLabel={t.cta.whatsappMissing}
              placement="product_page"
              product={product.slug}
              className="sm:flex-1"
            />
            <ShareButton title={product.name} label={t.cta.share} copiedLabel={t.cta.shareCopied} />
          </div>
          {flags.reserve && !unavailable ? (
            <ReserveForm slug={product.slug} locale={t.locale} privacyHref={to("/privasi")} t={t.reserve} />
          ) : null}

          {product.description ? (
            <p className="mt-6 max-w-[65ch] break-words whitespace-pre-line">{product.description}</p>
          ) : null}
        </div>

        {/* 6. Trust box: under the photos on a wide screen, last on a phone. */}
        <section aria-labelledby="trust-title" className="border-t-gold rounded-sm border border-t-4 bg-background p-4 md:self-start md:p-5">
          <h2 id="trust-title" className="text-lg font-semibold">
            {p.trustTitle}
          </h2>
          {/* Links only: the full buyback policy is long and lives on the trust page. */}
          <ul className="mt-2">
            {t.home.trustItems.map((item) => (
              <li key={item.anchor}>
                <Link
                  href={to(`/kepercayaan#${item.anchor}`)}
                  className="text-brand flex min-h-11 items-center font-semibold underline-offset-4 hover:underline"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {similar.length > 0 ? (
        <section aria-labelledby="similar-title" className="bg-surface-muted">
          <div className={`${container} py-10 md:py-12`}>
            <h2 id="similar-title" className="text-2xl font-semibold">
              {p.similar}
            </h2>
            <div className="@container mt-4">
              <ul className={cardGridColumns}>
                {similar.map((item) => (
                  <li key={item.id}>
                    <ProductCard product={item} t={t} sizes="(min-width: 768px) 25vw, 50vw" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function Badge({ tone, children }: { tone: "dark" | "notice"; children: React.ReactNode }) {
  return (
    <span
      className={
        tone === "dark"
          ? "bg-foreground rounded-sm px-2 py-0.5 text-sm font-semibold text-background"
          : "bg-notice text-notice-foreground rounded-sm px-2 py-0.5 text-sm font-semibold"
      }
    >
      {children}
    </span>
  );
}

function BreakdownRow({ label, detail, amount }: { label: string; detail?: string; amount: number }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
      <dt>
        {label}
        {/* May wrap around the "×" with very large text; each number stays whole. */}
        {detail ? <span className="text-muted-foreground block text-sm tabular-nums">{detail}</span> : null}
      </dt>
      <dd className="price ml-auto font-semibold">{formatIdr(amount)}</dd>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div aria-hidden="true">
      {/* Same height as the breadcrumb strip, so nothing jumps when the page arrives. */}
      <div className="bg-board h-11" />
      <div className={`${container} grid gap-x-12 gap-y-6 pt-5 md:grid-cols-2 md:pt-10`}>
        <div className="bg-surface-muted aspect-[4/5] rounded-lg" />
        <div>
          <div className="bg-surface-muted h-9 w-4/5 rounded-sm" />
          <div className="bg-surface-muted mt-4 h-16 w-3/5 rounded-sm" />
          <div className="bg-surface-muted mt-5 h-48 rounded-sm" />
          <div className="bg-surface-muted mt-5 h-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}
