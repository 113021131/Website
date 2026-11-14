import type { Metadata } from "next";
import type { ViewProps } from "./types";
import { LegalPage } from "@/components/legal-page";
import { getDictionary } from "@/i18n";
import { localeAlternates } from "@/lib/seo";

type Props = ViewProps;

// Draft legal text: kept out of search results until the owner has had it reviewed.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary((await params).locale);
  return {
    title: t.legal.privacy.metaTitle,
    alternates: localeAlternates(t.locale, "/privasi"),
    robots: { index: false, follow: true },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const legal = getDictionary((await params).locale).legal;
  return <LegalPage title={legal.privacy.title} draftNotice={legal.draftNotice} sections={legal.privacy.sections} />;
}
