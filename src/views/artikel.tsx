import type { Metadata } from "next";
import type { ViewProps } from "./types";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { container } from "@/components/ui/styles";
import { fill, getDictionary, localePath } from "@/i18n";
import { getArticles } from "@/lib/data/content";
import { getSiteSettings } from "@/lib/data/public";
import { formatDateTime } from "@/lib/format";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = ViewProps;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary((await params).locale);
  return pageMetadata(t, "/artikel", t.articles.metaTitle, t.articles.metaDescription);
}

export default async function ArticlesPage({ params }: Props) {
  const t = getDictionary((await params).locale);
  const a = t.articles;
  const [articles, settings] = await Promise.all([getArticles(), getSiteSettings()]);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: t.common.home, path: "/" },
            { name: t.nav.articles, path: "/artikel" },
          ],
          t.locale,
        )}
      />
      <PageHero title={a.title} lead={a.lead} />
      <div className={`${container} py-8 md:py-12`}>
      {a.languageNote ? <p className="bg-notice text-notice-foreground mb-6 max-w-[60ch] rounded-sm px-3 py-2">{a.languageNote}</p> : null}

      {articles.length > 0 ? (
        <ul className="grid gap-5 md:grid-cols-2">
          {articles.map((article) => (
            <li key={article.slug} lang="id">
              <Link
                href={localePath(t.locale, `/artikel/${article.slug}`)}
                className="hover:border-brand border-t-gold flex h-full flex-col rounded-sm border border-t-4 bg-background p-5"
              >
                <span className="font-display text-xl font-semibold break-words">{article.title}</span>
                {article.excerpt ? <span className="text-muted-foreground mt-2 line-clamp-3">{article.excerpt}</span> : null}
                {article.publishedAt ? (
                  <span className="text-muted-foreground price mt-3 text-sm">
                    {fill(a.published, { date: formatDateTime(article.publishedAt, settings.timezone, t.locale).slice(0, 11) })}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground bg-surface-muted rounded-lg px-4 py-10 text-center">{a.empty}</p>
      )}
      </div>
    </>
  );
}
