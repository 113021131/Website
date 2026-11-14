import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlayCircleIcon } from "lucide-react";
import { JewelArt, toJewelKind } from "@/components/catalog/jewel-art";
import { ProductCard } from "@/components/catalog/product-card";
import { ShareButton } from "@/components/product/share-button";
import { ModelPreviewSlot, TryOnSlot } from "@/components/product/slots";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonSecondary, container } from "@/components/ui/styles";
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

type Props = PageProps<"/[locale]/katalog/[slug]">;

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
  const policy = ownerValue(((settings.trust_texts ?? {}) as Record<string, string>).policy);

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

  return (
    <div className={`${container} py-5 md:py-10`}>
      <JsonLd data={productJsonLd(priced, store.name, t.locale)} />
      <JsonLd data={breadcrumbJsonLd([...crumbs, { name: product.name, path: `/katalog/${product.slug}` }], t.locale)} />

      <nav aria-label={t.common.breadcrumb} className="text-muted-foreground text-sm">
        <ol className="flex flex-wrap items-center gap-x-1.5">
          {crumbs.map((crumb) => (
            <li key={crumb.path} className="flex items-center gap-x-1.5">
              <Link href={to(crumb.path)} className="flex min-h-11 items-center underline-offset-4 hover:underline">
                {crumb.name}
              </Link>
              <span aria-hidden="true">/</span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-x-12 gap-y-6 md:grid-cols-2">
        {/* 1. Photos: swipe on a phone, tap to open full size. Real photos are the truth. */}
        <div className="min-w-0">
          {product.images.length > 0 ? (
            <ul
              tabIndex={0}
              aria-label={p.gallery}
              className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:px-0"
            >
              {product.images.map((image, index) => (
                <li
                  key={image.url}
                  className="bg-surface-tint relative aspect-[4/5] w-[88%] shrink-0 snap-center overflow-hidden rounded-lg md:w-full"
                >
                  <a href={image.url} target="_blank" rel="noopener noreferrer" className="block h-full">
                    <Image
                      src={image.url}
                      alt={image.alt || fill(p.photoOf, { name: product.name })}
                      fill
                      priority={index === 0}
                      sizes="(min-width: 768px) 36rem, 88vw"
                      className="object-cover"
                    />
                  </a>
                  {product.images.length > 1 ? (
                    <span className="bg-foreground/75 absolute right-2 bottom-2 rounded-sm px-1.5 py-0.5 text-xs text-background">
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
          )}
          {product.videoUrl ? (
            <a href={product.videoUrl} target="_blank" rel="noopener noreferrer" className={`${buttonSecondary} mt-3 w-full`}>
              <PlayCircleIcon className="size-5" aria-hidden="true" />
              {p.video}
            </a>
          ) : null}
          {/* 2 and 3. Reserved for the 3D preview and "Coba Pakai"; hidden until enabled. */}
          <ModelPreviewSlot product={product} flags={flags} t={t} />
          <TryOnSlot product={product} flags={flags} t={t} />
        </div>

        {/* 4. Name, karat, weight, sizes, today's estimate with its breakdown. */}
        <div className="min-w-0">
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

          <section aria-labelledby="estimate-title" className="mt-5 rounded-sm border border-t-4 border-t-brand p-4">
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
                  <span className="font-display price text-[1.75rem] leading-9 font-semibold">
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

          {product.description ? (
            <p className="mt-6 max-w-[65ch] break-words whitespace-pre-line">{product.description}</p>
          ) : null}

          {/* 6. Trust box. */}
          <section aria-labelledby="trust-title" className="bg-surface-muted mt-6 rounded-lg p-4">
            <h2 id="trust-title" className="text-lg font-semibold">
              {p.trustTitle}
            </h2>
            {policy ? <p className="mt-2 break-words whitespace-pre-line">{policy}</p> : null}
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
      </div>

      {similar.length > 0 ? (
        <section aria-labelledby="similar-title" className="mt-10">
          <h2 id="similar-title" className="text-2xl font-semibold">
            {p.similar}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {similar.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} t={t} sizes="(min-width: 768px) 25vw, 50vw" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
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
        {detail ? <span className="price text-muted-foreground block text-sm">{detail}</span> : null}
      </dt>
      <dd className="price font-semibold">{formatIdr(amount)}</dd>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className={`${container} py-5 md:py-10`} aria-hidden="true">
      <div className="h-11" />
      <div className="grid gap-x-12 gap-y-6 md:grid-cols-2">
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
