/**
 * Shop facts are never invented. Anything the owner has not supplied yet is stored
 * as the literal marker below (in the `stores` row or here) and treated as "missing"
 * by the UI, which then shows a neutral fallback instead of a made-up value.
 *
 * To find every open placeholder:  grep -r "TODO_OWNER" src supabase docs
 */
export const TODO_OWNER = "TODO_OWNER";

/** Returns the value, or null when it is empty or still a TODO_OWNER placeholder. */
export function ownerValue(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.startsWith(TODO_OWNER)) return null;
  return trimmed;
}

export const siteConfig = {
  /** Spelling to be confirmed by the owner. */
  name: "Toko Emas Sinar Mas",
  locale: "id-ID",
  defaultTimeZone: "Asia/Jakarta",
  /** TODO_OWNER: production domain. Set NEXT_PUBLIC_SITE_URL in the environment. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    // On Vercel previews the deployment's own URL is the right origin.
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
} as const;
