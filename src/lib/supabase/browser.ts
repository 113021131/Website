import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Browser client for the admin's direct-to-storage uploads. It carries the
 * signed-in admin's session, so storage policies decide what it may write.
 */
export function createBrowserSupabase() {
  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
