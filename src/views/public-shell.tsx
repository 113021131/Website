import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { defaultLocale, getDictionary, type Locale } from "@/i18n";
import { getPrimaryStore } from "@/lib/data/public";

/** Header, main and footer around every public page, in one language. */
export async function PublicShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const store = await getPrimaryStore();
  const t = getDictionary(locale);

  return (
    // The document language is Indonesian; English pages mark their content as English.
    <div lang={locale === defaultLocale ? undefined : locale} className="flex flex-1 flex-col">
      <SiteHeader brand={store.name} t={t} />
      <main id="isi" className="flex-1">
        {children}
      </main>
      <SiteFooter store={store} t={t} />
    </div>
  );
}
