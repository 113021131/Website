import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { defaultLocale, getDictionary, isLocale, locales } from "@/i18n";
import { getPrimaryStore } from "@/lib/data/public";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PublicLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

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
