"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { siteConfig } from "@/config/owner";
import { getDictionary } from "@/i18n";
import { createServerSupabase } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; message: string };

const emailSchema = z.email().max(254);

function readEmail(formData: FormData) {
  return emailSchema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
}

/** Email + password sign-in. Only accounts on the admin allowlist get past this. */
export async function signInWithPassword(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const t = getDictionary().admin.login;

  const email = readEmail(formData);
  if (!email.success) return { status: "error", message: t.invalidEmail };
  const password = String(formData.get("password") ?? "");
  if (password.length === 0) return { status: "error", message: t.passwordRequired };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.data, password });
  if (error?.status === 429) return { status: "error", message: t.rateLimited };
  // One message for "no such account" and "wrong password", so the form reveals nothing.
  if (error || !data.user) return { status: "error", message: t.wrong };

  const { data: admin } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { status: "error", message: t.noAccess };
  }

  redirect("/admin");
}

/**
 * Sends a one-time sign-in link. `shouldCreateUser: false` means a link is only
 * ever sent to accounts the owner created in Supabase Auth, so this form cannot
 * be used to send mail to strangers. The reply is the same whether or not the
 * email exists.
 */
export async function requestLoginLink(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const t = getDictionary().admin.login;

  const email = readEmail(formData);
  if (!email.success) return { status: "error", message: t.invalidEmail };

  const origin = (await headers()).get("origin") ?? siteConfig.url;
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${origin}/admin/auth/confirm` },
  });

  if (error?.status === 429) return { status: "error", message: t.rateLimited };
  return { status: "sent", message: t.sent };
}
