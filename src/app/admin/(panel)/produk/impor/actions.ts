"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/dal";
import { CACHE_TAGS } from "@/lib/data/public";
import { Constants } from "@/lib/supabase/database.types";
import { createServerSupabase } from "@/lib/supabase/server";

const rowSchema = z.object({
  name: z.string().trim().min(1).max(200),
  categorySlug: z.string().trim().max(80),
  karatCode: z.string().trim().min(2).max(4),
  weightG: z.number().positive().max(99_999.999),
  feeType: z.enum(Constants.public.Enums.labour_fee_type),
  feeValue: z.number().min(0).max(1_000_000_000),
  sizes: z.array(z.string().trim().min(1).max(30)).max(30),
  occasions: z.array(z.string().trim().min(1).max(30)).max(10),
  description: z.string().max(4000),
});
const inputSchema = z.array(rowSchema).min(1).max(300);

export type ImportRow = z.input<typeof rowSchema>;

function slugify(text: string): string {
  return (
    text
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "produk"
  );
}

/**
 * First-load import. Every row is validated again here (the browser's preview is
 * a convenience, not a gate) and inserted as a draft in one statement, so either
 * all rows go in or none do.
 */
export async function importProducts(rows: ImportRow[]): Promise<{ ok: boolean; count: number }> {
  await requireAdmin();
  const parsed = inputSchema.safeParse(rows);
  if (!parsed.success) return { ok: false, count: 0 };

  const supabase = await createServerSupabase();
  const [{ data: karats }, { data: categories }, { data: existing }] = await Promise.all([
    supabase.from("karats").select("id, code").eq("is_active", true),
    supabase.from("categories").select("id, slug"),
    supabase.from("products").select("slug"),
  ]);
  if (!karats || !categories || !existing) return { ok: false, count: 0 };

  const taken = new Set(existing.map((row) => row.slug));
  const records = [];
  for (const row of parsed.data) {
    const karat = karats.find((entry) => entry.code.toUpperCase() === row.karatCode.toUpperCase());
    if (!karat) return { ok: false, count: 0 };
    const category = row.categorySlug ? categories.find((entry) => entry.slug === row.categorySlug) : null;
    if (row.categorySlug && !category) return { ok: false, count: 0 };

    const base = slugify(row.name);
    let slug = base;
    for (let suffix = 2; taken.has(slug); suffix++) slug = `${base}-${suffix}`;
    taken.add(slug);

    records.push({
      slug,
      name: row.name,
      description: row.description.trim() || null,
      category_id: category?.id ?? null,
      karat_id: karat.id,
      weight_g: Math.round(row.weightG * 1000) / 1000,
      labour_fee_type: row.feeType,
      labour_fee_value: row.feeValue,
      size_options: row.sizes,
      occasions: row.occasions,
      status: "draft" as const,
    });
  }

  const { data, error } = await supabase.from("products").insert(records).select("id");
  if (error) return { ok: false, count: 0 };

  updateTag(CACHE_TAGS.products);
  return { ok: true, count: data.length };
}
