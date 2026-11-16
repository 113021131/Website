import type { Metadata } from "next";
import type { SlugViewProps } from "./types";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { ArticleBody } from "@/components/article-body";
import { JsonLd } from "@/components/seo/json-ld";
import { container } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary, localePath } from "@/i18n";
import { getArticleBySlug, getArticles } from "@/lib/data/content";
import { getPrimaryStore, getSiteSettings } from "@/lib/data/public";
import { formatDateTime } from "@/lib/format";
import { absoluteUrl, breadcrumbJsonLd, localeAlternates } from "@/lib/seo";

type Props = SlugViewProps;

export async function generateStaticParams() {
  const articles = await getArticles();
  // Cache Components needs at least one entry; an unknown slug renders "not found".
  return articles.length > 0 ? articles.map((article) => ({ slug: article.slug })) : [{ slug: "-" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = getDictionary(locale);
  const article = await getArticleBySlug(slug);
  if (!article) return { title: t.articles.notFoundTitle, robots: { index: false } };
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
    // Articles exist in Indonesian only, so the Indonesian URL is the canonical one.
    alternates: { ...localeAlternates(t.locale, `/artikel/${article.slug}`), canonical: `/artikel/${article.slug}` },
    openGraph: { type: "article", title: article.title, description: article.excerpt ?? undefined },
  };
}

export default function ArticlePage({ params }: Props) {
  return (
    <Suspense fallback={<div className={`${container} py-8`} aria-hidden="true"><div className="bg-surface-muted h-96 rounded-lg" /></div>}>
      <ArticleDetail params={params} />
    </Suspense>
  );
}

async function ArticleDetail({ params }: Pick<Props, "params">) {
  const { slug, locale } = await params;
  const t = getDictionary(locale);
  const a = t.articles;
  const [article, store, settings] = await Promise.all([getArticleBySlug(slug), getPrimaryStore(), getSiteSettings()]);
  if (!article) notFound();

  return (
    <article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          inLanguage: "id",
          ...(article.excerpt ? { description: article.excerpt } : {}),
          ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
          dateModified: article.updatedAt,
          publisher: { "@type": "Organization", name: store.name },
          mainEntityOfPage: absoluteUrl(`/artikel/${article.slug}`),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: t.common.home, path: "/" },
            { name: t.nav.articles, path: "/artikel" },
            { name: article.title, path: `/artikel/${article.slug}` },
          ],
          t.locale,
        )}
      />

      {/* Title band on the maroon surface, like every other page. */}
      <header className="on-dark bg-board text-board-foreground">
        <div className={`${container} pt-1 pb-8 md:pt-6 md:pb-12`}>
          <Link
            href={localePath(t.locale, "/artikel")}
            className="text-board-accent inline-flex min-h-11 items-center gap-1.5 font-semibold underline-offset-4 hover:underline"
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            {a.back}
          </Link>
          <h1 lang="id" className="mt-2 max-w-[24ch] text-[1.875rem] font-semibold break-words md:text-[2.75rem]">
            {article.title}
          </h1>
          {article.excerpt ? (
            <p lang="id" className="text-board-muted mt-3 max-w-[38rem] md:text-lg">
              {article.excerpt}
            </p>
          ) : null}
          {article.publishedAt ? (
            <p className="text-board-accent mt-4 text-sm font-semibold tabular-nums">
              {fill(a.published, { date: formatDateTime(article.publishedAt, settings.timezone, "id").slice(0, 11) })}
            </p>
          ) : null}
        </div>
      </header>

      <div className={`${container} py-8 md:py-12`}>
        {a.languageNote ? (
          <p className="bg-notice text-notice-foreground mb-6 max-w-[65ch] rounded-sm px-3 py-2">{a.languageNote}</p>
        ) : null}
        <div lang="id" className="max-w-[65ch] [&>.article-body]:mt-0 [&_h2:first-child]:mt-0">
          <ArticleBody markdown={article.bodyMd} />
        </div>

        <div className="border-t-gold mt-10 max-w-[65ch] rounded-sm border border-t-4 bg-background p-[min(1rem,5vw)] md:p-5">
          <WhatsAppButton
            number={ownerValue(store.whatsapp)}
            message={fill(t.whatsappMessage.general, { brand: store.name })}
            label={t.cta.whatsapp}
            missingLabel={t.cta.whatsappMissing}
            placement="article"
            variant="outline"
          />
        </div>
      </div>
    </article>
  );
}
