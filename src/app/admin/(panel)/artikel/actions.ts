"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDictionary } from "@/i18n";
import { requireAdmin } from "@/lib/auth/dal";
import { ARTICLES_TAG } from "@/lib/data/content";
import { createServerSupabase } from "@/lib/supabase/server";

export type ArticleFormState = {
  status: "idle" | "saved" | "error";
  message: string;
  errors: Partial<Record<"title" | "slug" | "body", string>>;
};

function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Create (articleId null) or update an article. The body is stored as Markdown text. */
export async function saveArticle(
  articleId: number | null,
  _previous: ArticleFormState,
  formData: FormData,
): Promise<ArticleFormState> {
  const admin = await requireAdmin();
  const t = getDictionary().admin.articles;
  const text = (name: string) => String(formData.get(name) ?? "").trim();

  const errors: ArticleFormState["errors"] = {};
  const title = text("title");
  if (title.length < 1 || title.length > 200) errors.title = t.validation.title;
  const rawSlug = text("slug");
  if (rawSlug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(rawSlug)) errors.slug = t.validation.slug;
  const body = String(formData.get("body") ?? "");
  if (body.length > 60_000) errors.body = t.validation.body;
  const status = z.enum(["draft", "published"]).safeParse(text("status"));
  if (Object.keys(errors).length > 0 || !status.success) return { status: "error", message: t.failed, errors };

  const supabase = await createServerSupabase();
  const row = {
    title,
    slug: rawSlug || slugify(title) || "artikel",
    excerpt: text("excerpt").slice(0, 300) || null,
    body_md: body,
    status: status.data,
  };
  const fail = (code?: string): ArticleFormState =>
    code === "23505"
      ? { status: "error", message: t.failed, errors: { slug: t.slugTaken } }
      : { status: "error", message: t.failed, errors: {} };

  if (articleId === null) {
    const { data, error } = await supabase
      .from("articles")
      .insert({ ...row, author_id: admin.userId, published_at: row.status === "published" ? new Date().toISOString() : null })
      .select("id")
      .single();
    if (error) return fail(error.code);
    updateTag(ARTICLES_TAG);
    redirect(`/admin/artikel/${data.id}`);
  }

  const { data: before } = await supabase.from("articles").select("published_at").eq("id", articleId).single();
  const { error } = await supabase
    .from("articles")
    .update({
      ...row,
      ...(row.status === "published" && !before?.published_at ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", articleId);
  if (error) return fail(error.code);

  updateTag(ARTICLES_TAG);
  return { status: "saved", message: t.saved, errors: {} };
}

export async function deleteArticle(articleId: number): Promise<void> {
  await requireAdmin();
  if (!z.number().int().positive().safeParse(articleId).success) return;
  const supabase = await createServerSupabase();
  await supabase.from("articles").delete().eq("id", articleId);
  updateTag(ARTICLES_TAG);
  redirect("/admin/artikel");
}
