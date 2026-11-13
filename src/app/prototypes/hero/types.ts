import type { Dictionary } from "@/i18n";
import type { PriceRow } from "@/lib/data/public";
import type { Rounding } from "@/lib/pricing/calculate";

/** Everything a hero variant needs. Built on the server, plain serialisable data. */
export type HeroData = {
  brand: string;
  rows: PriceRow[];
  /** "14 Nov 2026 09:30 WIB", already formatted in the shop's time zone. */
  updatedLabel: string | null;
  isStale: boolean;
  isDemo: boolean;
  /** Null while the owner has not supplied the number (TODO_OWNER). */
  whatsappNumber: string | null;
  rounding: Rounding;
  t: Dictionary;
};

export type VariantProps = { data: HeroData };
