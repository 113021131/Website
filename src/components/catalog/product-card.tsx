import Link from "next/link";
import { localePath, type Dictionary } from "@/i18n";
import type { PricedProduct } from "@/lib/catalog";
import { formatIdr, formatWeight } from "@/lib/format";
import { productName } from "@/lib/product-text";
import { cn } from "@/lib/utils";
import { toJewelKind } from "./jewel-art";
import { ProductPhoto } from "./product-photo";

/**
 * Catalogue card: a square photograph on white, then category, name, karat and
 * net gold weight, and the estimated price. Built for the worst cases in
 * DESIGN.md: a very long name (clamped to two lines, full name stays in the
 * link's accessible name), a missing photo, Rp 100 juta+ beside 0,1 g, and sold
 * or out-of-stock items that stay visible but marked. Concept designs and other
 * demonstration products always carry a badge.
 */
export function ProductCard({
  product,
  t,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority = false,
}: {
  product: PricedProduct;
  t: Dictionary;
  sizes?: string;
  priority?: boolean;
}) {
  const photo = product.images[0];
  const name = productName(product, t.locale);
  const unavailable = product.status === "sold" || product.status === "out_of_stock";
  const statusLabel =
    product.status === "sold" ? t.catalog.sold : product.status === "out_of_stock" ? t.catalog.outOfStock : null;
  const demoLabel = product.isConcept ? t.catalog.concept : product.isDemo ? t.catalog.demo : null;

  return (
    <article className="group relative flex h-full flex-col">
      <div className="bg-card relative aspect-square overflow-hidden rounded-md border">
        <ProductPhoto
          src={photo?.url ?? null}
          alt={photo?.alt || name}
          sizes={sizes}
          priority={priority}
          className={cn(
            "object-cover transition-transform duration-500 ease-out-strong motion-safe:group-hover:scale-[1.03]",
            unavailable && "opacity-55",
          )}
          kind={toJewelKind(product.categorySlug)}
          fallbackLabel={product.isConcept ? t.product.photoPending : t.catalog.noPhoto}
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {statusLabel ? (
            <span className="bg-foreground rounded-sm px-1.5 py-0.5 text-xs font-semibold text-background">
              {statusLabel}
            </span>
          ) : null}
          {demoLabel ? (
            <span className="bg-notice text-notice-foreground rounded-sm px-1.5 py-0.5 text-xs font-semibold">
              {demoLabel}
            </span>
          ) : null}
        </div>
      </div>

      {product.categoryName ? (
        <p className="text-gold-ink mt-3 text-[0.6875rem] font-semibold tracking-[0.14em] break-words uppercase">
          {product.categoryName}
        </p>
      ) : null}
      <div className={cn("min-h-[2.5rem]", product.categoryName ? "mt-1" : "mt-3")}>
        <h3 className="line-clamp-2 font-sans text-[0.9375rem] leading-5 font-semibold break-words">
          {/* The stretched link makes the whole card one tap target. */}
          <Link
            href={localePath(t.locale, `/katalog/${product.slug}`)}
            className="focus-visible:after:outline-ring after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2"
          >
            {name}
          </Link>
        </h3>
      </div>
      <p className="price text-muted-foreground mt-1 text-[0.8125rem]">
        {product.karatCode}, {formatWeight(product.weightG)}
      </p>
      <div className="mt-auto pt-2">
        {product.priceIdr !== null ? (
          <p className="leading-tight">
            <span className="text-muted-foreground block text-xs">
              {product.isManualPrice ? t.product.manualPrice : t.catalog.estimated}
            </span>
            {/* An ordinary space after "Rp", so a very large amount can drop the number onto
                its own line in a narrow card. Digits never split: there is no break inside them. */}
            <span className="font-display text-[1.0625rem] font-semibold tabular-nums">
              {formatIdr(product.priceIdr).replace(" ", " ")}
            </span>
          </p>
        ) : (
          <p className="text-[0.8125rem] leading-tight font-semibold">{t.catalog.onRequest}</p>
        )}
      </div>
    </article>
  );
}
