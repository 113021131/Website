import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getDictionary } from "@/i18n";
import { getPrimaryStore } from "@/lib/data/public";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const store = await getPrimaryStore();
  const t = getDictionary();

  return (
    <>
      <SiteHeader brand={store.name} t={t} />
      <main id="isi" className="flex-1">
        {children}
      </main>
      <SiteFooter store={store} t={t} />
    </>
  );
}
