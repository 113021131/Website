import type { Metadata } from "next";
import { Suspense } from "react";
import { fill, getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { priceProducts, roundingFromSettings } from "@/lib/catalog";
import { getListedProducts, getPriceBoard } from "@/lib/data/public";
import { formatDateTime, formatIdrPlain } from "@/lib/format";
import { DEFAULT_PURITY_PERCENT, effectiveReference, REFERENCE_KARAT_CODE } from "@/lib/pricing/reference";
import { readPricingSettings } from "@/lib/pricing/settings";
import { createServerSupabase } from "@/lib/supabase/server";
import { PricingForm, type PricingFormKarat, type PricingFormProduct } from "./pricing-form";

const t = getDictionary().admin.pricing;

export const metadata: Metadata = { title: t.title };

export default function AdminPricingPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <p className="text-muted-foreground mt-1">{t.lead}</p>
      <p className="bg-card mt-3 rounded-sm border px-3 py-2 text-sm">{t.formula}</p>
      <Suspense fallback={<div className="bg-card mt-5 h-96 rounded-md" />}>
        <PricingEditor />
      </Suspense>
    </>
  );
}

async function PricingEditor() {
  const admin = await requireAdmin();
  const supabase = await createServerSupabase();

  const [{ data: settings }, { data: karats }, { data: prices }, { data: history }, { data: admins }, board, listed] =
    await Promise.all([
      supabase.from("site_settings").select("*").eq("id", 1).single(),
      supabase.from("karats").select("id, code, purity_percent, sort_order, is_active").order("sort_order"),
      supabase
        .from("gold_prices")
        .select("karat_id, sell_idr, buyback_idr, updated_at, updated_by, stores!inner(is_primary)")
        .eq("stores.is_primary", true),
      supabase
        .from("gold_price_history")
        .select("id, sell_idr, effective_at, changed_by, karats!inner(code)")
        .eq("karats.code", REFERENCE_KARAT_CODE)
        .order("effective_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(20),
      supabase.from("admin_users").select("user_id, email"),
      getPriceBoard(),
      getListedProducts(),
    ]);
  if (!settings || !karats) return <p className="text-destructive mt-5">{t.failed}</p>;

  const hasPricingColumn = "pricing" in settings;
  const pricing = readPricingSettings((settings as { pricing?: unknown }).pricing);
  const timeZone = settings.timezone;
  const who = (userId: string | null) => admins?.find((entry) => entry.user_id === userId)?.email ?? "sistem";

  const referenceKarat = karats.find((karat) => karat.code === REFERENCE_KARAT_CODE);
  const reference = prices?.find((row) => row.karat_id === referenceKarat?.id) ?? null;
  // When the stored settings cannot explain the stored reference (no pricing column yet,
  // or it was never filled), the reference itself is shown as the benchmark.
  const explained =
    reference !== null &&
    effectiveReference(pricing.benchmarkIdr, pricing.adjustmentPercent, pricing.perGramStepIdr) === reference.sell_idr;
  const benchmarkIdr = reference && !explained ? reference.sell_idr : pricing.benchmarkIdr;
  const adjustmentPercent = reference && !explained ? 0 : pricing.adjustmentPercent;

  const formKarats: PricingFormKarat[] = karats
    .filter((karat) => karat.is_active && karat.code !== REFERENCE_KARAT_CODE)
    .map((karat) => {
      const price = prices?.find((row) => row.karat_id === karat.id);
      return {
        id: karat.id,
        code: karat.code,
        purityPercent: karat.purity_percent ?? DEFAULT_PURITY_PERCENT[karat.code] ?? null,
        buybackPercent: pricing.buybackPercentByKarat[karat.code] ?? null,
        sellIdr: price?.sell_idr ?? null,
        buybackIdr: price?.buyback_idr ?? null,
      };
    });

  const rounding = roundingFromSettings(settings);
  const preview: PricingFormProduct[] = priceProducts(listed, {
    board,
    rounding,
    pricing,
  })
    .filter((product) => product.status === "published" && !product.priceOnRequest)
    .slice(0, 6)
    .map((product) => ({
      id: product.id,
      name: product.name,
      karatCode: product.karatCode,
      weightG: product.weightG,
      labourFee: { type: product.labourFeeType, value: product.labourFeeValue },
      materialCostIdr: product.materialCostIdr,
      markupPercent: product.markupPercent,
      manualPriceIdr: product.manualPriceIdr,
      nowIdr: product.priceIdr,
    }));

  // The cached price board already worked out "demo / outdated / current" for the public site.
  const status = board.status;

  return (
    <>
      {hasPricingColumn ? null : (
        <p className="bg-notice text-notice-foreground mt-4 rounded-sm px-3 py-2 text-sm">{t.migrationNotice}</p>
      )}
      <p className="mt-4 text-sm font-semibold">
        {reference
          ? fill(t.lastUpdated, {
              when: formatDateTime(reference.updated_at, timeZone),
              who: who(reference.updated_by),
            })
          : t.neverUpdated}{" "}
        <span className="bg-surface-muted rounded-sm px-1.5 py-0.5 font-normal">
          {t.statusLabel}: {t.status[status]}
        </span>
      </p>
      <div className="mt-4">
        {/* Keyed on the latest save so the inputs pick up stored values after a refresh. */}
        <PricingForm
          key={`${reference?.updated_at ?? "empty"}-${settings.updated_at}`}
          canEdit={admin.role === "owner"}
          initial={{
            benchmarkIdr,
            adjustmentPercent,
            source: pricing.source,
            sourceUrl: pricing.sourceUrl,
            retrievedAt: pricing.retrievedAt ? formatDateTime(pricing.retrievedAt, timeZone) : "",
            simulated: pricing.simulated,
            perGramStepIdr: pricing.perGramStepIdr,
            defaultMarkupPercent: pricing.defaultMarkupPercent,
            taxPercent: pricing.taxPercent,
            buybackPercent: pricing.buybackPercent,
            buybackDeductionIdr: pricing.buybackDeductionIdr,
          }}
          karats={formKarats}
          products={preview}
          rounding={rounding}
          t={t}
        />
      </div>

      <section aria-labelledby="reference-history" className="mt-10">
        <h2 id="reference-history" className="text-lg font-semibold">
          {t.historyTitle}
        </h2>
        {history && history.length > 0 ? (
          <div
            tabIndex={0}
            role="region"
            aria-labelledby="reference-history"
            className="bg-card mt-3 overflow-x-auto rounded-md border"
          >
            <table className="w-full min-w-[26rem] border-collapse text-sm">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.historyWhen}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {t.historyPrice}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.historyWho}
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-t">
                    <td className="price px-3 py-2">{formatDateTime(entry.effective_at, timeZone)}</td>
                    <td className="price px-3 py-2 text-right">{formatIdrPlain(entry.sell_idr)}</td>
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
