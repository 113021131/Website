import { z } from "zod";
import { ownerValue, siteConfig } from "@/config/owner";
import type { PricedProduct } from "@/lib/catalog";
import type { Store } from "@/lib/data/public";

/**
 * Search engines stay out until the owner flips this on for the production
 * deployment. Previews and the demo-data period are never indexed.
 */
export const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}

const openingHoursSchema = z.array(
  z.object({
    day: z.number().int().min(1).max(7),
    open: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    close: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    closed: z.boolean().optional(),
  }),
);

export type OpeningHour = { day: number; open: string | null; close: string | null; closed: boolean };

/** Reads stores.opening_hours. Returns [] when the owner has not filled it in. */
export function parseOpeningHours(value: unknown): OpeningHour[] {
  const parsed = openingHoursSchema.safeParse(value);
  if (!parsed.success) return [];
  return parsed.data
    .map((entry) => ({
      day: entry.day,
      open: entry.open ?? null,
      close: entry.close ?? null,
      closed: entry.closed === true || !entry.open || !entry.close,
    }))
    .sort((a, b) => a.day - b.day);
}

export function socialLinks(store: Store): string[] {
  const raw = (store.social_links ?? {}) as Record<string, unknown>;
  return Object.values(raw).filter((value): value is string => typeof value === "string" && value.startsWith("https://"));
}

const SCHEMA_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** JewelryStore structured data. Fields the owner has not supplied are left out, never invented. */
export function storeJsonLd(store: Store) {
  const street = ownerValue(store.address);
  const hours = parseOpeningHours(store.opening_hours).filter((entry) => !entry.closed);
  const sameAs = socialLinks(store);
  const phone = ownerValue(store.phone) ?? ownerValue(store.whatsapp);

  return {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: store.name,
    url: absoluteUrl("/"),
    ...(phone ? { telephone: phone } : {}),
    ...(street
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: street,
            ...(ownerValue(store.city) ? { addressLocality: ownerValue(store.city) } : {}),
            ...(ownerValue(store.province) ? { addressRegion: ownerValue(store.province) } : {}),
            ...(ownerValue(store.postal_code) ? { postalCode: ownerValue(store.postal_code) } : {}),
            addressCountry: "ID",
          },
        }
      : {}),
    ...(store.latitude != null && store.longitude != null
      ? { geo: { "@type": "GeoCoordinates", latitude: store.latitude, longitude: store.longitude } }
      : {}),
    ...(hours.length > 0
      ? {
          openingHoursSpecification: hours.map((entry) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: SCHEMA_DAYS[entry.day - 1],
            opens: entry.open,
            closes: entry.close,
          })),
        }
      : {}),
    ...(ownerValue(store.maps_url) ? { hasMap: ownerValue(store.maps_url) } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    currenciesAccepted: "IDR",
  };
}

export function faqJsonLd(items: readonly { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(product: PricedProduct, brand: string) {
  const availability =
    product.status === "published"
      ? "https://schema.org/InStoreOnly"
      : product.status === "sold"
        ? "https://schema.org/SoldOut"
        : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: absoluteUrl(`/katalog/${product.slug}`),
    ...(product.description ? { description: product.description } : {}),
    ...(product.images.length > 0 ? { image: product.images.map((image) => image.url) } : {}),
    ...(product.categoryName ? { category: product.categoryName } : {}),
    material: `Emas ${product.karatCode}`,
    weight: { "@type": "QuantitativeValue", value: product.weightG, unitCode: "GRM" },
    brand: { "@type": "Brand", name: brand },
    // An offer is only stated when there is a price to state; it is an estimate, sold in store.
    ...(product.estimate
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "IDR",
            price: product.estimate.totalIdr,
            availability,
            url: absoluteUrl(`/katalog/${product.slug}`),
          },
        }
      : {}),
  };
}
