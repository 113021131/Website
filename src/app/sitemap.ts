import type { MetadataRoute } from "next";
import { localePath, locales } from "@/i18n";
import { getCatalogProducts, getPriceBoard } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/seo";

type Entry = {
  path: string;
  lastModified?: string;
  changeFrequency: "daily" | "weekly" | "monthly";
  priority: number;
};

/** Every public page in every language, each pointing at its translations. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, board] = await Promise.all([getCatalogProducts(), getPriceBoard()]);
  const priceUpdated = board.updatedAt ?? undefined;

  const entries: Entry[] = [
    {
      path: "/",
      lastModified: priceUpdated,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      path: "/harga-emas",
      lastModified: priceUpdated,
      changeFrequency: "daily",
      priority: 0.9,
    },
    { path: "/katalog", changeFrequency: "daily", priority: 0.8 },
    { path: "/kalkulator", changeFrequency: "monthly", priority: 0.6 },
    { path: "/layanan", changeFrequency: "monthly", priority: 0.5 },
    { path: "/kepercayaan", changeFrequency: "monthly", priority: 0.6 },
    { path: "/toko", changeFrequency: "monthly", priority: 0.6 },
    { path: "/artikel", changeFrequency: "weekly", priority: 0.5 },
    ...products
      .filter((product) => !product.isConcept)
      .map((product) => ({
        path: `/katalog/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
  ];

  return entries.flatMap((entry) =>
    locales.map((locale) => ({
      url: absoluteUrl(localePath(locale, entry.path)),
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: locale === "id" ? entry.priority : Math.round(entry.priority * 8) / 10,
      alternates: {
        languages: Object.fromEntries(locales.map((other) => [other, absoluteUrl(localePath(other, entry.path))])),
      },
    })),
  );
}
