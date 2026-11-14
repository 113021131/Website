import "server-only";
import { headers } from "next/headers";
import { after } from "next/server";
import { localePath, locales } from "@/i18n";

/**
 * Re-requests public pages after an admin change, once the admin's response has
 * been sent.
 *
 * Why: pages with a fixed address (home, price page) show a change on the very
 * next request. Pages with a variable address (/katalog/[slug]) hand the first
 * visitor after a change the previous copy while a fresh one is built. This
 * makes the server itself that "first visitor", so customers never get the old
 * estimate. It is best-effort: if a request fails (for example behind preview
 * protection) the page simply refreshes on its first real visit instead.
 */
export async function warmPaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) return;
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  const urls = paths.flatMap((path) => locales.map((locale) => `${protocol}://${host}${localePath(locale, path)}`));

  after(async () => {
    // A few at a time, so a large catalogue does not open hundreds of connections at once.
    for (let index = 0; index < urls.length; index += 8) {
      await Promise.allSettled(urls.slice(index, index + 8).map((url) => fetch(url, { cache: "no-store" })));
    }
  });
}
