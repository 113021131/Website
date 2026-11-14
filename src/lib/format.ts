/**
 * Display formatting for id-ID. Pure functions, safe on server and client.
 *
 * Money and weight are formatted by hand rather than with Intl so the server and
 * every browser (including old Android WebViews) produce byte-identical text —
 * no hydration mismatch, no layout shift.
 */

const NBSP = " ";

function groupThousands(value: number): string {
  return Math.abs(Math.trunc(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "2.346.000", for table cells where the column header already says Rupiah. */
export function formatIdrPlain(amountIdr: number): string {
  return `${amountIdr < 0 ? "-" : ""}${groupThousands(amountIdr)}`;
}

/** "Rp 2.346.000". The space is non-breaking, so an amount never wraps mid-way. */
export function formatIdr(amountIdr: number): string {
  return `${amountIdr < 0 ? "-" : ""}Rp${NBSP}${groupThousands(amountIdr)}`;
}

/** "0,1 g", "12,5 g". Up to 3 decimals, trailing zeros dropped. */
export function formatWeight(weightG: number | string): string {
  const grams = typeof weightG === "string" ? Number(weightG) : weightG;
  if (!Number.isFinite(grams)) return "";
  const milligrams = Math.round(Math.abs(grams) * 1000);
  const whole = Math.floor(milligrams / 1000);
  const fraction = (milligrams % 1000).toString().padStart(3, "0").replace(/0+$/, "");
  return `${groupThousands(whole)}${fraction ? `,${fraction}` : ""}${NBSP}g`;
}

const TIMEZONE_ABBREVIATIONS: Record<string, string> = {
  "Asia/Jakarta": "WIB",
  "Asia/Pontianak": "WIB",
  "Asia/Makassar": "WITA",
  "Asia/Jayapura": "WIT",
};

/**
 * "14 Nov 2026 09:30 WIB". Input is a UTC ISO timestamp; output is shop-local time.
 * Uses Intl, so call it on the server and pass the string down.
 */
export function formatDateTime(isoUtc: string, timeZone = "Asia/Jakarta", locale: "id" | "en" = "id"): string {
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
    timeZone,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  const abbreviation = TIMEZONE_ABBREVIATIONS[timeZone] ?? timeZone;
  return `${get("day")} ${get("month")} ${get("year")} ${get("hour")}:${get("minute")} ${abbreviation}`;
}

/** True when the price was last updated more than `staleHours` ago. */
export function isPriceStale(updatedAtIso: string, nowMs: number, staleHours = 24): boolean {
  const updatedMs = new Date(updatedAtIso).getTime();
  if (Number.isNaN(updatedMs)) return true;
  return nowMs - updatedMs > staleHours * 60 * 60 * 1000;
}

/**
 * Reads a weight typed by a customer ("2,5" or "2.5").
 * Returns grams, or null when the text is not a positive weight with ≤ 3 decimals.
 */
export function parseWeightInput(raw: string): number | null {
  const normalised = raw.trim().replace(",", ".");
  if (!/^\d{1,5}(\.\d{1,3})?$/.test(normalised)) return null;
  const grams = Number(normalised);
  return grams > 0 ? grams : null;
}
