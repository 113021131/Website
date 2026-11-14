"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { CACHE_TAGS } from "@/lib/data/public";
import { Constants } from "@/lib/supabase/database.types";
import { createServerSupabase } from "@/lib/supabase/server";

export type StoreFormState = { status: "idle" | "saved" | "error"; message: string; invalid: string[] };

const TIMEZONES = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as const;
const httpsUrl = z.url({ protocol: /^https$/ }).max(500);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

function invalidateEverything() {
  for (const tag of Object.values(CACHE_TAGS)) updateTag(tag);
}

/** Owner only. Blank fields are stored as null, which the site treats as "not provided". */
export async function saveStore(_previous: StoreFormState, formData: FormData): Promise<StoreFormState> {
  await requireAdmin("owner");
  const t = getDictionary().admin.store;
  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const optional = (name: string, max = 500) => text(name).slice(0, max) || null;
  const invalid: string[] = [];

  const name = text("name").slice(0, 120);
  if (!name) invalid.push("name");

  const urls: Record<string, string | null> = {};
  for (const field of ["mapsUrl", "reviewUrl", "reviewCardUrl", "instagram", "facebook", "tiktok"]) {
    const value = text(field);
    if (value && !httpsUrl.safeParse(value).success) invalid.push(field);
    urls[field] = value || null;
  }

  const whatsapp = text("whatsapp").replace(/[^\d+]/g, "");
  if (whatsapp && !/^\+?\d{8,15}$/.test(whatsapp)) invalid.push("whatsapp");
  const email = text("email");
  if (email && !z.email().safeParse(email).success) invalid.push("email");

  const hours = [];
  let anyHours = false;
  for (let day = 1; day <= 7; day++) {
    const closed = formData.get(`closed-${day}`) === "on";
    const open = text(`open-${day}`);
    const close = text(`close-${day}`);
    if (closed) {
      anyHours = true;
      hours.push({ day, closed: true });
    } else if (open || close) {
      anyHours = true;
      if (!time.safeParse(open).success || !time.safeParse(close).success) invalid.push(`open-${day}`);
      hours.push({ day, open, close, closed: false });
    }
  }

  const roundingMode = z.enum(Constants.public.Enums.rounding_mode).safeParse(text("roundingMode"));
  const roundingStep = z.coerce.number().int().min(1).max(1_000_000).safeParse(text("roundingStep"));
  const feeType = z.enum(Constants.public.Enums.labour_fee_type).safeParse(text("defaultFeeType"));
  const feeValue = z.coerce.number().min(0).max(1_000_000_000).safeParse(text("defaultFeeValue").replace(/\./g, "").replace(",", ".") || "0");
  const staleHours = z.coerce.number().int().min(1).max(720).safeParse(text("staleHours"));
  const timezone = z.enum(TIMEZONES).safeParse(text("timezone"));
  if (!roundingMode.success) invalid.push("roundingMode");
  if (!roundingStep.success) invalid.push("roundingStep");
  if (!feeType.success || !feeValue.success) invalid.push("defaultFeeValue");
  if (!staleHours.success) invalid.push("staleHours");
  if (!timezone.success) invalid.push("timezone");

  if (
    invalid.length > 0 ||
    !roundingMode.success ||
    !roundingStep.success ||
    !feeType.success ||
    !feeValue.success ||
    !staleHours.success ||
    !timezone.success
  ) {
    return { status: "error", message: t.failed, invalid };
  }

  const supabase = await createServerSupabase();
  const social = Object.fromEntries(
    (["instagram", "facebook", "tiktok"] as const).filter((key) => urls[key]).map((key) => [key, urls[key]]),
  );

  const storeUpdate = await supabase
    .from("stores")
    .update({
      name,
      tagline: optional("tagline", 160),
      address: optional("address"),
      city: optional("city", 80),
      province: optional("province", 80),
      postal_code: optional("postalCode", 10),
      landmarks: optional("landmarks"),
      maps_url: urls.mapsUrl,
      whatsapp: whatsapp || null,
      phone: optional("phone", 30),
      email: email || null,
      google_review_url: urls.reviewUrl,
      opening_hours: anyHours ? hours : null,
      social_links: social,
    })
    .eq("is_primary", true);

  const settingsUpdate = await supabase
    .from("site_settings")
    .update({
      rounding_mode: roundingMode.data,
      rounding_step_idr: roundingStep.data,
      default_labour_fee_type: feeType.data,
      default_labour_fee_value: feeValue.data,
      price_stale_hours: staleHours.data,
      timezone: timezone.data,
      demo_mode: formData.get("demoMode") === "on",
      review_card_url: urls.reviewCardUrl,
      feature_flags: {
        tryon: formData.get("flagTryon") === "on",
        viewer_3d: formData.get("flagViewer") === "on",
        reserve: formData.get("flagReserve") === "on",
      },
      trust_texts: {
        policy: optional("policy", 4000),
        certificates: optional("certificates", 2000),
        story: optional("story", 4000),
      },
    })
    .eq("id", 1);

  if (storeUpdate.error || settingsUpdate.error) return { status: "error", message: t.failed, invalid: [] };

  invalidateEverything();
  return { status: "saved", message: t.saved, invalid: [] };
}

export async function setKaratActive(karatId: number, isActive: boolean): Promise<{ ok: boolean }> {
  await requireAdmin("owner");
  if (!z.number().int().positive().safeParse(karatId).success) return { ok: false };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("karats").update({ is_active: isActive }).eq("id", karatId);
  if (!error) invalidateEverything();
  return { ok: !error };
}

export async function addKarat(code: string): Promise<{ ok: boolean }> {
  await requireAdmin("owner");
  const parsed = z.string().regex(/^\d{1,2}K$/).safeParse(code.trim().toUpperCase());
  if (!parsed.success) return { ok: false };
  const number = Number.parseInt(parsed.data, 10);
  if (number < 1 || number > 24) return { ok: false };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("karats")
    // Higher karat sorts first, matching the existing 24K → 16K order.
    .insert({ code: parsed.data, label: `Emas ${number} Karat`, sort_order: (25 - number) * 10 });
  if (!error) invalidateEverything();
  return { ok: !error };
}
