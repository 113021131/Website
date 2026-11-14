import type { MetadataRoute } from "next";
import { absoluteUrl, allowIndexing } from "@/lib/seo";

/** Everything is closed to crawlers until NEXT_PUBLIC_ALLOW_INDEXING=true on the production deployment. */
export default function robots(): MetadataRoute.Robots {
  if (!allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/privasi", "/syarat"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
