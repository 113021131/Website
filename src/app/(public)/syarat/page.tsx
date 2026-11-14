import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getDictionary } from "@/i18n";

const legal = getDictionary().legal;

// Draft legal text: kept out of search results until the owner has had it reviewed.
export const metadata: Metadata = {
  title: legal.terms.metaTitle,
  alternates: { canonical: "/syarat" },
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return <LegalPage title={legal.terms.title} draftNotice={legal.draftNotice} sections={legal.terms.sections} />;
}
