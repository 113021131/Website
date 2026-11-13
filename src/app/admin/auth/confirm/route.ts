import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const OTP_TYPES: readonly EmailOtpType[] = ["email", "magiclink", "signup", "invite", "recovery", "email_change"];

/**
 * Landing point of the sign-in link. Supports both link styles Supabase can send:
 * `?code=` (PKCE) and `?token_hash=&type=` (custom email template).
 * Always redirects to a fixed path, so the link cannot be used as an open redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createServerSupabase();
  let signedIn = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    signedIn = !error;
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    signedIn = !error;
  }

  const destination = request.nextUrl.clone();
  destination.search = "";
  destination.pathname = signedIn ? "/admin" : "/admin/login";
  if (!signedIn) destination.searchParams.set("alasan", "tautan");
  return NextResponse.redirect(destination);
}
