import type { Metadata } from "next";
import { Suspense } from "react";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { createServerSupabase } from "@/lib/supabase/server";
import { ImportForm } from "./import-form";

const t = getDictionary().admin.importCsv;

export const metadata: Metadata = { title: t.title };

export default function ImportProductsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      <p className="text-muted-foreground mt-1">{t.lead}</p>
      <p className="mt-3 text-sm">{t.columns}</p>
      <p className="mt-1">
        <a href="/templates/produk-contoh.csv" download className="text-brand inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
          {t.template}
        </a>
      </p>
      <Suspense fallback={<div className="mt-5 h-40 rounded-lg bg-background" />}>
        <Importer />
      </Suspense>
    </>
  );
}

async function Importer() {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const [{ data: karats }, { data: categories }] = await Promise.all([
    supabase.from("karats").select("code").eq("is_active", true),
    supabase.from("categories").select("slug").eq("is_active", true),
  ]);
  return (
    <ImportForm
      karatCodes={(karats ?? []).map((karat) => karat.code.toUpperCase())}
      categorySlugs={(categories ?? []).map((category) => category.slug)}
      t={t}
    />
  );
}
