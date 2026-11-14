import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { createServerSupabase } from "@/lib/supabase/server";
import { ArticleForm } from "../article-form";

const t = getDictionary().admin.articles;

export const metadata: Metadata = { title: t.editTitle };

type Props = PageProps<"/admin/artikel/[id]">;

/** `/admin/artikel/baru` creates; any numeric id edits. */
export default function EditArticlePage({ params }: Props) {
  return (
    <Suspense fallback={<div className="h-96 rounded-lg bg-background" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: Pick<Props, "params">) {
  await requireAdmin();
  const { id: raw } = await params;

  if (raw === "baru") {
    return (
      <>
        <h1 className="text-2xl font-semibold">{t.newTitle}</h1>
        <div className="mt-5 space-y-5">
          <ArticleForm articleId={null} values={{ title: "", slug: "", excerpt: "", body: "", status: "draft" }} t={t} />
        </div>
      </>
    );
  }

  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const supabase = await createServerSupabase();
  const { data: article } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (!article) notFound();

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.editTitle}</h1>
      {article.status === "published" ? (
        <p className="mt-2">
          <Link href={`/artikel/${article.slug}`} className="text-brand font-semibold underline-offset-4 hover:underline">
            {t.preview}
          </Link>
        </p>
      ) : null}
      <div className="mt-5 space-y-5">
        <ArticleForm
          articleId={article.id}
          values={{
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt ?? "",
            body: article.body_md,
            status: article.status,
          }}
          t={t}
        />
      </div>
    </>
  );
}
