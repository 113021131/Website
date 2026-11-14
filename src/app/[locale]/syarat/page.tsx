import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getDictionary } from "@/i18n";
import { localeAlternates } from "@/lib/seo";

type Props = PageProps<"/[locale]/syarat">;

// Draft legal text: kept out of search results until the owner has had it reviewed.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary((await params).locale);
  return {
    title: t.legal.terms.metaTitle,
    alternates: localeAlternates(t.locale, "/syarat"),
    robots: { index: false, follow: true },
  };
}

export default async function TermsPage({ params }: Props) {
  const legal = getDictionary((await params).locale).legal;
  return <LegalPage title={legal.terms.title} draftNotice={legal.draftNotice} sections={legal.terms.sections} />;
}
