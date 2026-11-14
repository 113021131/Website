import { requireAdmin } from "@/lib/auth/dal";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * One CSV cell. Quotes are doubled, and a leading = + - @ is neutralised so a
 * value typed by a visitor can never run as a spreadsheet formula.
 */
function cell(value: string | number | null): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Downloads every reservation as CSV. Admins only; RLS applies as well. */
export async function GET() {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("id, created_at, status, kind, name, phone, preferred_date, note, source_path, products(name)")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) return new Response("Gagal memuat data.", { status: 500 });

  const header = ["id", "diterima_utc", "status", "jenis", "nama", "telepon", "rencana_datang", "produk", "catatan", "halaman"];
  const rows = data.map((lead) =>
    [
      lead.id,
      lead.created_at,
      lead.status,
      lead.kind,
      lead.name,
      lead.phone,
      lead.preferred_date,
      lead.products?.name ?? null,
      lead.note,
      lead.source_path,
    ]
      .map(cell)
      .join(","),
  );

  // The BOM makes Excel read the file as UTF-8.
  const body = `﻿${header.join(",")}\r\n${rows.join("\r\n")}\r\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservasi-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
