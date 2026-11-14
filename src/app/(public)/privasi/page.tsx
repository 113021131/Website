import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { getDictionary } from "@/i18n";

const legal = getDictionary().legal;

// Draft legal text: kept out of search results until the owner has had it reviewed.
export const metadata: Metadata = {
  title: legal.privacy.metaTitle,
  alternates: { canonical: "/privasi" },
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return <LegalPage title={legal.privacy.title} draftNotice={legal.draftNotice} sections={legal.privacy.sections} />;
}
