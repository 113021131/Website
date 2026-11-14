import type { Metadata } from "next";
import { Suspense } from "react";
import Form from "next/form";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonPrimary, buttonSecondary, container, fieldInput, fieldLabel } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary } from "@/i18n";
import {
  catalogHref,
  filterCatalog,
  hasActiveFilters,
  parseCatalogQuery,
  priceProducts,
  roundingFromSettings,
  SORT_KEYS,
} from "@/lib/catalog";
import {
  getCatalogProducts,
  getCategories,
  getKarats,
  getPriceBoard,
  getPrimaryStore,
  getSiteSettings,
} from "@/lib/data/public";
import { breadcrumbJsonLd } from "@/lib/seo";

const t = getDictionary();
const c = t.catalog;

export const metadata: Metadata = {
  title: c.metaTitle,
  description: c.metaDescription,
  alternates: { canonical: "/katalog" },
};

export default function CatalogPage({ searchParams }: PageProps<"/katalog">) {
  return (
    <div className={`${container} py-8 md:py-12`}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.common.home, path: "/" },
          { name: t.nav.catalog, path: "/katalog" },
        ])}
      />
      <h1 className="text-[1.875rem] font-semibold md:text-[2.5rem]">{c.title}</h1>
      {/* The filters live in the URL, so results are read at request time behind this boundary. */}
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CatalogResults({ searchParams }: Pick<PageProps<"/katalog">, "searchParams">) {
  const query = parseCatalogQuery(await searchParams);
  const [board, settings, categories, karats, products, store] = await Promise.all([
    getPriceBoard(),
    getSiteSettings(),
    getCategories(),
    getKarats(),
    getCatalogProducts(),
    getPrimaryStore(),
  ]);

  const result = filterCatalog(priceProducts(products, board, roundingFromSettings(settings)), query);
  const filtersActive = hasActiveFilters(query);
  const selectClass = `${fieldInput} appearance-auto`;

  return (
    <>
      <Form action="/katalog" className="mt-5">
        <label htmlFor="catalog-q" className={fieldLabel}>
          {c.search}
        </label>
        <input
          id="catalog-q"
          name="q"
          type="search"
          defaultValue={query.q}
          placeholder={c.searchPlaceholder}
          autoComplete="off"
          enterKeyHint="search"
          maxLength={80}
          className={fieldInput}
        />

        <details className="group mt-3 rounded-md border" open={filtersActive || undefined}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-3 font-semibold [&::-webkit-details-marker]:hidden">
            {c.filters}
            <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="grid gap-3 border-t p-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label htmlFor="catalog-category" className={fieldLabel}>
                {c.category}
              </label>
              <select id="catalog-category" name="jenis" defaultValue={query.category} className={selectClass}>
                <option value="">{c.allCategories}</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="catalog-karat" className={fieldLabel}>
                {c.karat}
              </label>
              <select id="catalog-karat" name="kadar" defaultValue={query.karat} className={selectClass}>
                <option value="">{c.allKarats}</option>
                {karats.map((karat) => (
                  <option key={karat.code} value={karat.code}>
                    {karat.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="catalog-occasion" className={fieldLabel}>
                {c.occasion}
              </label>
              <select id="catalog-occasion" name="acara" defaultValue={query.occasion} className={selectClass}>
                <option value="">{c.allOccasions}</option>
                {Object.entries(c.occasions).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="catalog-min" className={fieldLabel}>
                {c.weightMin}
              </label>
              <input
                id="catalog-min"
                name="min"
                inputMode="decimal"
                autoComplete="off"
                defaultValue={query.minWeight ?? ""}
                className={fieldInput}
              />
            </div>
            <div>
              <label htmlFor="catalog-max" className={fieldLabel}>
                {c.weightMax}
              </label>
              <input
                id="catalog-max"
                name="maks"
                inputMode="decimal"
                autoComplete="off"
                defaultValue={query.maxWeight ?? ""}
                className={fieldInput}
              />
            </div>
          </div>
        </details>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1 basis-40">
            <label htmlFor="catalog-sort" className={fieldLabel}>
              {c.sort}
            </label>
            <select id="catalog-sort" name="urut" defaultValue={query.sort} className={selectClass}>
              {SORT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {c.sortOptions[key]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={buttonPrimary}>
            {c.apply}
          </button>
          {filtersActive ? (
            <Link href="/katalog" className={buttonSecondary}>
              {c.reset}
            </Link>
          ) : null}
        </div>
      </Form>

      <p className="text-muted-foreground mt-6 text-sm" role="status">
        {fill(c.count, { count: String(result.total) })}
      </p>

      {result.items.length > 0 ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {result.items.map((product, index) => (
            <li key={product.id}>
              <ProductCard product={product} t={t} priority={index < 2} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-surface-muted mt-3 rounded-lg px-4 py-10 text-center">
          <h2 className="text-xl font-semibold">{c.emptyTitle}</h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-[40ch]">{c.emptyBody}</p>
          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {filtersActive ? (
              <Link href="/katalog" className={buttonSecondary}>
                {c.reset}
              </Link>
            ) : null}
            <WhatsAppButton
              number={ownerValue(store.whatsapp)}
              message={fill(t.whatsappMessage.general, { brand: store.name })}
              label={t.cta.whatsapp}
              missingLabel={t.cta.whatsappMissing}
              placement="catalog_empty"
            />
          </div>
        </div>
      )}

      {result.pageCount > 1 ? (
        <nav aria-label={fill(c.page, { page: String(result.page), total: String(result.pageCount) })} className="mt-8">
          <div className="flex items-center justify-between gap-3">
            {result.page > 1 ? (
              <Link href={catalogHref({ ...query, page: result.page - 1 })} className={buttonSecondary} rel="prev">
                {c.prev}
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted-foreground text-sm">
              {fill(c.page, { page: String(result.page), total: String(result.pageCount) })}
            </span>
            {result.page < result.pageCount ? (
              <Link href={catalogHref({ ...query, page: result.page + 1 })} className={buttonSecondary} rel="next">
                {c.next}
              </Link>
            ) : (
              <span />
            )}
          </div>
        </nav>
      ) : null}
    </>
  );
}

/** Reserves the layout while results load, so nothing jumps. */
function CatalogSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="bg-surface-muted mt-5 h-[13.5rem] rounded-md" />
      <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index} className="rounded-lg border p-2.5">
            <div className="bg-surface-muted aspect-[4/5] rounded-md" />
            <div className="bg-surface-muted mt-2.5 h-4 w-4/5 rounded-sm" />
            <div className="bg-surface-muted mt-2 h-4 w-2/5 rounded-sm" />
            <div className="bg-surface-muted mt-4 h-5 w-3/5 rounded-sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
