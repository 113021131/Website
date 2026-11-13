import { id } from "./id";

/** Widens the literal strings of the source dictionary so other locales can differ. */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof id>;
export type Locale = "id";

export const defaultLocale: Locale = "id";
export const locales: readonly Locale[] = ["id"];

/** Add `en: () => import("./en")` here in Phase 2; pages already read copy through this. */
const dictionaries: Record<Locale, Dictionary> = { id };

export function getDictionary(locale: Locale = defaultLocale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

/** Replaces {placeholders} in a dictionary string. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
