import type { Metadata } from "next";
import { Suspense } from "react";
import { fill, getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { formatDateTime, formatIdrPlain } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import { PriceForm, type PriceFormRow } from "./price-form";

const t = getDictionary().admin.prices;

export const metadata: Metadata = { title: t.title };

export default function AdminPricesPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <p className="text-muted-foreground mt-1">{t.lead}</p>
      <Suspense fallback={<div className="mt-5 h-96 rounded-lg bg-background" />}>
        <PriceEditor />
      </Suspense>
    </>
  );
}

async function PriceEditor() {
  await requireAdmin();
  const supabase = await createServerSupabase();

  const [{ data: karats }, { data: prices }, { data: history }, { data: admins }, { data: settings }] = await Promise.all([
    supabase.from("karats").select("id, code, sort_order").eq("is_active", true).order("sort_order"),
    supabase
      .from("gold_prices")
      .select("karat_id, sell_idr, buyback_idr, updated_at, updated_by, stores!inner(is_primary)")
      .eq("stores.is_primary", true),
    supabase
      .from("gold_price_history")
      .select("id, sell_idr, buyback_idr, effective_at, changed_by, karats(code)")
      .order("effective_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(30),
    supabase.from("admin_users").select("user_id, email"),
    supabase.from("site_settings").select("timezone").eq("id", 1).single(),
  ]);

  const timeZone = settings?.timezone ?? "Asia/Jakarta";
  const who = (userId: string | null) => admins?.find((admin) => admin.user_id === userId)?.email ?? t.unknownUser;

  const rows: PriceFormRow[] = (karats ?? []).map((karat) => {
    const price = prices?.find((entry) => entry.karat_id === karat.id);
    return { karatId: karat.id, karatCode: karat.code, sellIdr: price?.sell_idr ?? null, buybackIdr: price?.buyback_idr ?? null };
  });

  const latest = (prices ?? []).reduce<(typeof prices extends (infer R)[] | null ? R : never) | null>(
    (newest, entry) => (!newest || entry.updated_at > newest.updated_at ? entry : newest),
    null,
  );

  return (
    <>
      <p className="mt-4 text-sm font-semibold">
        {latest
          ? fill(t.lastUpdated, { when: formatDateTime(latest.updated_at, timeZone), who: who(latest.updated_by) })
          : t.neverUpdated}
      </p>
      <div className="mt-4">
        {/* Keyed on the latest change so the inputs pick up saved values after a refresh. */}
        <PriceForm key={latest?.updated_at ?? "empty"} rows={rows} t={t} />
      </div>

      <section aria-labelledby="history-title" className="mt-10">
        <h2 id="history-title" className="text-lg font-semibold">
          {t.historyTitle}
        </h2>
        {history && history.length > 0 ? (
          <div tabIndex={0} role="region" aria-labelledby="history-title" className="mt-3 overflow-x-auto rounded-lg border bg-background">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th scope="col" className="px-3 py-2 font-medium">{t.historyColumns.when}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t.historyColumns.karat}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{t.historyColumns.sell}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{t.historyColumns.buyback}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t.historyColumns.who}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-t">
                    <td className="price px-3 py-2">{formatDateTime(entry.effective_at, timeZone)}</td>
                    <td className="px-3 py-2 font-semibold">{entry.karats?.code}</td>
                    <td className="price px-3 py-2 text-right">{formatIdrPlain(entry.sell_idr)}</td>
                    <td className="price px-3 py-2 text-right">{formatIdrPlain(entry.buyback_idr)}</td>
                    <td className="max-w-[14rem] truncate px-3 py-2">{who(entry.changed_by)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground mt-2">{t.historyEmpty}</p>
        )}
      </section>
    </>
  );
}
