import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { assertSupabaseEnv, supabasePublishableKey, supabaseUrl } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Session-aware client for /admin. Runs as the signed-in user, so every query is
 * still subject to RLS. Reads cookies, so it must be used at request time
 * (inside <Suspense>, a Server Action or a Route Handler), never in `use cache`.
 */
export async function createServerSupabase() {
  assertSupabaseEnv();
  // The auth client reads the clock while it loads the session. connection()
  // tells Next.js this work belongs to the live request, never to a prerender.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session cookie, so this is safe to ignore.
        }
      },
    },
  });
}
