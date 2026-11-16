import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/catalog/product-card";
import { SiteFooter } from "@/components/layout/site-footer";
import { PriceNotices, PriceTable } from "@/components/price/price-table";
import { cardGridColumns } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { formatDateTime } from "@/lib/format";
import { DATASETS, FIXTURES, type Dataset } from "./fixtures";

export const metadata: Metadata = { title: "break-ui", robots: { index: false, follow: false } };

const LABELS: Record<Dataset, string> = { demo: "Demo data", worst: "Worst case", empty: "Empty", one: "One" };

/**
 * Dev-only stress page: the catalogue card, the price table (both tones) and the
 * store block, fed kind data or the realistic worst case. Flip with the control
 * at the bottom, or ?data=worst. Never served in production.
 */
export default function BreakUiPage({ searchParams }: PageProps<"/dev/break-ui">) {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Suspense fallback={null}>
      <Stage searchParams={searchParams} />
    </Suspense>
  );
}

async function Stage({ searchParams }: Pick<PageProps<"/dev/break-ui">, "searchParams">) {
  const requested = (await searchParams).data;
  const dataset: Dataset = DATASETS.includes(requested as Dataset) ? (requested as Dataset) : "demo";
  const { products, board, store } = FIXTURES[dataset];
  const t = getDictionary();
  const updated = board.updatedAt ? formatDateTime(board.updatedAt, board.timeZone) : null;

  return (
    <>
      <main id="isi" className="flex-1 pb-24" data-break-ui={dataset}>
        <div className="on-dark bg-board text-board-foreground page-gutter py-6">
          <h1 className="text-[1.875rem] font-semibold">{t.price.title}</h1>
          {updated ? (
            <p className="text-board-accent mt-1.5 text-sm tabular-nums">
              {t.price.updated}: {updated}
            </p>
          ) : null}
          <div className="mt-4 max-w-xl">
            <PriceTable board={board} t={t} tone="dark" />
          </div>
          <div className="mt-4 max-w-xl">
            <PriceNotices board={board} t={t} tone="dark" />
          </div>
        </div>

        <div className="page-gutter mx-auto w-full max-w-[72rem] py-6">
          <div className="max-w-xl">
            <PriceTable board={board} t={t} />
          </div>
          <div className="mt-4 max-w-xl">
            <PriceNotices board={board} t={t} />
          </div>

          <h2 className="mt-8 text-2xl font-semibold">{t.catalog.title}</h2>
          {products.length > 0 ? (
            <div className="@container mt-3">
              <ul className={cardGridColumns}>
                {products.map((product) => (
                  <li key={product.id}>
                    <ProductCard product={product} t={t} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground mt-3">{t.catalog.emptyTitle}</p>
          )}
        </div>
      </main>

      <SiteFooter store={store} t={t} />

      {/* Harness chrome, not part of the design under test. */}
      <nav
        aria-label="Dataset"
        className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-0.5 rounded-full bg-neutral-200 p-1 font-[system-ui] text-[13px] shadow"
      >
        {DATASETS.map((key) => (
          <Link
            key={key}
            href={`/dev/break-ui?data=${key}`}
            aria-current={key === dataset ? "page" : undefined}
            className="rounded-full px-3 py-1.5 whitespace-nowrap text-neutral-700 aria-[current=page]:bg-white aria-[current=page]:text-black"
          >
            {LABELS[key]}
          </Link>
        ))}
      </nav>
    </>
  );
}
