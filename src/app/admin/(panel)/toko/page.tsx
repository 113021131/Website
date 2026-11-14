import type { Metadata } from "next";
import { Suspense } from "react";
import { ownerValue } from "@/config/owner";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { parseOpeningHours } from "@/lib/seo";
import { createServerSupabase } from "@/lib/supabase/server";
import { KaratManager, StoreForm, type StoreFormValues } from "./store-form";

const dictionary = getDictionary();
const t = dictionary.admin.store;

export const metadata: Metadata = { title: t.title };

export default function AdminStorePage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <p className="text-muted-foreground mt-1">{t.lead}</p>
      <Suspense fallback={<div className="mt-5 h-96 rounded-lg bg-background" />}>
        <StoreSettings />
      </Suspense>
    </>
  );
}

async function StoreSettings() {
  await requireAdmin("owner");
  const supabase = await createServerSupabase();
  const [{ data: store }, { data: settings }, { data: karats }] = await Promise.all([
    supabase.from("stores").select("*").eq("is_primary", true).single(),
    supabase.from("site_settings").select("*").eq("id", 1).single(),
    supabase.from("karats").select("id, code, is_active").order("sort_order"),
  ]);
  if (!store || !settings) return <p className="mt-5">{t.failed}</p>;

  // TODO_OWNER placeholders show as empty fields, ready to be filled in.
  const clean = (value: string | null | undefined) => ownerValue(value) ?? "";
  const social = (store.social_links ?? {}) as Record<string, string>;
  const trust = (settings.trust_texts ?? {}) as Record<string, string | null>;
  const flags = (settings.feature_flags ?? {}) as Record<string, boolean>;
  const saved = parseOpeningHours(store.opening_hours);

  const values: StoreFormValues = {
    text: {
      name: store.name,
      tagline: clean(store.tagline),
      address: clean(store.address),
      city: clean(store.city),
      province: clean(store.province),
      postalCode: clean(store.postal_code),
      landmarks: clean(store.landmarks),
      mapsUrl: clean(store.maps_url),
      whatsapp: clean(store.whatsapp),
      phone: clean(store.phone),
      email: clean(store.email),
      reviewUrl: clean(store.google_review_url),
      reviewCardUrl: clean(settings.review_card_url),
      instagram: social.instagram ?? "",
      facebook: social.facebook ?? "",
      tiktok: social.tiktok ?? "",
      policy: clean(trust.policy),
      certificates: clean(trust.certificates),
      story: clean(trust.story),
      roundingStep: String(settings.rounding_step_idr),
      defaultFeeValue: String(Number(settings.default_labour_fee_value)).replace(".", ","),
      staleHours: String(settings.price_stale_hours),
    },
    hours: Array.from({ length: 7 }, (_, index) => {
      const entry = saved.find((hour) => hour.day === index + 1);
      return {
        day: index + 1,
        open: entry?.open ?? "",
        close: entry?.close ?? "",
        closed: entry ? entry.closed && !entry.open : false,
      };
    }),
    roundingMode: settings.rounding_mode,
    defaultFeeType: settings.default_labour_fee_type,
    timezone: settings.timezone,
    checks: {
      demoMode: settings.demo_mode,
      flagTryon: flags.tryon === true,
      flagViewer: flags.viewer_3d === true,
      flagReserve: flags.reserve === true,
    },
  };

  return (
    <div className="mt-5 space-y-5">
      <StoreForm
        key={`${store.updated_at}-${settings.updated_at}`}
        values={values}
        days={dictionary.store.days}
        feeTypes={dictionary.admin.products.fields.feeTypes}
        t={t}
      />
      <KaratManager
        karats={(karats ?? []).map((karat) => ({ id: karat.id, code: karat.code, isActive: karat.is_active }))}
        t={t}
      />
    </div>
  );
}
