import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { container } from "@/components/ui/styles";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { ownerValue } from "@/config/owner";
import { fill, getDictionary } from "@/i18n";
import { getPrimaryStore } from "@/lib/data/public";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = PageProps<"/[locale]/layanan">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary((await params).locale);
  return pageMetadata(t, "/layanan", t.services.metaTitle, t.services.metaDescription);
}

export default async function ServicesPage({ params }: Props) {
  const t = getDictionary((await params).locale);
  const s = t.services;
  const store = await getPrimaryStore();
  const whatsapp = ownerValue(store.whatsapp);

  return (
    <div className={`${container} py-8 md:py-12`}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t.common.home, path: "/" },
          { name: t.nav.services, path: "/layanan" },
        ], t.locale)}
      />
      <h1 className="text-[1.875rem] font-semibold md:text-[2.5rem]">{s.title}</h1>
      <p className="text-muted-foreground mt-3 max-w-[60ch] text-lg">{s.lead}</p>

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {s.items.map((item) => (
          <li key={item.key} id={item.key} className="flex scroll-mt-4 flex-col rounded-lg border p-5">
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 mb-5 max-w-[55ch]">{item.body}</p>
            <WhatsAppButton
              number={whatsapp}
              message={fill(t.whatsappMessage.service, { brand: store.name, service: item.title.toLowerCase() })}
              label={s.ask}
              missingLabel={t.cta.whatsappMissing}
              placement={`service_${item.key}`}
              variant="outline"
              className="mt-auto self-start"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
