import "server-only";
import { createClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, supabasePublishableKey, supabaseUrl } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Anonymous, cookie-less client for public reads inside `use cache` functions.
 * It sees exactly what a logged-out visitor may see under RLS.
 */
export function createPublicSupabase() {
  assertSupabaseEnv();
  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
