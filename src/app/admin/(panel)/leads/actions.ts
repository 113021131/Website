"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { Constants } from "@/lib/supabase/database.types";
import { createServerSupabase } from "@/lib/supabase/server";

const idSchema = z.number().int().positive();

export async function setLeadStatus(leadId: number, status: string): Promise<{ ok: boolean }> {
  const admin = await requireAdmin();
  const parsed = z.enum(Constants.public.Enums.lead_status).safeParse(status);
  if (!idSchema.safeParse(leadId).success || !parsed.success) return { ok: false };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("leads")
    .update({
      status: parsed.data,
      // Records who dealt with it, the first time it leaves "new".
      ...(parsed.data === "new" ? { handled_by: null, handled_at: null } : { handled_by: admin.userId, handled_at: new Date().toISOString() }),
    })
    .eq("id", leadId);
  return { ok: !error };
}

/** Owner only (also enforced by RLS): removes a customer's details for good. */
export async function deleteLead(leadId: number): Promise<{ ok: boolean }> {
  await requireAdmin("owner");
  if (!idSchema.safeParse(leadId).success) return { ok: false };
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  return { ok: !error };
}
