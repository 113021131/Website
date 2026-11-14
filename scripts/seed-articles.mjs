/**
 * Inserts the three draft article stubs from supabase/seed/article_stubs.sql
 * through the admin's own session (so RLS applies). Existing slugs are left alone.
 *
 *   node scripts/seed-articles.mjs
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } =
  process.env;
if (!url || !key || !E2E_ADMIN_EMAIL || !E2E_ADMIN_PASSWORD) throw new Error("Missing values in .env.local");

// Reads the stubs straight from the SQL file so there is one source of truth.
const sql = fs.readFileSync("supabase/seed/article_stubs.sql", "utf8").replace(/\r\n/g, "\n");
const pattern = /\(\n  '([^']+)',\n  '([^']+)',\n  '([^']+)',\n  'draft',\n  \$md\$([\s\S]*?)\$md\$\n\)/g;
const stubs = [...sql.matchAll(pattern)].map((match) => ({
  slug: match[1],
  title: match[2],
  excerpt: match[3],
  status: "draft",
  body_md: match[4],
}));
if (stubs.length === 0) throw new Error("No stubs found in the SQL file");

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const signIn = await supabase.auth.signInWithPassword({ email: E2E_ADMIN_EMAIL, password: E2E_ADMIN_PASSWORD });
if (signIn.error) throw new Error(`Sign-in failed: ${signIn.error.message}`);

const { data, error } = await supabase
  .from("articles")
  .upsert(stubs, { onConflict: "slug", ignoreDuplicates: true })
  .select("slug");
if (error) throw new Error(`Insert failed: ${error.message}`);
console.log(`Stubs in file: ${stubs.length}. Newly inserted: ${data.length}.`);
await supabase.auth.signOut();
