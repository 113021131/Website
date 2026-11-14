import type { NextConfig } from "next";

/** Product photos are served from this project's public Supabase Storage bucket. */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  /**
   * Locale routing. Public pages live under app/[locale]. Indonesian is served at
   * the plain URL (/harga-emas is rewritten to /id/harga-emas internally) and
   * English at /en/…. The /id/… form is never shown: it redirects to the plain URL.
   */
  async redirects() {
    return [
      { source: "/id", destination: "/", permanent: true },
      { source: "/id/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/", destination: "/id" },
      // Everything that is not already localised, not the admin or dev tools,
      // not a framework path, and not a file with an extension.
      {
        source: "/:path((?!en$|en/|id$|id/|admin|dev/|_next|opengraph-image|[^/]*\\.[a-z0-9]+$).*)",
        destination: "/id/:path",
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
