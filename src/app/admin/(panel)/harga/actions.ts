"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { fill, getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { CACHE_TAGS } from "@/lib/data/public";
import { createServerSupabase } from "@/lib/supabase/server";

const WARN_CHANGE_PERCENT = 5;

const inputSchema = z.object({
  confirmed: z.boolean(),
  rows: z
    .array(
      z.object({
        karatId: z.number().int().positive(),
        sellIdr: z.number().int().positive().max(1_000_000_000),
        buybackIdr: z.number().int().min(0).max(1_000_000_000),
      }),
    )
    .min(1)
    .max(50),
});

export type SavePricesInput = z.input<typeof inputSchema>;
export type SavePricesResult =
  | { status: "saved"; message: string }
  | { status: "unchanged"; message: string }
  | { status: "confirm"; warnings: string[] }
  | { status: "error"; message: string };

function percentChange(before: number, after: number): number {
  return before === 0 ? 0 : (Math.abs(after - before) / before) * 100;
}

/**
 * Saves the price board. Warnings (buyback not below sell, a jump of more than
 * 5%) are worked out here from the database, not trusted from the browser; the
 * first call returns them and the second, confirmed call writes.
 */
export async function savePrices(input: SavePricesInput): Promise<SavePricesResult> {
  await requireAdmin();
  const t = getDictionary().admin.prices;
  const price = getDictionary().price;

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: t.invalid };

  const supabase = await createServerSupabase();
  const [{ data: store }, { data: karats }, { data: current }] = await Promise.all([
    supabase.from("stores").select("id").eq("is_primary", true).single(),
    supabase.from("karats").select("id, code"),
    supabase.from("gold_prices").select("karat_id, sell_idr, buyback_idr, stores!inner(is_primary)").eq("stores.is_primary", true),
  ]);
  if (!store || !karats || !current) return { status: "error", message: t.failed };

  const warnings: string[] = [];
  const changed = parsed.data.rows.filter((row) => {
    const karat = karats.find((entry) => entry.id === row.karatId);
    if (!karat) return false;
    const before = current.find((entry) => entry.karat_id === row.karatId);
    const isChanged = !before || before.sell_idr !== row.sellIdr || before.buyback_idr !== row.buybackIdr;
    if (!isChanged) return false;

    if (row.buybackIdr >= row.sellIdr) warnings.push(fill(t.warnBuyback, { karat: karat.code }));
    if (before) {
      for (const [field, old, next] of [
        [price.sell, before.sell_idr, row.sellIdr],
        [price.buyback, before.buyback_idr, row.buybackIdr],
      ] as const) {
        const percent = percentChange(old, next);
        if (percent > WARN_CHANGE_PERCENT) {
          warnings.push(
            fill(t.warnChange, { karat: karat.code, field: field.toLowerCase(), percent: percent.toFixed(1).replace(".", ",") }),
          );
        }
      }
    }
    return true;
  });

  if (changed.length === 0) return { status: "unchanged", message: t.nothingChanged };
  if (warnings.length > 0 && !parsed.data.confirmed) return { status: "confirm", warnings };

  const { error } = await supabase.from("gold_prices").upsert(
    changed.map((row) => ({
      store_id: store.id,
      karat_id: row.karatId,
      sell_idr: row.sellIdr,
      buyback_idr: row.buybackIdr,
    })),
    { onConflict: "store_id,karat_id" },
  );
  if (error) return { status: "error", message: t.failed };

  // Expire the cached price board now: the next visitor sees the new price.
  updateTag(CACHE_TAGS.prices);
  return { status: "saved", message: t.saved };
}
