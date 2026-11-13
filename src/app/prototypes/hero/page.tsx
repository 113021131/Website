import type { Metadata } from "next";
import { Suspense } from "react";
import { ownerValue } from "@/config/owner";
import { getDictionary } from "@/i18n";
import { getPriceBoard, getPrimaryStore, getSiteSettings } from "@/lib/data/public";
import { formatDateTime } from "@/lib/format";
import { Harness } from "./harness";
import type { HeroData } from "./types";

export const metadata: Metadata = {
  title: "Prototipe hero",
  robots: { index: false, follow: false },
};

/**
 * Phase 0 exploration: three homepage hero + price-strip directions.
 * Isolated on purpose. Delete this folder once a direction is promoted.
 */
export default function HeroPrototypePage() {
  return (
    <Suspense fallback={null}>
      <HeroPrototype />
    </Suspense>
  );
}

async function HeroPrototype() {
  const [board, store, settings] = await Promise.all([getPriceBoard(), getPrimaryStore(), getSiteSettings()]);

  const data: HeroData = {
    brand: store.name,
    rows: board.rows,
    updatedLabel: board.updatedAt ? formatDateTime(board.updatedAt, board.timeZone) : null,
    isStale: board.isStale,
    isDemo: board.isDemo,
    whatsappNumber: ownerValue(store.whatsapp),
    rounding: { mode: settings.rounding_mode, stepIdr: settings.rounding_step_idr },
    t: getDictionary(),
  };

  return <Harness data={data} />;
}
