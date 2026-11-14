"use server";

import { ownerValue } from "@/config/owner";
import { fill, getDictionary, localePath } from "@/i18n";
import { getPrimaryStore, getProductBySlug, getSiteSettings, readFeatureFlags } from "@/lib/data/public";
import { formatWeight } from "@/lib/format";
import { absoluteUrl } from "@/lib/seo";
import { createPublicSupabase } from "@/lib/supabase/public";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export type ReserveState = {
  status: "idle" | "saved" | "error";
  message: string;
  field?: "name" | "phone" | "date" | "consent";
  whatsappUrl?: string | null;
};

/** Today's date in the shop's time zone, as YYYY-MM-DD. */
function todayIn(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

/**
 * Saves a reserve-for-pickup request. Runs as the anonymous role, so the only
 * thing it can do is insert a lead: RLS forbids reading or changing any, and a
 * database trigger limits how many one phone number can send per hour.
 */
export async function submitReservation(
  context: { slug: string; locale: string },
  _previous: ReserveState,
  formData: FormData,
): Promise<ReserveState> {
  const t = getDictionary(context.locale);
  const r = t.reserve;
  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const [product, store, settings] = await Promise.all([
    getProductBySlug(String(context.slug)),
    getPrimaryStore(),
    getSiteSettings(),
  ]);
  if (!product || product.status !== "published" || !readFeatureFlags(settings).reserve) {
    return { status: "error", message: r.errors.failed };
  }

  const name = text("name");
  if (name.length < 1 || name.length > 120) return { status: "error", message: r.errors.name, field: "name" };

  const phone = text("phone").replace(/[^\d+]/g, "");
  if (!/^\+?\d{8,15}$/.test(phone)) return { status: "error", message: r.errors.phone, field: "phone" };

  const date = text("date");
  if (date) {
    const today = todayIn(settings.timezone);
    const limit = `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today || date > limit) {
      return { status: "error", message: r.errors.date, field: "date" };
    }
  }

  if (formData.get("consent") !== "on") return { status: "error", message: r.errors.consent, field: "consent" };

  const url = absoluteUrl(localePath(t.locale, `/katalog/${product.slug}`));
  const whatsappUrl = buildWhatsAppUrl(
    ownerValue(store.whatsapp),
    fill(r.whatsapp, {
      brand: store.name,
      name,
      product: product.name,
      karat: product.karatCode,
      weight: formatWeight(product.weightG),
      date: date || r.dateUnset,
      url,
    }),
  );

  // Honeypot: a field people never see. A bot that fills it gets a normal-looking
  // answer and nothing is stored.
  if (text("company") !== "") return { status: "saved", message: r.success, whatsappUrl };

  const { error } = await createPublicSupabase()
    .from("leads")
    .insert({
      kind: "reservation",
      product_id: product.id,
      name,
      phone,
      preferred_date: date || null,
      note: text("note").slice(0, 1000) || null,
      consent: true,
      source_path: localePath(t.locale, `/katalog/${product.slug}`),
    });

  if (error) {
    return { status: "error", message: error.message.includes("lead_rate_limited") ? r.errors.rate : r.errors.failed };
  }
  return { status: "saved", message: r.success, whatsappUrl };
}
