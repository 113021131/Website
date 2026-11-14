import { en } from "./en";
import { id } from "./id";

/** Widens the literal strings of the source dictionary so other locales can differ. */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "id";

/** id.ts is the source of truth for the shape; every other locale must match it. */
export type Dictionary = Widen<Omit<typeof id, "locale">> & { locale: Locale };

const dictionaries: Record<Locale, Dictionary> = { id, en };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Accepts the raw route param; anything unknown falls back to Bahasa Indonesia. */
export function getDictionary(locale: string = defaultLocale): Dictionary {
  return dictionaries[isLocale(locale) ? locale : defaultLocale];
}

/**
 * Public URL for a path in a locale. Indonesian keeps the plain URL
 * (/harga-emas); other locales get a prefix (/en/harga-emas).
 */
export function localePath(locale: Locale, path: string): string {
  if (locale === defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** Replaces {placeholders} in a dictionary string. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
