/**
 * Proves what a logged-out visitor can and cannot do, against the real project,
 * using only the publishable key (exactly what the browser has).
 *
 * Read-only by design: every write below is expected to be REJECTED, so the
 * suite leaves no rows behind. Run with: npm run test:rls
 */
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/lib/supabase/database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const configured = Boolean(url && key);

const anon = configured
  ? createClient<Database>(url!, key!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

describe.skipIf(!configured)("RLS: anonymous visitor", () => {
  describe("can read public data", () => {
    it.each(["stores", "site_settings", "karats", "gold_prices", "gold_price_history", "categories"] as const)(
      "reads %s",
      async (table) => {
        const { data, error } = await anon!.from(table).select("*").limit(5);
        expect(error).toBeNull();
        expect(data!.length).toBeGreaterThan(0);
      },
    );

    it("never sees draft products", async () => {
      const { data, error } = await anon!.from("products").select("id").eq("status", "draft");
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it("never sees unpublished articles or testimonials", async () => {
      const articles = await anon!.from("articles").select("id").eq("status", "draft");
      const testimonials = await anon!.from("testimonials").select("id").eq("is_published", false);
      expect(articles.error).toBeNull();
      expect(articles.data).toEqual([]);
      expect(testimonials.error).toBeNull();
      expect(testimonials.data).toEqual([]);
    });
  });

  describe("cannot read private data", () => {
    it.each(["leads", "admin_users", "audit_log"] as const)("is refused on %s", async (table) => {
      const { data, error } = await anon!.from(table).select("*").limit(1);
      expect(error).not.toBeNull();
      expect(data).toBeNull();
    });
  });

  describe("cannot write", () => {
    it("cannot change a gold price", async () => {
      const before = await anon!.from("gold_prices").select("id, sell_idr").order("id").limit(1).single();
      expect(before.error).toBeNull();

      const attempt = await anon!
        .from("gold_prices")
        .update({ sell_idr: 1 })
        .eq("id", before.data!.id)
        .select();
      const after = await anon!.from("gold_prices").select("sell_idr").eq("id", before.data!.id).single();

      expect(attempt.error).not.toBeNull();
      expect(after.data!.sell_idr).toBe(before.data!.sell_idr);
    });

    it("cannot insert or delete a gold price", async () => {
      const insert = await anon!
        .from("gold_prices")
        .insert({ store_id: 1, karat_id: 1, sell_idr: 1, buyback_idr: 0 });
      const remove = await anon!.from("gold_prices").delete().gt("id", 0);
      const remaining = await anon!.from("gold_prices").select("id");

      expect(insert.error).not.toBeNull();
      expect(remove.error).not.toBeNull();
      expect(remaining.data!.length).toBeGreaterThan(0);
    });

    it("cannot forge price history or audit entries", async () => {
      const history = await anon!
        .from("gold_price_history")
        .insert({ store_id: 1, karat_id: 1, sell_idr: 1, buyback_idr: 0 });
      const audit = await anon!.from("audit_log").insert({ action: "insert", entity: "forged" });
      expect(history.error).not.toBeNull();
      expect(audit.error).not.toBeNull();
    });

    it("cannot create products, categories, articles or testimonials", async () => {
      const product = await anon!.from("products").insert({ slug: "x", name: "x", karat_id: 1, weight_g: 1 });
      const category = await anon!.from("categories").insert({ slug: "x", name: "x" });
      const article = await anon!.from("articles").insert({ slug: "x", title: "x" });
      const testimonial = await anon!
        .from("testimonials")
        .insert({ author_name: "x", body: "x", source_name: "x", source_url: "https://example.com" });
      for (const result of [product, category, article, testimonial]) {
        expect(result.error).not.toBeNull();
      }
    });

    it("cannot change store info or settings, or add itself as an admin", async () => {
      const store = await anon!.from("stores").update({ name: "Hacked" }).gt("id", 0).select();
      const settings = await anon!.from("site_settings").update({ demo_mode: false }).eq("id", 1).select();
      const admin = await anon!.from("admin_users").insert({ email: "attacker@example.com", role: "owner" });
      const storeNow = await anon!.from("stores").select("name").eq("is_primary", true).single();

      expect(store.error).not.toBeNull();
      expect(settings.error).not.toBeNull();
      expect(admin.error).not.toBeNull();
      expect(storeNow.data!.name).not.toBe("Hacked");
    });
  });

  describe("leads are insert-only, and only with consent", () => {
    it("rejects a lead without consent", async () => {
      const { error } = await anon!
        .from("leads")
        .insert({ name: "RLS test", phone: "081234567890", consent: false });
      expect(error).not.toBeNull();
    });

    it("rejects a lead that tries to set its own status", async () => {
      const { error } = await anon!
        .from("leads")
        .insert({ name: "RLS test", phone: "081234567890", consent: true, status: "done" });
      expect(error).not.toBeNull();
    });

    it("cannot update or delete leads", async () => {
      const update = await anon!.from("leads").update({ status: "done" }).gt("id", 0).select();
      const remove = await anon!.from("leads").delete().gt("id", 0);
      expect(update.error).not.toBeNull();
      expect(remove.error).not.toBeNull();
    });
  });
});
