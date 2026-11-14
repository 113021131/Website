import type { MetadataRoute } from "next";
import { getCatalogProducts, getPriceBoard } from "@/lib/data/public";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, board] = await Promise.all([getCatalogProducts(), getPriceBoard()]);
  const priceUpdated = board.updatedAt ?? undefined;

  return [
    { url: absoluteUrl("/"), lastModified: priceUpdated, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/harga-emas"), lastModified: priceUpdated, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/katalog"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/layanan"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/kepercayaan"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/toko"), changeFrequency: "monthly", priority: 0.6 },
    ...products.map((product) => ({
      url: absoluteUrl(`/katalog/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
