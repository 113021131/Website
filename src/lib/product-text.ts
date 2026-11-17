import type { Locale } from "@/i18n";
import type { Product, ProductSpec } from "@/lib/data/public";

/** Product texts in the page's language. English falls back to Indonesian when no translation was entered. */
export function productName(product: Pick<Product, "name" | "nameEn">, locale: Locale): string {
  return locale === "en" ? product.nameEn || product.name : product.name;
}

export function productDescription(
  product: Pick<Product, "description" | "descriptionEn">,
  locale: Locale,
): string | null {
  return locale === "en" ? product.descriptionEn || product.description : product.description;
}

export function productGemstone(product: Pick<Product, "gemstone" | "gemstoneEn">, locale: Locale): string | null {
  return locale === "en" ? product.gemstoneEn || product.gemstone : product.gemstone;
}

export function specText(spec: ProductSpec, locale: Locale): { label: string; value: string } {
  return locale === "en" ? { label: spec.labelEn, value: spec.valueEn } : { label: spec.labelId, value: spec.valueId };
}

/** "75%", "99,9%" (Indonesian decimal comma) or "99.9%". */
export function formatPercent(value: number, locale: Locale): string {
  const text = String(Math.round(value * 100) / 100);
  return `${locale === "en" ? text : text.replace(".", ",")}%`;
}
