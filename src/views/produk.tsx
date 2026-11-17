import type { Metadata } from "next";
import type { SlugViewProps } from "./types";
import { Suspense, type ReactNode } from "react";
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
import { catalogHref, priceProduct, priceProducts, roundingFromSettings, similarProducts } from "@/lib/catalog";
import {
  getCatalogProducts,
  getListedProducts,
  getPriceBoard,
  getPricingSettings,
  getPrimaryStore,
  getProductBySlug,
  getSiteSettings,
  readFeatureFlags,
} from "@/lib/data/public";
import { formatDateTime, formatIdr, formatWeight } from "@/lib/format";
import { formatPercent, productDescription, productGemstone, productName, specText } from "@/lib/product-text";
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

  const name = productName(product, t.locale);
  const description =
    productDescription(product, t.locale)?.slice(0, 155) ??
    `${name}, emas ${product.karatCode}, ${formatWeight(product.weightG)}.`;
  return {
    title: name,
    description,
    alternates: localeAlternates(t.locale, `/katalog/${product.slug}`),
    // A concept design is a demonstration, never something for a search engine to list.
    ...(product.isConcept ? { robots: { index: false } } : {}),
    openGraph: {
      title: name,
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
  const [product, board, settings, pricing, store, listed] = await Promise.all([
    getProductBySlug(slug),
    getPriceBoard(),
    getSiteSettings(),
    getPricingSettings(),
    getPrimaryStore(),
    getListedProducts(),
  ]);
  if (!product) notFound();

  const context = { board, rounding: roundingFromSettings(settings), pricing };
  const priced = priceProduct(product, context);
  const { estimate, buyback } = priced;
  const flags = readFeatureFlags(settings);
  const updatedLabel = board.updatedAt ? formatDateTime(board.updatedAt, board.timeZone, t.locale) : "";
  const unavailable = product.status !== "published";
  const similar = similarProducts(priceProducts(listed, context), product);
  const url = absoluteUrl(to(`/katalog/${product.slug}`));

  const name = productName(product, t.locale);
  const description = productDescription(product, t.locale);
  const gemstone = productGemstone(product, t.locale);
  const priceRow = board.rows.find((row) => row.karatCode === product.karatCode);
  const markupPercent = product.markupPercent ?? pricing.defaultMarkupPercent;
  // Every figure on a concept design, and every figure while the reference is a sample, is a simulation.
  const simulated = product.isConcept || board.status === "demo";

  const message = product.isConcept
    ? fill(t.whatsappMessage.productConcept, {
        brand: store.name,
        name,
        sku: product.sku ?? product.slug,
        url,
      })
    : priced.priceIdr !== null
      ? fill(t.whatsappMessage.product, {
          brand: store.name,
          name,
          karat: product.karatCode,
          weight: formatWeight(product.weightG),
          amount: formatIdr(priced.priceIdr),
          updated: updatedLabel,
          url,
        })
      : fill(t.whatsappMessage.productOnRequest, {
          brand: store.name,
          name,
          karat: product.karatCode,
          weight: formatWeight(product.weightG),
          url,
        });

  const crumbs = [
    { name: t.common.home, path: "/" },
    { name: t.nav.catalog, path: "/katalog" },
    ...(product.categorySlug && product.categoryName
      ? [
          {
            name: product.categoryName,
            path: catalogHref({ category: product.categorySlug }),
          },
        ]
      : []),
  ];

  // 1. Photos: swipe on a phone, tap to open full size. Real photos are the truth.
  const gallery =
    product.images.length > 0 ? (
      <ul
        tabIndex={0}
        aria-label={p.gallery}
        // Phone: swipe through the photos. Wide screen: the first photo large, the rest in two columns under it.
        className="mx-[calc(var(--page-gutter)*-1)] flex snap-x snap-mandatory gap-2 overflow-x-auto px-(--page-gutter) pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:gap-3 md:overflow-visible md:px-0 md:pb-0"
      >
        {product.images.map((image, index) => (
          <li
            key={image.url}
            // With more than one photo the next one peeks in at the edge, so the visitor knows to swipe.
            className={`bg-card relative aspect-square ${product.images.length > 1 ? "w-[88%]" : "w-full"} shrink-0 snap-center overflow-hidden rounded-md border md:w-full md:first:col-span-2`}
          >
            <a href={image.url} target="_blank" rel="noopener noreferrer" className="block h-full">
              <ProductPhoto
                src={image.url}
                alt={image.alt || fill(p.photoOf, { name })}
                priority={index === 0}
                sizes={product.images.length > 1 ? "(min-width: 768px) 36rem, 88vw" : "(min-width: 768px) 36rem, 100vw"}
                className="object-cover"
                kind={toJewelKind(product.categorySlug)}
                fallbackLabel={t.catalog.noPhoto}
                size="large"
              />
            </a>
            {product.images.length > 1 ? (
              <span className="bg-foreground/75 absolute right-2 bottom-2 rounded-sm px-1.5 py-0.5 text-xs text-background md:hidden">
                {fill(p.photoCount, {
                  index: String(index + 1),
                  total: String(product.images.length),
                })}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    ) : (
      <div className="bg-card flex aspect-square flex-col items-center justify-center gap-3 rounded-md border">
        <JewelArt kind={toJewelKind(product.categorySlug)} className="size-28" />
        <span className="text-muted-foreground text-sm">{product.isConcept ? p.photoPending : t.catalog.noPhoto}</span>
      </div>
    );

  return (
    <>
      {/* A concept design is not on offer, so it gets no product markup for search engines. */}
      {product.isConcept ? null : <JsonLd data={productJsonLd(priced, store.name, t.locale)} />}
      <JsonLd data={breadcrumbJsonLd([...crumbs, { name, path: `/katalog/${product.slug}` }], t.locale)} />

      <nav aria-label={t.common.breadcrumb} className={`${container} text-muted-foreground pt-2 text-sm md:pt-4`}>
        <ol className="flex flex-wrap items-center gap-x-1.5">
          {crumbs.map((crumb) => (
            <li key={crumb.path} className="flex items-center gap-x-1.5">
              <Link
                href={to(crumb.path)}
                className="hover:text-foreground flex min-h-11 items-center underline-offset-4 hover:underline"
              >
                {crumb.name}
              </Link>
              <span aria-hidden="true">/</span>
            </li>
          ))}
        </ol>
      </nav>

      {/* Wide screen: photos then the "good to know" box on the left, details on the right.
          Phone: photos, details, then the box, in reading order. */}
      <div className={`${container} grid gap-x-14 gap-y-6 pt-2 pb-12 md:grid-cols-2 md:grid-rows-[auto_1fr] md:pb-20`}>
        {/* 1 and 2. Photos, with a 3D preview tab when the product has a model. */}
        <div className="min-w-0">
          {flags.viewer_3d && product.modelGlbUrl ? (
            <MediaTabs
              photos={gallery}
              modelSrc={product.modelGlbUrl}
              iosSrc={product.modelUsdzUrl}
              poster={product.images[0]?.url ?? null}
              productName={name}
              slug={product.slug}
              labels={{
                photos: p.photos,
                model: p.preview3d,
                note: p.preview3dNote,
                loading: p.load3d,
              }}
            />
          ) : (
            gallery
          )}
          {product.videoUrl ? (
            <a
              href={product.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonSecondary} mt-3 w-full`}
            >
              <PlayCircleIcon className="size-5" aria-hidden="true" />
              {p.video}
            </a>
          ) : null}
          {/* 3. Reserved for "Coba Pakai"; renders nothing until a vendor is integrated and enabled. */}
          <TryOnSlot product={product} flags={flags} t={t} />
        </div>

        {/* 4. Name, specifications, today's estimate with its breakdown, buyback. */}
        <div className="min-w-0 md:row-span-2">
          {product.isConcept ? (
            <div className="bg-notice text-notice-foreground border-gold mb-5 rounded-sm border-l-4 px-4 py-3">
              <p className="text-[0.8125rem] font-bold tracking-[0.06em]">{p.conceptBanner}</p>
              <p className="mt-1 text-sm">{p.conceptBody}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {product.categoryName ? (
              <span className="text-gold-ink text-xs font-semibold tracking-[0.16em] uppercase">
                {product.categoryName}
              </span>
            ) : null}
            {product.status === "sold" ? <Badge tone="dark">{t.catalog.sold}</Badge> : null}
            {product.status === "out_of_stock" ? <Badge tone="dark">{t.catalog.outOfStock}</Badge> : null}
            {product.isDemo && !product.isConcept ? <Badge tone="notice">{t.catalog.demo}</Badge> : null}
          </div>
          <h1 className="mt-2 text-[1.75rem] font-medium break-words md:text-[2.5rem]">{name}</h1>
          {product.sku ? (
            <p className="text-muted-foreground mt-2 text-sm">
              {p.sku}: <span className="price">{product.sku}</span>
            </p>
          ) : null}
          {description ? <p className="mt-4 max-w-[65ch] break-words whitespace-pre-line">{description}</p> : null}

          <h2 className="mt-8 font-sans text-xs font-semibold tracking-[0.16em] uppercase">{p.specsTitle}</h2>
          <dl className="mt-2 border-t">
            <SpecRow label={p.karat}>
              {product.karatLabel}
              {priceRow?.purityPercent != null ? (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  ({p.purity.toLowerCase()} {formatPercent(priceRow.purityPercent, t.locale)})
                </span>
              ) : null}
            </SpecRow>
            <SpecRow label={product.grossWeightG !== null ? p.netWeight : p.weight}>
              <span className="price">{formatWeight(product.weightG)}</span>
            </SpecRow>
            {product.grossWeightG !== null && product.grossWeightG !== product.weightG ? (
              <SpecRow label={p.grossWeight}>
                <span className="price">{formatWeight(product.grossWeightG)}</span>
              </SpecRow>
            ) : null}
            {product.sizeOptions.length > 0 ? (
              <SpecRow label={p.sizes}>{product.sizeOptions.join(", ")}</SpecRow>
            ) : null}
            {gemstone ? <SpecRow label={p.gemstone}>{gemstone}</SpecRow> : null}
            {product.specs.map((entry) => {
              const text = specText(entry, t.locale);
              return (
                <SpecRow key={text.label} label={text.label}>
                  {text.value}
                </SpecRow>
              );
            })}
          </dl>

          {unavailable ? (
            <p className="bg-notice text-notice-foreground mt-5 rounded-sm px-3 py-2">{p.unavailable}</p>
          ) : null}

          <section
            aria-labelledby="estimate-title"
            className="@container bg-card border-t-gold mt-8 rounded-sm border border-t-2 p-[min(1.25rem,5vw)]"
          >
            <h2 id="estimate-title" className="text-xl font-medium">
              {p.estimateTitle}
            </h2>
            {priced.isManualPrice && priced.priceIdr !== null ? (
              <>
                <p className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold">{p.manualPrice}</span>
                  <span className="font-display price price-fit font-semibold">{formatIdr(priced.priceIdr)}</span>
                </p>
                <p className="text-muted-foreground mt-2 text-sm">{p.manualNote}</p>
              </>
            ) : estimate ? (
              <>
                <dl className="mt-4 space-y-2">
                  <BreakdownRow
                    label={p.goldValue}
                    detail={`${formatWeight(product.weightG)} × ${formatIdr(estimate.pricePerGramIdr)}`}
                    amount={estimate.goldValueIdr}
                  />
                  <BreakdownRow label={p.labour} amount={estimate.labourFeeIdr} />
                  {estimate.materialCostIdr > 0 ? (
                    <BreakdownRow label={p.material} amount={estimate.materialCostIdr} />
                  ) : null}
                  {estimate.markupIdr > 0 ? (
                    <BreakdownRow
                      label={fill(p.markup, {
                        percent: formatPercent(markupPercent, t.locale).replace("%", ""),
                      })}
                      amount={estimate.markupIdr}
                    />
                  ) : null}
                  {estimate.taxIdr > 0 ? (
                    <BreakdownRow
                      label={fill(p.tax, {
                        percent: formatPercent(pricing.taxPercent, t.locale).replace("%", ""),
                      })}
                      amount={estimate.taxIdr}
                    />
                  ) : null}
                  {estimate.roundingAdjustmentIdr !== 0 ? (
                    <BreakdownRow label={p.rounding} amount={estimate.roundingAdjustmentIdr} />
                  ) : null}
                </dl>
                <p className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 border-t pt-4">
                  <span className="font-semibold">{p.total}</span>
                  <span className="font-display price price-fit font-semibold">{formatIdr(estimate.totalIdr)}</span>
                </p>
                <p className="text-muted-foreground mt-2 text-sm">
                  {simulated ? `${p.simulated} ` : ""}
                  {fill(p.estimateNote, { updated: updatedLabel })}
                </p>
              </>
            ) : (
              <p className="mt-2">{p.onRequestBody}</p>
            )}
          </section>

          {buyback && !product.priceOnRequest ? (
            <section aria-labelledby="buyback-title" className="@container mt-4 rounded-sm border p-[min(1.25rem,5vw)]">
              <h2 id="buyback-title" className="text-lg font-medium">
                {p.buybackTitle}
              </h2>
              <dl className="mt-3 space-y-2">
                <BreakdownRow
                  label={p.buybackGross}
                  detail={`${formatWeight(product.weightG)} × ${formatIdr(buyback.buybackPerGramIdr)}`}
                  amount={buyback.grossIdr}
                />
                {buyback.deductionIdr > 0 ? (
                  <BreakdownRow label={p.buybackDeduction} amount={-buyback.deductionIdr} />
                ) : null}
              </dl>
              <p className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 border-t pt-3">
                <span className="font-semibold">{p.buybackTotal}</span>
                <span className="font-display price text-xl font-semibold">{formatIdr(buyback.totalIdr)}</span>
              </p>
              <p className="text-muted-foreground mt-2 text-sm">
                {simulated ? `${p.simulated} ` : ""}
                {p.buybackNote}
              </p>
            </section>
          ) : null}

          {/* 5. Actions. */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <WhatsAppButton
              number={ownerValue(store.whatsapp)}
              message={message}
              label={t.cta.whatsapp}
              missingLabel={t.cta.whatsappMissing}
              placement="product_page"
              product={product.slug}
              className="sm:flex-1"
            />
            <ShareButton title={name} label={t.cta.share} copiedLabel={t.cta.shareCopied} />
          </div>
          {/* A concept design cannot be reserved: there is no such piece in the shop. */}
          {flags.reserve && !unavailable && !product.isConcept ? (
            <ReserveForm slug={product.slug} locale={t.locale} privacyHref={to("/privasi")} t={t.reserve} />
          ) : null}
        </div>

        {/* 6. Trust box: under the photos on a wide screen, last on a phone. */}
        <section aria-labelledby="trust-title" className="rounded-sm border p-[min(1.25rem,5vw)] md:self-start">
          <h2 id="trust-title" className="text-lg font-medium">
            {p.trustTitle}
          </h2>
          {/* Links only: the full buyback policy is long and lives on the trust page. */}
          <ul className="mt-2">
            {t.home.trustItems.map((item) => (
              <li key={item.anchor}>
                <Link
                  href={to(`/kepercayaan#${item.anchor}`)}
                  className="hover:text-gold-ink flex min-h-11 items-center font-semibold underline underline-offset-4"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {similar.length > 0 ? (
        <section aria-labelledby="similar-title" className="bg-card border-t">
          <div className={`${container} py-12 md:py-16`}>
            <h2 id="similar-title" className="text-[1.75rem] font-medium">
              {p.similar}
            </h2>
            <div className="@container mt-6">
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

function Badge({ tone, children }: { tone: "dark" | "notice"; children: ReactNode }) {
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

function SpecRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-4 border-b py-2.5">
      <dt className="text-muted-foreground break-words">{label}</dt>
      <dd className="font-semibold break-words">{children}</dd>
    </div>
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
      {/* Same height as the breadcrumb line, so nothing jumps when the page arrives. */}
      <div className="h-13 md:h-15" />
      <div className={`${container} grid gap-x-14 gap-y-6 pt-2 md:grid-cols-2`}>
        <div className="bg-surface-muted aspect-square rounded-md" />
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
