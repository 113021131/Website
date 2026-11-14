import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { buttonPrimary } from "@/components/ui/styles";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { createServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const t = getDictionary().admin.articles;

export const metadata: Metadata = { title: t.title };

export default function AdminArticlesPage() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <Link href="/admin/artikel/baru" className={buttonPrimary}>
          {t.add}
        </Link>
      </div>
      <Suspense fallback={<div className="mt-5 h-64 rounded-lg bg-background" />}>
        <Articles />
      </Suspense>
    </>
  );
}

async function Articles() {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("articles")
    .select("id, title, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (!data || data.length === 0) return <p className="text-muted-foreground mt-6">{t.empty}</p>;
  return (
    <ul className="mt-4 space-y-2">
      {data.map((article) => (
        <li key={article.id}>
          <Link
            href={`/admin/artikel/${article.id}`}
            className="hover:border-brand flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border bg-background px-4 py-3"
          >
            <span className="min-w-0 font-semibold break-words">{article.title}</span>
            <span className={cn("text-sm font-semibold", article.status === "published" ? "text-success" : "text-muted-foreground")}>
              {t.status[article.status]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
