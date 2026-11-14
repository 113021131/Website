import Image from "next/image";
import Link from "next/link";
import { localePath, type Dictionary } from "@/i18n";
import type { PricedProduct } from "@/lib/catalog";
import { formatIdr, formatWeight } from "@/lib/format";
import { cn } from "@/lib/utils";
import { JewelArt, toJewelKind } from "./jewel-art";

/**
 * Catalogue card. Built for the worst cases in DESIGN.md: a very long name
 * (clamped to two lines, full name stays in the link's accessible name), a
 * missing photo, Rp 100 juta+ beside 0,1 g, and sold / out-of-stock items that
 * stay visible but marked.
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
  const unavailable = product.status === "sold" || product.status === "out_of_stock";
  const statusLabel =
    product.status === "sold" ? t.catalog.sold : product.status === "out_of_stock" ? t.catalog.outOfStock : null;

  return (
    <article className="relative flex h-full flex-col rounded-lg border bg-background p-2.5">
      <div className="bg-surface-tint relative aspect-[4/5] overflow-hidden rounded-md">
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.alt || product.name}
            fill
            sizes={sizes}
            priority={priority}
            className={cn("object-cover", unavailable && "opacity-55")}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-2 text-center">
            <JewelArt kind={toJewelKind(product.categorySlug)} className="size-16" />
            <span className="text-muted-foreground text-xs">{t.catalog.noPhoto}</span>
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {statusLabel ? (
            <span className="bg-foreground rounded-sm px-1.5 py-0.5 text-xs font-semibold text-background">
              {statusLabel}
            </span>
          ) : null}
          {product.isDemo ? (
            <span className="bg-notice text-notice-foreground rounded-sm px-1.5 py-0.5 text-xs font-semibold">
              {t.catalog.demo}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 min-h-[2.25rem]">
        <h3 className="line-clamp-2 font-sans text-sm leading-[1.125rem] font-semibold break-words">
          {/* The stretched link makes the whole card one tap target. */}
          <Link href={localePath(t.locale, `/katalog/${product.slug}`)} className="focus-visible:after:outline-ring after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2">
            {product.name}
          </Link>
        </h3>
      </div>
      <p className="price text-muted-foreground mt-1 text-[0.8125rem]">
        {product.karatCode}, {formatWeight(product.weightG)}
      </p>
      <div className="mt-auto pt-1.5">
        {product.estimate ? (
          <p className="leading-tight">
            <span className="text-muted-foreground block text-xs">{t.catalog.estimated}</span>
            <span className="price text-[0.9375rem] font-semibold">{formatIdr(product.estimate.totalIdr)}</span>
          </p>
        ) : (
          <p className="text-[0.8125rem] leading-tight font-semibold">{t.catalog.onRequest}</p>
        )}
      </div>
    </article>
  );
}
