"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { siteConfig } from "@/config/owner";
import { getDictionary } from "@/i18n";
import { createServerSupabase } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; message: string };

const emailSchema = z.email().max(254);

/**
 * Sends a one-time sign-in link. `shouldCreateUser: false` means a link is only
 * ever sent to accounts the owner created in Supabase Auth, so this form cannot
 * be used to send mail to strangers. The reply is the same whether or not the
 * email exists, so it does not reveal who has an account.
 */
export async function requestLoginLink(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const t = getDictionary().admin.login;

  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!parsed.success) return { status: "error", message: t.invalidEmail };

  const origin = (await headers()).get("origin") ?? siteConfig.url;
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${origin}/admin/auth/confirm` },
  });

  if (error?.status === 429) return { status: "error", message: t.rateLimited };
  return { status: "sent", message: t.sent };
}
